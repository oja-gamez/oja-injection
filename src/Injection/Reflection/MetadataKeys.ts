/**
 * Metadata keys used by OjaInjection decorators and container.
 *
 * All keys prefixed with "oja:" to avoid conflicts with other libraries.
 */
export const MetadataKeys = {
	/**
	 * Service lifetime: "singleton" | "scoped" | "factory"
	 * Set by @Singleton(), @Scoped(), @Factory() decorators
	 */
	Lifetime: "oja:lifetime",

	/**
	 * Array of constructor parameter types (auto-detected by TypeScript)
	 * Used for autowiring concrete class dependencies
	 */
	Dependencies: "oja:dependencies",

	/**
	 * Map of parameter index to token for interface injection
	 * Set by @Inject(token) decorator on constructor parameters
	 * Example: { 0: ILogger, 2: IAudioManager }
	 */
	DependencyTokens: "oja:dependency-tokens",

	/**
	 * Array of parameter indices marked as runtime parameters
	 * Set by @RuntimeParameter() decorator
	 * Example: [1, 3] means parameters at index 1 and 3 are runtime
	 */
	RuntimeParameters: "oja:runtime-parameters",

	/**
	 * Human-readable service name for debugging
	 * Auto-set from class name, used by DebugServices()
	 */
	ServiceName: "oja:service-name",

	/**
	 * Timestamp when service instance was created
	 * Used for leak detection and diagnostics
	 */
	CreatedAt: "oja:created-at",

	/**
	 * Scope ID this service belongs to
	 * Used for debugging and leak detection
	 */
	ScopeId: "oja:scope-id",
} as const;

/**
 * Type-safe metadata key access
 */
export type MetadataKey = typeof MetadataKeys[keyof typeof MetadataKeys];
