/**
 * OjaInjection Scope - Manages scoped service lifetimes
 */
import type { Container } from "./Container";
import type { Token, Constructor, IScopeDebugInfo } from "./Types";
import type { ResolutionContext } from "./Types/Diagnostics";
/**
 * Scope for scoped service management.
 * Handles scoped instances, child scopes, lifecycle, and tick management.
 */
export declare class Scope {
    private _container;
    private _parent?;
    private _scopeId;
    private _createdAt;
    private _scopedInstances;
    private _childScopes;
    private _externalInstances;
    private _destroyed;
    private _destroyables;
    private _tickables;
    private _fixedTickables;
    private _renderTickables;
    private _heartbeatConnection?;
    private _renderSteppedConnection?;
    /**
     * @internal
     */
    constructor(container: Container, parent?: Scope, id?: string);
    /**
     * Resolves a service from this scope.
     * @internal - Not exposed on IScope interface
     */
    Resolve<T>(token: Token<T> | Constructor<T>): T;
    /**
     * Resolves a service from this scope with resolution context.
     * @internal
     */
    ResolveWithContext<T>(token: Token<T> | Constructor<T>, context: ResolutionContext): T;
    /**
     * Creates a child scope.
     */
    CreateChildScope(id?: string): Scope;
    /**
     * Provides externally-created runtime data to the scope.
     * Public API exposed on IScope interface.
     */
    ProvideRuntime<T>(token: Token<T> | Constructor<T>, instance: T): void;
    /**
     * Synchronously destroys the scope and all scoped instances.
     */
    Destroy(): void;
    /**
     * Gets debug information about this scope.
     */
    DebugServices(): IScopeDebugInfo;
    /**
     * Gets the scope ID.
     */
    GetScopeId(): string;
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
    StartAll(): void;
    /**
     * Tracks an instance for lifecycle and tick management.
     * Note: Does NOT call Start() - that's handled by StartAll().
     * @internal
     */
    private TrackInstance;
    /**
     * Ensures Heartbeat connection exists.
     */
    private EnsureHeartbeatConnection;
    /**
     * Ensures RenderStepped connection exists.
     */
    private EnsureRenderSteppedConnection;
    /**
     * Ticks all tickables in this scope.
     */
    private TickAll;
    /**
     * Render ticks all render tickables in this scope.
     */
    private RenderTickAll;
    private IsStartable;
    private IsDestroyable;
    private IsTickable;
    private IsFixedTickable;
    private IsRenderTickable;
    private GetTokenName;
}
//# sourceMappingURL=Scope.d.ts.map