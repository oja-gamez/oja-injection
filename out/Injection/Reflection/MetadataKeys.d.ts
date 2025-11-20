/**
 * Metadata keys used by OjaInjection decorators and container.
 *
 * All keys prefixed with "oja:" to avoid conflicts with other libraries.
 */
export declare const MetadataKeys: {
    /**
     * Service lifetime: "singleton" | "scoped" | "factory"
     * Set by @Singleton(), @Scoped(), @Factory() decorators
     */
    readonly Lifetime: "oja:lifetime";
    /**
     * Array of constructor parameter types (auto-detected by TypeScript)
     * Used for autowiring concrete class dependencies
     */
    readonly Dependencies: "oja:dependencies";
    /**
     * Map of parameter index to token for interface injection
     * Set by @Inject(token) decorator on constructor parameters
     * Example: { 0: ILogger, 2: IAudioManager }
     */
    readonly DependencyTokens: "oja:dependency-tokens";
    /**
     * Array of parameter indices marked as runtime parameters
     * Set by @RuntimeParameter() decorator
     * Example: [1, 3] means parameters at index 1 and 3 are runtime
     */
    readonly RuntimeParameters: "oja:runtime-parameters";
    /**
     * Human-readable service name for debugging
     * Auto-set from class name, used by DebugServices()
     */
    readonly ServiceName: "oja:service-name";
    /**
     * Timestamp when service instance was created
     * Used for leak detection and diagnostics
     */
    readonly CreatedAt: "oja:created-at";
    /**
     * Scope ID this service belongs to
     * Used for debugging and leak detection
     */
    readonly ScopeId: "oja:scope-id";
};
/**
 * Type-safe metadata key access
 */
export type MetadataKey = typeof MetadataKeys[keyof typeof MetadataKeys];
//# sourceMappingURL=MetadataKeys.d.ts.map