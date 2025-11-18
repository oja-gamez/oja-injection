/**
 * OjaInjection Scope - Manages scoped service lifetimes
 */

import { RunService } from "@rbxts/services";
import type { Container } from "./Container";
import type { Token, Constructor, IScopeDebugInfo, IDestroyable, IStartable, ITickable, IFixedTickable, IRenderTickable } from "./Types";
import type { ResolutionContext } from "./Types/Diagnostics";
import { isToken } from "../Tokens/CreateToken";
import { ContainerErrors } from "./ContainerErrors";

/**
 * Scope for scoped service management.
 * Handles scoped instances, child scopes, lifecycle, and tick management.
 */
export class Scope {
	private _container: Container;
	private _parent?: Scope;
	private _scopeId: string;
	private _createdAt: number;

	// Scoped instances cached in this scope
	private _scopedInstances = new Map<Token | Constructor, unknown>();

	// Child scopes
	private _childScopes: Scope[] = [];

	// Externally provided instances
	private _externalInstances = new Map<Token | Constructor, unknown>();

	// Lifecycle tracking
	private _destroyed = false;
	private _destroyables: IDestroyable[] = [];

	// Tick management
	private _tickables: ITickable[] = [];
	private _fixedTickables: IFixedTickable[] = [];
	private _renderTickables: IRenderTickable[] = [];
	private _heartbeatConnection?: RBXScriptConnection;
	private _renderSteppedConnection?: RBXScriptConnection;

	/**
	 * @internal
	 */
	constructor(container: Container, parent?: Scope, id?: string) {
		this._container = container;
		this._parent = parent;
		this._scopeId = id || `scope-${os.time()}-${math.random()}`;
		this._createdAt = os.clock();
	}

	/**
	 * Resolves a service from this scope.
	 * @internal - Not exposed on IScope interface
	 */
	Resolve<T>(token: Token<T> | Constructor<T>): T {
		const context: ResolutionContext = {
			Chain: [],
		};
		return this.ResolveWithContext(token, context);
	}

	/**
	 * Resolves a service from this scope with resolution context.
	 * @internal
	 */
	ResolveWithContext<T>(token: Token<T> | Constructor<T>, context: ResolutionContext): T {
		if (this._destroyed) {
			error(`Cannot resolve from destroyed scope: ${this._scopeId}`);
		}

		// Check external instances first
		if (this._externalInstances.has(token)) {
			return this._externalInstances.get(token) as T;
		}

		// Check scoped instance cache
		if (this._scopedInstances.has(token)) {
			return this._scopedInstances.get(token) as T;
		}

		// Get registration from container
		const registration = this._container.GetRegistration(token);
		if (!registration) {
			// Try parent scope
			if (this._parent) {
				return this._parent.ResolveWithContext(token, context);
			}
			ContainerErrors.MissingRegistration(token, context);
		}

		// Resolve based on lifetime
		if (registration.Lifetime === "singleton") {
			// Delegate to container (which will use context)
			return this._container.Resolve(token);
		} else if (registration.Lifetime === "scoped") {
			// Create and cache in this scope
			const instance = this._container.CreateInstanceWithContext<T>(registration, context, this);
			this._scopedInstances.set(token, instance);

			// Track for lifecycle
			this.TrackInstance(instance);

			return instance;
		} else {
			// Factory - create new instance every time (untracked, caller manages lifecycle)
			return this._container.CreateInstanceWithContext<T>(registration, context, this);
		}
	}

	/**
	 * Creates a child scope.
	 */
	CreateChildScope(id?: string): Scope {
		if (this._destroyed) {
			error(`Cannot create child scope from destroyed scope: ${this._scopeId}`);
		}

		const childScope = new Scope(this._container, this, id);
		this._childScopes.push(childScope);
		return childScope;
	}

	/**
	 * Provides externally-created runtime data to the scope.
	 * Public API exposed on IScope interface.
	 */
	ProvideRuntime<T>(token: Token<T> | Constructor<T>, instance: T): void {
		if (this._destroyed) {
			error(`Cannot provide to destroyed scope: ${this._scopeId}`);
		}

		this._externalInstances.set(token, instance);
		this.TrackInstance(instance);
	}

	/**
	 * Synchronously destroys the scope and all scoped instances.
	 */
	Destroy(): void {
		if (this._destroyed) return;

		// Disconnect tick connections
		this._heartbeatConnection?.Disconnect();
		this._renderSteppedConnection?.Disconnect();

		// Destroy child scopes first
		for (const child of this._childScopes) {
			child.Destroy();
		}

		// Call Destroy() on all IDestroyable services
		for (const destroyable of this._destroyables) {
			try {
				destroyable.Destroy();
			} catch (e) {
				warn(`Error destroying service in scope ${this._scopeId}: ${e}`);
			}
		}

		// Clear caches
		this._scopedInstances.clear();
		this._externalInstances.clear();
		this._childScopes = [];
		this._tickables = [];
		this._fixedTickables = [];
		this._renderTickables = [];
		this._destroyables = [];

		this._destroyed = true;
	}

	/**
	 * Gets debug information about this scope.
	 */
	DebugServices(): IScopeDebugInfo {
		const services: IScopeDebugInfo["Services"] = [];

		// Add scoped instances
		for (const [token, instance] of this._scopedInstances) {
			services.push({
				Name: this.GetTokenName(token),
				Type: typeOf(instance),
				Lifetime: "scoped",
				CreatedAt: this._createdAt,
			});
		}

		// Add external instances
		for (const [token, instance] of this._externalInstances) {
			services.push({
				Name: this.GetTokenName(token),
				Type: typeOf(instance),
				Lifetime: "scoped",
				CreatedAt: this._createdAt,
			});
		}

		return {
			ScopeId: this._scopeId,
			CreatedAt: this._createdAt,
			ParentScopeId: this._parent?.GetScopeId(),
			Services: services,
			ChildScopes: this._childScopes.size(),
			TotalServices: services.size(),
		};
	}

	/**
	 * Gets the scope ID.
	 */
	GetScopeId(): string {
		return this._scopeId;
	}

	// ===== Internal Methods =====

	/**
	 * Starts all IStartable instances synchronously.
	 * Call this after resolving all services in the scope.
	 *
	 * IMPORTANT: All external async resources (ProfileStore, connections) must be
	 * loaded BEFORE creating the scope and provided via tokens. Services should only
	 * do synchronous setup in Start().
	 *
	 * @internal
	 */
	StartAll(): void {
		// Collect all instances from both maps
		const allInstances = [] as defined[];
		this._scopedInstances.forEach((instance) => {
			allInstances.push(instance as defined);
		});
		this._externalInstances.forEach((instance) => {
			allInstances.push(instance as defined);
		});

		// Call Start() on all IStartable instances
		for (const instance of allInstances) {
			if (this.IsStartable(instance)) {
				try {
					instance.Start();
				} catch (e) {
					warn(`Error starting service in scope ${this._scopeId}: ${e}`);
				}
			}
		}
	}

	/**
	 * Tracks an instance for lifecycle and tick management.
	 * Note: Does NOT call Start() - that's handled by StartAll().
	 * @internal
	 */
	private TrackInstance(instance: unknown): void {
		// Check for IDestroyable
		if (this.IsDestroyable(instance)) {
			this._destroyables.push(instance);
		}

		// Check for ITickable
		if (this.IsTickable(instance)) {
			this._tickables.push(instance);
			this.EnsureHeartbeatConnection();
		}

		// Check for IFixedTickable
		if (this.IsFixedTickable(instance)) {
			this._fixedTickables.push(instance);
			this.EnsureHeartbeatConnection();
		}

		// Check for IRenderTickable
		if (this.IsRenderTickable(instance)) {
			this._renderTickables.push(instance);
			this.EnsureRenderSteppedConnection();
		}
	}

	/**
	 * Ensures Heartbeat connection exists.
	 */
	private EnsureHeartbeatConnection(): void {
		if (!this._heartbeatConnection) {
			this._heartbeatConnection = RunService.Heartbeat.Connect((deltaTime) => {
				this.TickAll(deltaTime);
			});
		}
	}

	/**
	 * Ensures RenderStepped connection exists.
	 */
	private EnsureRenderSteppedConnection(): void {
		if (!this._renderSteppedConnection && RunService.IsClient()) {
			this._renderSteppedConnection = RunService.RenderStepped.Connect((deltaTime) => {
				this.RenderTickAll(deltaTime);
			});
		}
	}

	/**
	 * Ticks all tickables in this scope.
	 */
	private TickAll(deltaTime: number): void {
		// Tick ITickable
		for (const tickable of this._tickables) {
			try {
				tickable.Tick(deltaTime);
			} catch (e) {
				warn(`Error ticking service in scope ${this._scopeId}: ${e}`);
			}
		}

		// Tick IFixedTickable
		for (const tickable of this._fixedTickables) {
			try {
				tickable.FixedTick(deltaTime);
			} catch (e) {
				warn(`Error fixed-ticking service in scope ${this._scopeId}: ${e}`);
			}
		}
	}

	/**
	 * Render ticks all render tickables in this scope.
	 */
	private RenderTickAll(deltaTime: number): void {
		for (const tickable of this._renderTickables) {
			try {
				tickable.RenderTick(deltaTime);
			} catch (e) {
				warn(`Error render-ticking service in scope ${this._scopeId}: ${e}`);
			}
		}
	}

	// ===== Type Guards =====

	private IsStartable(value: unknown): value is IStartable {
		return typeIs(value, "table") && typeIs((value as IStartable).Start, "function");
	}

	private IsDestroyable(value: unknown): value is IDestroyable {
		return typeIs(value, "table") && typeIs((value as IDestroyable).Destroy, "function");
	}

	private IsTickable(value: unknown): value is ITickable {
		return typeIs(value, "table") && typeIs((value as ITickable).Tick, "function");
	}

	private IsFixedTickable(value: unknown): value is IFixedTickable {
		return typeIs(value, "table") && typeIs((value as IFixedTickable).FixedTick, "function");
	}

	private IsRenderTickable(value: unknown): value is IRenderTickable {
		return typeIs(value, "table") && typeIs((value as IRenderTickable).RenderTick, "function");
	}

	private GetTokenName(token: Token | Constructor): string {
		if (isToken(token)) {
			return token.__description || "UnknownToken";
		}
		return (token as unknown as { name?: string }).name || "UnknownClass";
	}
}
