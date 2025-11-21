import { Players } from "@rbxts/services";
import { Reflect } from "../Reflection/Reflect";
import { MetadataKeys } from "../Reflection/MetadataKeys";
import type { ServiceRegistration } from "../Module/Module";
import type { Token, Constructor, Lifetime, KeyedFactory, RegisteredModule, RegisteredScopeModule } from "./Types";
import type { ResolutionContext } from "./Types/Diagnostics";
import { Scope } from "./Scope";
import { TickManager } from "./TickManager";
import { isToken } from "../Tokens/CreateToken";
import { ContainerErrors } from "./ContainerErrors";

/**
 * Main dependency injection container.
 *
 * The Container is the core of the OjaInjection system. It manages service registrations,
 * singleton instances, scope creation, and player-scoped dependency injection.
 *
 * @example
 * ```ts
 * // Create and configure container
 * const container = new Container({
 *   StrictDuplicates: true,
 *   MaxResolutionDepth: 50
 * });
 *
 * // Register modules
 * container.Use(CoreModule);
 * container.Use(GameModule);
 *
 * // Launch application (auto-resolves IStartable singletons)
 * container.Launch();
 * ```
 */
export class Container {
	private _registrations = new Map<Token | Constructor, ServiceRegistration[]>();
	private _singletons = new Map<Token | Constructor, unknown>();
	private _multiRegistrations = new Map<Token, Constructor[]>();
	private _keyedRegistrations = new Map<Token, Map<string, Constructor>>();
	private _validated = false;
	private _resolutionLock = false;
	private _tickManager: TickManager;

	constructor() {
		this._tickManager = new TickManager();
	}

	/**
	 * Registers services from a module definition.
	 *
	 * @param module - Result of registerModule()
	 *
	 * @example
	 * ```ts
	 * const GameModule = registerModule((m) => {
	 *   m.single(AudioManager)
	 *   m.single(ConsoleLogger).bind(ILogger)
	 *   m.scoped(PlayerStats)
	 * })
	 *
	 * container.Use(GameModule)
	 * ```
	 */
	Use(module: RegisteredModule): void {
		const register = module._getRegister();

		// Process single/scoped/factory registrations
		const registrations = register.GetRegistrations();
		for (const registration of registrations) {
			this.ValidateToken(registration.token);

			const serviceReg: ServiceRegistration = {
				Token: registration.token,
				Implementation: registration.implementation,
				Lifetime: registration.lifetime,
				Type: "single",
			};

			if (this._registrations.has(registration.token)) {
				ContainerErrors.DuplicateRegistration(registration.token);
			}

			this.RegisterSingle(registration.token, serviceReg);
		}

		// Process multi-injection registrations
		const multiRegistrations = register.GetMultiRegistrations();
		for (const multiReg of multiRegistrations) {
			this.ValidateToken(multiReg.token);
			for (const implementation of multiReg.implementations) {
				this.RegisterMulti(multiReg.token as Token, implementation);
			}
		}

		// Process keyed injection registrations
		const keyedRegistrations = register.GetKeyedRegistrations();
		for (const keyedReg of keyedRegistrations) {
			this.ValidateToken(keyedReg.token);
			this.RegisterKeyed(keyedReg.token as Token, keyedReg.key, keyedReg.implementation);
		}

		this._validated = false;
	}

	/**
	 * Launches the application by auto-resolving all singleton services implementing IStartable.
	 *
	 * This is the application's entry point. Call this after loading all modules to automatically
	 * instantiate and start all singleton services that implement the IStartable interface.
	 * Services are resolved in registration order, triggering their Start() methods.
	 *
	 * @example
	 * ```ts
	 * const container = new Container();
	 * container.Use(CoreModule);
	 * container.Use(GameModule);
	 * container.Launch(); // Auto-resolves all IStartable singletons
	 * ```
	 *
	 * @remarks
	 * Only singleton services implementing IStartable will be auto-resolved.
	 * Scoped and factory services are never auto-resolved.
	 */
	Launch(): void {
		// Validate all registrations before starting services
		this.Validate();

		for (const [token, registrations] of this._registrations) {
			for (const registration of registrations) {
				if (registration.Lifetime === "singleton") {
					// When Implementation is undefined, the Token IS the implementation (class-only registration)
					const impl = (registration.Implementation || registration.Token) as { Start?: unknown };
					// In Roblox-TS/Lua, methods are directly on the class, not on .prototype
					if (typeIs(impl.Start, "function")) {
						this.Resolve(token);
						break;
					}
				}
			}
		}
	}

	/**
	 * Resolves a singleton service from the container.
	 *
	 * Retrieves or creates a singleton instance for the given token. If the instance already exists,
	 * it is returned from cache. Otherwise, a new instance is created with all dependencies injected
	 * and cached for future use.
	 *
	 * @param token - The service token or constructor to resolve
	 * @returns The singleton instance
	 *
	 * @throws Error if token is not registered
	 * @throws Error if service is not singleton lifetime
	 * @throws Error if circular dependency detected
	 * @throws Error if maximum resolution depth exceeded
	 *
	 * @internal Not exposed on IContainer interface - use IContainer methods instead
	 *
	 * @remarks
	 * - Automatically validates the container on first resolution
	 * - Only singleton services can be resolved from the container
	 * - Scoped and factory services must be resolved from a Scope
	 * - Keyed injections return a factory function instead of direct instances
	 */
	Resolve<T>(token: Token<T> | Constructor<T>): T {
		if (!this._validated) {
			this.Validate();
		}

		this.ValidateToken(token);

		if (isToken(token) && this._keyedRegistrations.has(token)) {
			return this.ResolveKeyed(token) as T;
		}

		if (this._singletons.has(token)) {
			return this._singletons.get(token) as T;
		}

		const registration = this.GetRegistration(token);
		if (!registration) {
			ContainerErrors.MissingRegistration(token);
		}

		if (registration.Lifetime !== "singleton") {
			ContainerErrors.LifetimeViolation(
				token,
				`Cannot resolve non-singleton service from container.\n` +
					`    Service has lifetime: ${registration.Lifetime}\n` +
					`    Use scope.Resolve() for scoped/factory services.`,
			);
		}

		const context = ContainerErrors.CreateContext();
		const instance = this.CreateInstanceWithContext<T>(registration, context);
		this._singletons.set(token, instance);

		return instance;
	}

	/**
	 * Creates a new scope for scoped services.
	 *
	 * @param module - Result of registerScopeModule()
	 *
	 * @example
	 * ```ts
	 * const PlayerScope = registerScopeModule((scope, player: Player) => {
	 *   scope.withRoot(PlayerController)
	 *   scope.provideExternal(PlayerToken, player)
	 * })
	 *
	 * const scope = container.CreateScope(PlayerScope(player))
	 * ```
	 */
	CreateScope(module: RegisteredScopeModule): Scope {
		const register = module._getRegister();
		const scope = new Scope(this, this._tickManager, undefined) as Scope;

		// Provide external data
		const externals = register.GetExternals();
		for (const [token, instance] of pairs(externals)) {
			scope.ProvideRuntime(token, instance);
		}

		// Resolve root if specified
		const root = register.GetRoot();
		if (root) {
			scope.Resolve(root);
			scope.StartAll();
		}

		return scope;
	}

	/**
	 * Gets the global TickManager for advanced control (pausing, profiling, etc.).
	 *
	 * @example
	 * ```ts
	 * // Pause all ticking globally
	 * container.GetTickManager().Pause();
	 *
	 * // Get debug info
	 * const info = container.GetTickManager().GetDebugInfo();
	 * print(`Total tickables: ${info.TotalTickables}`);
	 * ```
	 */
	GetTickManager(): TickManager {
		return this._tickManager;
	}

	/**
	 * Validates the dependency graph for all registered services.
	 *
	 * Performs comprehensive validation including:
	 * - Missing dependency detection
	 * - Service locator anti-pattern detection
	 * - Dependency registration verification
	 *
	 * Validation is automatically performed on first service resolution but can be
	 * called manually for early error detection during development.
	 *
	 * @throws Error if validation fails with detailed error information
	 *
	 * @internal Not exposed on IContainer interface
	 *
	 * @remarks
	 * Validation is cached - subsequent calls are no-ops unless new modules are loaded.
	 * All validation errors are collected and reported together for better debugging.
	 */
	Validate(): void {
		if (this._validated) return;

		const errors: string[] = [];

		for (const [token, registrations] of this._registrations) {
			for (const registration of registrations) {
				try {
					this.ValidateRegistration(registration);
				} catch (e) {
					errors.push(tostring(e));
				}
			}
		}

		try {
			this.ValidateNoServiceLocator();
		} catch (e) {
			errors.push(tostring(e));
		}

		if (errors.size() > 0) {
			error(
				`[OjaInjection] Container validation failed with ${errors.size()} error(s):\n` +
					errors.map((e, i) => `  ${i + 1}. ${e}`).join("\n"),
			);
		}

		this._validated = true;
	}

	/**
	 * Validates that scoped/factory services don't inject IContainer or IScope.
	 *
	 * Prevents the service locator anti-pattern by detecting inappropriate container/scope
	 * injection at validation time. Singleton services can inject IContainer for scope creation,
	 * but scoped and factory services cannot inject either interface.
	 *
	 * @throws Error if service locator pattern detected
	 *
	 * @remarks
	 * - Singletons CAN inject IContainer for creating scopes
	 * - Scoped/Factory services CANNOT inject IContainer or IScope
	 * - Use auto-generated factories for dynamic resolution instead
	 */
	private ValidateNoServiceLocator(): void {
		for (const [token, registrations] of this._registrations) {
			for (const registration of registrations) {
				const lifetime = registration.Lifetime;
				const implementation = registration.Implementation || (registration.Token as Constructor);

				// Get dependencies
				const dependencyTokens = Reflect.GetMetadata<(Token | Constructor | undefined)[]>(
					implementation,
					MetadataKeys.DependencyTokens,
				);
				const autowiredDeps = Reflect.GetMetadata<(Constructor | undefined)[]>(
					implementation,
					MetadataKeys.Dependencies,
				);

				const deps = [...(dependencyTokens || []), ...(autowiredDeps || [])];

				for (const dep of deps) {
					if (!dep) continue;
				}
			}
		}
	}

	/**
	 * Validates a single registration's dependencies.
	 *
	 * Checks that all constructor dependencies are registered in the container,
	 * excluding runtime and optional parameters.
	 *
	 * @param registration - The service registration to validate
	 * @throws Error if unregistered dependency is found
	 */
	private ValidateRegistration(registration: ServiceRegistration): void {
		const implementation = registration.Implementation || (registration.Token as Constructor);

		const dependencyTokens = Reflect.GetMetadata<(Token | Constructor | undefined)[]>(
			implementation,
			MetadataKeys.DependencyTokens,
		);
		const autowiredDeps = Reflect.GetMetadata<(Constructor | undefined)[]>(
			implementation,
			MetadataKeys.Dependencies,
		);
		const runtimeParamIndices =
			Reflect.GetMetadata<number[]>(implementation, MetadataKeys.RuntimeParameters) || [];

		const maxLength = math.max(
			dependencyTokens?.size() || 0,
			autowiredDeps?.size() || 0,
			runtimeParamIndices.size() > 0 ? math.max(...runtimeParamIndices) + 1 : 0,
		);

		for (let i = 0; i < maxLength; i++) {
			if (runtimeParamIndices.includes(i)) {
				continue;
			}

			const token = dependencyTokens?.[i] || autowiredDeps?.[i];
			if (!token) continue;

			if (!this.GetRegistration(token) && !this._multiRegistrations.has(token as Token) && !this._keyedRegistrations.has(token as Token)) {
				error(
					`Dependency not registered: ${ContainerErrors.GetTokenName(token)}\n` +
						`  Required by: ${ContainerErrors.GetTokenName(registration.Token)}`,
				);
			}
		}
	}

	/**
	 * Creates an instance of a service with dependency injection and resolution context.
	 *
	 * Handles the complete instantiation process including:
	 * - Circular dependency detection
	 * - Dependency depth validation
	 * - Constructor parameter resolution
	 * - Lifecycle interface validation
	 * - Error context wrapping
	 *
	 * @param registration - The service registration to instantiate
	 * @param context - Resolution context for circular dependency detection and error reporting
	 * @param scope - Optional scope for resolving scoped dependencies
	 * @param runtimeArgs - Optional runtime arguments for @Runtime decorated parameters
	 * @returns The created instance with all dependencies injected
	 *
	 * @throws Error if circular dependency detected
	 * @throws Error if maximum resolution depth exceeded
	 * @throws Error if lifecycle interface used on wrong lifetime
	 * @throws Error if constructor throws during instantiation
	 *
	 * @internal
	 */
	CreateInstanceWithContext<T>(
		registration: ServiceRegistration,
		context: ResolutionContext,
		scope?: Scope,
		runtimeArgs?: unknown[],
	): T {
		const token = registration.Token;
		const implementation = registration.Implementation || (token as Constructor<T>);

		if (ContainerErrors.IsCircular(token, context)) {
			ContainerErrors.CircularDependency(token, context);
		}

		context.Chain.push(token);

		try {
			const dependencies = this.ResolveDependenciesWithContext(implementation, context, scope, runtimeArgs);
			const instance = new implementation(...dependencies);

			this.ValidateLifecycleInterfaces(instance, registration.Lifetime);

			context.Chain.pop();

			return instance as T;
		} catch (e) {
			if (typeIs(e, "string") && !string.find(e, "[OjaInjection]")[0]) {
				ContainerErrors.ConstructorError(token, e, context);
			}
			throw e;
		}
	}

	/**
	 * Resolves all constructor dependencies for a service with resolution context.
	 *
	 * Processes constructor parameters in order, handling:
	 * - @Inject decorated parameters (explicit tokens)
	 * - Autowired parameters (type inference)
	 * - @Runtime decorated parameters (runtime values)
	 * - @Optional decorated parameters (nullable dependencies)
	 *
	 * @param constructor - The constructor whose dependencies to resolve
	 * @param context - Resolution context for circular dependency detection and error reporting
	 * @param scope - Optional scope for resolving scoped dependencies
	 * @param runtimeArgs - Optional runtime arguments for @Runtime decorated parameters
	 * @returns Array of resolved dependency instances in constructor parameter order
	 *
	 * @throws Error if dependency cannot be resolved
	 * @throws Error if service locator pattern detected
	 *
	 * @internal
	 */
	private ResolveDependenciesWithContext(
		constructor: Constructor,
		context: ResolutionContext,
		scope?: Scope,
		runtimeArgs?: unknown[],
	): unknown[] {
		const dependencyTokens = Reflect.GetMetadata<(Token | Constructor | undefined)[]>(
			constructor,
			MetadataKeys.DependencyTokens,
		);
		const autowiredDeps = Reflect.GetMetadata<(Constructor | undefined)[]>(
			constructor,
			MetadataKeys.Dependencies,
		);
		const runtimeParamIndices =
			Reflect.GetMetadata<number[]>(constructor, MetadataKeys.RuntimeParameters) || [];

		const maxLength = math.max(
			dependencyTokens?.size() || 0,
			autowiredDeps?.size() || 0,
			runtimeParamIndices.size() > 0 ? math.max(...runtimeParamIndices) + 1 : 0,
		);

		const resolvedDeps = new Array<unknown>(maxLength);

		for (let i = 0; i < maxLength; i++) {
			if (runtimeParamIndices.includes(i)) {
				const runtimeIndex = runtimeParamIndices.indexOf(i);
				resolvedDeps[i] = runtimeArgs?.[runtimeIndex];
				continue;
			}

			const token = dependencyTokens?.[i] || autowiredDeps?.[i];

			if (!token) {
				error(
					`Cannot resolve parameter ${i} of ${(constructor as unknown as { name: string }).name}\n` +
						`No @Inject() decorator found and no autowired type.\n` +
						`Either add @Inject(Token) or ensure parameter has a concrete type.`,
				);
			}

			this.ValidateDeadService(constructor, token);

			const resolved = this.ResolveDependencyWithContext(token, context, scope);
			resolvedDeps[i] = resolved;
		}

		return resolvedDeps;
	}

	/**
	 * Validates that scoped/factory services don't inject IContainer or IScope.
	 *
	 * Performs runtime dead-service detection to prevent the service locator anti-pattern.
	 * Only singleton services can inject IContainer for scope creation purposes.
	 *
	 * @param constructor - The constructor being validated
	 * @param dependencyToken - The token being injected
	 *
	 * @throws Error if scoped/factory service attempts to inject IContainer or IScope
	 *
	 * @remarks
	 * This is a runtime check that complements the validation-time check in ValidateNoServiceLocator.
	 */
	private ValidateDeadService(constructor: Constructor, dependencyToken: Token | Constructor): void {
		const lifetime = Reflect.GetMetadata<Lifetime>(constructor, MetadataKeys.Lifetime);

		if (lifetime !== "scoped" && lifetime !== "factory") {
			return;
		}

		const depName = this.GetTokenName(dependencyToken);
		if (depName === "IContainer" || depName === "IScope") {
			const serviceName = this.GetTokenName(constructor);
			error(
				`[OjaInjection] DeadService: Service locator anti-pattern detected\n` +
					`Service: ${serviceName} (${lifetime})\n` +
					`Attempted to inject: ${depName}\n` +
					`Scoped and factory services cannot inject IContainer or IScope.\n` +
					`Only singletons can inject IContainer (for creating scopes).`,
			);
		}
	}

	/**
	 * Validates that singleton-only lifecycle interfaces aren't used on non-singletons.
	 *
	 * IWarmupable only makes sense for singleton services since it's
	 * intended for one-time initialization. Using it on scoped/factory services would
	 * result in repeated initialization calls.
	 *
	 * @param instance - The service instance to validate
	 * @param lifetime - The service's registered lifetime
	 *
	 * @throws Error if non-singleton service implements IWarmupable
	 */
	private ValidateLifecycleInterfaces(instance: unknown, lifetime: Lifetime): void {
		if (lifetime !== "singleton") {
			const hasWarmup = typeIs((instance as { Warmup?: () => void }).Warmup, "function");

			if (hasWarmup) {
				error(
					`[OjaInjection] LifecycleViolation: IWarmupable can only be used on singleton services\n` +
						`Service lifetime: ${lifetime}\n` +
						`IWarmupable is for CPU-intensive pre-computation on singletons only.`,
				);
			}
		}
	}

	/**
	 * Resolves a single dependency with resolution context.
	 *
	 * Routes resolution based on service lifetime:
	 * - Singleton: Returns cached instance or creates and caches new one
	 * - Scoped: Delegates to scope for resolution
	 * - Factory: Creates new instance every time
	 *
	 * Also handles special injection patterns:
	 * - Multi-injection: Returns array of all implementations
	 * - Keyed injection: Returns factory function for key-based resolution
	 *
	 * @param token - The service token or constructor to resolve
	 * @param context - Resolution context for circular dependency detection and error reporting
	 * @param scope - Optional scope for resolving scoped dependencies
	 * @returns The resolved service instance, array, or factory function
	 *
	 * @throws Error if token not registered
	 * @throws Error if scoped service resolved without scope
	 *
	 * @internal
	 */
	private ResolveDependencyWithContext<T>(
		token: Token<T> | Constructor<T>,
		context: ResolutionContext,
		scope?: Scope,
	): T {
		this.ValidateToken(token);

		if (isToken(token) && this._multiRegistrations.has(token)) {
			return this.ResolveMulti(token, scope) as T;
		}

		if (isToken(token) && this._keyedRegistrations.has(token)) {
			return this.ResolveKeyed(token, scope) as T;
		}

		const registration = this.GetRegistration(token);
		if (!registration) {
			ContainerErrors.MissingRegistration(token, context);
		}

		if (registration.Lifetime === "singleton") {
			if (this._singletons.has(token)) {
				return this._singletons.get(token) as T;
			}
			const instance = this.CreateInstanceWithContext<T>(registration, context);
			this._singletons.set(token, instance);
			return instance;
		} else if (registration.Lifetime === "scoped") {
			if (!scope) {
				ContainerErrors.LifetimeViolation(
					token,
					`Cannot resolve scoped service without scope.\n` +
						`    Scoped services must be resolved from a Scope, not the Container.`,
					context,
				);
			}
			return scope.ResolveWithContext(token, context);
		} else {
			return this.CreateInstanceWithContext<T>(registration, context, scope);
		}
	}

	/**
	 * Gets the first service registration for a token.
	 *
	 * @param token - The service token or constructor
	 * @returns The first registration if found, undefined otherwise
	 *
	 * @internal Not exposed on IContainer interface
	 */
	GetRegistration(token: Token | Constructor): ServiceRegistration | undefined {
		const registrations = this._registrations.get(token);
		return registrations?.[0];
	}

	/**
	 * Gets all service registrations for a token (used for multi-injection).
	 *
	 * @param token - The service token or constructor
	 * @returns Array of all registrations for the token
	 *
	 * @internal Not exposed on IContainer interface
	 */
	GetAllRegistrations(token: Token | Constructor): ServiceRegistration[] {
		return this._registrations.get(token) || [];
	}

	/**
	 * Registers a single service implementation for a token.
	 */
	private RegisterSingle(token: Token | Constructor, registration: ServiceRegistration): void {
		if (!this._registrations.has(token)) {
			this._registrations.set(token, []);
		}
		this._registrations.get(token)!.push(registration);
	}

	/**
	 * Registers a multi-injection implementation for a token.
	 */
	private RegisterMulti(token: Token, implementation: Constructor): void {
		if (!this._multiRegistrations.has(token)) {
			this._multiRegistrations.set(token, []);
		}
		this._multiRegistrations.get(token)!.push(implementation);
	}

	/**
	 * Registers a keyed injection implementation for a token.
	 */
	private RegisterKeyed(token: Token, key: string, implementation: Constructor): void {
		if (!this._keyedRegistrations.has(token)) {
			this._keyedRegistrations.set(token, new Map());
		}
		this._keyedRegistrations.get(token)!.set(key, implementation);
	}

	/**
	 * Resolves all implementations for a multi-injection token.
	 *
	 * @param token - The multi-injection token
	 * @param scope - Optional scope for scoped dependencies
	 * @returns Array of all implementation instances
	 */
	private ResolveMulti<T>(token: Token<T>, scope?: Scope): T[] {
		const implementations = this._multiRegistrations.get(token) || [];
		return implementations.map((impl) => {
			const reg: ServiceRegistration = {
				Token: token,
				Implementation: impl,
				Lifetime: "singleton",
				Type: "multi",
			};
			return this.CreateInstance<T>(reg, scope);
		});
	}

	/**
	 * Creates a factory function for keyed injection resolution.
	 *
	 * Returns a function that takes a key and returns the corresponding implementation.
	 * Throws if the key is not registered.
	 *
	 * @param token - The keyed injection token
	 * @param scope - Optional scope for scoped dependencies
	 * @returns Factory function that resolves implementations by key
	 */
	private ResolveKeyed<T>(token: Token<T>, scope?: Scope): KeyedFactory<T> {
		const implementations = this._keyedRegistrations.get(token);
		if (!implementations) {
			return (key: string) => {
				error(`[OjaInjection] No keyed implementation found for key: "${key}"`);
			};
		}

		return (key: string): T => {
			const impl = implementations.get(key);
			if (!impl) {
				const availableKeys: string[] = [];
				for (const [k] of implementations) {
					availableKeys.push(k);
				}
				error(
					`[OjaInjection] Keyed injection failed\n` +
						`Token: ${this.GetTokenName(token)}\n` +
						`Key: "${key}"\n` +
						`Available keys: ${availableKeys.join(", ")}`,
				);
			}

			const reg: ServiceRegistration = {
				Token: token,
				Implementation: impl,
				Lifetime: "factory",
				Type: "keyed",
				Key: key,
			};
			return this.CreateInstance<T>(reg, scope);
		};
	}

	/**
	 * Gets a human-readable name for a token or constructor.
	 */
	private GetTokenName(token: Token | Constructor): string {
		if (isToken(token)) {
			return token.__description || "UnknownToken";
		}
		return (token as unknown as { name?: string }).name || "UnknownClass";
	}

	/**
	 * Validates that a token is valid (not undefined and is a token or constructor).
	 *
	 * @param token - The token to validate
	 * @throws Error if token is invalid
	 */
	private ValidateToken(token: unknown): asserts token is Token | Constructor {
		if (token === undefined || token === (undefined as unknown)) {
			ContainerErrors.InvalidToken(token);
		}

		if (!isToken(token) && !typeIs(token, "table") && !typeIs(token, "function")) {
			ContainerErrors.InvalidToken(token);
		}
	}
}
