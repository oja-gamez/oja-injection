import type { ServiceRegistration } from "../Module/Module";
import type { Token, Constructor, RegisteredModule, RegisteredScopeModule } from "./Types";
import type { ResolutionContext } from "./Types/Diagnostics";
import { Scope } from "./Scope";
import { TickManager } from "./TickManager";
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
export declare class Container {
    private _registrations;
    private _singletons;
    private _multiRegistrations;
    private _keyedRegistrations;
    private _validated;
    private _resolutionLock;
    private _tickManager;
    constructor();
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
    Use(module: RegisteredModule): void;
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
    Launch(): void;
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
    Resolve<T>(token: Token<T> | Constructor<T>): T;
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
    CreateScope(module: RegisteredScopeModule): Scope;
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
    GetTickManager(): TickManager;
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
    Validate(): void;
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
    private ValidateNoServiceLocator;
    /**
     * Validates a single registration's dependencies.
     *
     * Checks that all constructor dependencies are registered in the container,
     * excluding runtime and optional parameters.
     *
     * @param registration - The service registration to validate
     * @throws Error if unregistered dependency is found
     */
    private ValidateRegistration;
    /**
     * Creates an instance of a service with dependency injection (legacy method without context).
     *
     * @param registration - The service registration to instantiate
     * @param scope - Optional scope for resolving scoped dependencies
     * @param runtimeArgs - Optional runtime arguments for @Runtime decorated parameters
     * @returns The created instance with all dependencies injected
     *
     * @internal
     */
    CreateInstance<T>(registration: ServiceRegistration, scope?: Scope, runtimeArgs?: unknown[]): T;
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
    CreateInstanceWithContext<T>(registration: ServiceRegistration, context: ResolutionContext, scope?: Scope, runtimeArgs?: unknown[]): T;
    /**
     * Resolves all constructor dependencies for a service (legacy method without context).
     *
     * @param constructor - The constructor whose dependencies to resolve
     * @param scope - Optional scope for resolving scoped dependencies
     * @param runtimeArgs - Optional runtime arguments for @Runtime decorated parameters
     * @returns Array of resolved dependency instances
     *
     * @internal
     * @deprecated Use ResolveDependenciesWithContext for better error diagnostics
     */
    private ResolveDependencies;
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
    private ResolveDependenciesWithContext;
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
    private ValidateDeadService;
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
    private ValidateLifecycleInterfaces;
    /**
     * Resolves a single dependency (legacy method without context).
     *
     * @param token - The service token or constructor to resolve
     * @param scope - Optional scope for resolving scoped dependencies
     * @returns The resolved service instance
     *
     * @internal
     * @deprecated Use ResolveDependencyWithContext for better error diagnostics
     */
    ResolveDependency<T>(token: Token<T> | Constructor<T>, scope?: Scope): T;
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
    private ResolveDependencyWithContext;
    /**
     * Gets the first service registration for a token.
     *
     * @param token - The service token or constructor
     * @returns The first registration if found, undefined otherwise
     *
     * @internal Not exposed on IContainer interface
     */
    GetRegistration(token: Token | Constructor): ServiceRegistration | undefined;
    /**
     * Gets all service registrations for a token (used for multi-injection).
     *
     * @param token - The service token or constructor
     * @returns Array of all registrations for the token
     *
     * @internal Not exposed on IContainer interface
     */
    GetAllRegistrations(token: Token | Constructor): ServiceRegistration[];
    /**
     * Registers a single service implementation for a token.
     */
    private RegisterSingle;
    /**
     * Registers a multi-injection implementation for a token.
     */
    private RegisterMulti;
    /**
     * Registers a keyed injection implementation for a token.
     */
    private RegisterKeyed;
    /**
     * Resolves all implementations for a multi-injection token.
     *
     * @param token - The multi-injection token
     * @param scope - Optional scope for scoped dependencies
     * @returns Array of all implementation instances
     */
    private ResolveMulti;
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
    private ResolveKeyed;
    /**
     * Gets a human-readable name for a token or constructor.
     */
    private GetTokenName;
    /**
     * Validates that a token is valid (not undefined and is a token or constructor).
     *
     * @param token - The token to validate
     * @throws Error if token is invalid
     */
    private ValidateToken;
}
//# sourceMappingURL=Container.d.ts.map