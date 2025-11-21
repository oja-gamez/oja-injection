/**
 * OjaInjection Scope - Manages scoped service lifetimes
 */
import type { Container } from "./Container";
import type { TickManager } from "./TickManager";
import type { Token, Constructor, IScopeDebugInfo } from "./Types";
import type { ResolutionContext } from "./Types/Diagnostics";
/**
 * Scope for scoped service management.
 * Handles scoped instances, child scopes, lifecycle, and tick management.
 */
export declare class Scope {
    private _container;
    private _tickManager;
    private _parent?;
    private _scopeId;
    private _createdAt;
    /** Scoped instances cached in this scope. */
    private _scopedInstances;
    /** Child scopes created from this scope. */
    private _childScopes;
    /** Externally provided instances injected into this scope. */
    private _externalInstances;
    /** Tracks lifecycle state for destruction/startup. */
    private _destroyed;
    private _destroyables;
    /** Tickable collections tracked for cleanup - registered with global TickManager. */
    private _tickables;
    private _fixedTickables;
    private _renderTickables;
    /**
     * @internal
     */
    constructor(container: Container, tickManager: TickManager, parent?: Scope, id?: string);
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
    ProvideExternal<T>(token: Token<T> | Constructor<T>, instance: T): void;
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
    private IsStartable;
    private IsDestroyable;
    private IsTickable;
    private IsFixedTickable;
    private IsRenderTickable;
    private GetTokenName;
}
//# sourceMappingURL=Scope.d.ts.map