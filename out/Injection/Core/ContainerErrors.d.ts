/**
 * Container error handling and formatting utilities.
 */
import type { Constructor } from "./Types/Constructors";
import type { Token } from "./Types/Tokens";
import type { ResolutionContext } from "./Types/Diagnostics";
export declare class ContainerErrors {
    /**
     * Creates a resolution context for dependency tracking.
     */
    static CreateContext(): ResolutionContext;
    /**
     * Gets the display name for a token or constructor.
     */
    static GetTokenName(token: Token | Constructor): string;
    /**
     * Formats a resolution chain for display.
     */
    static FormatChain(chain: (Token | Constructor)[]): string;
    /**
     * Checks if a token is already in the resolution chain (circular dependency).
     */
    static IsCircular(token: Token | Constructor, context: ResolutionContext): boolean;
    /**
     * Creates a circular dependency error.
     */
    static CircularDependency(token: Token | Constructor, context: ResolutionContext): never;
    /**
     * Creates a missing registration error.
     */
    static MissingRegistration(token: Token | Constructor, context?: ResolutionContext): never;
    /**
     * Creates an invalid token error.
     */
    static InvalidToken(token: unknown, context?: ResolutionContext): never;
    /**
     * Creates a lifetime violation error.
     */
    static LifetimeViolation(token: Token | Constructor, reason: string, context?: ResolutionContext): never;
    /**
     * Creates a constructor error with context.
     */
    static ConstructorError(token: Token | Constructor, originalError: unknown, context?: ResolutionContext): never;
    /**
     * Creates a duplicate registration error.
     */
    static DuplicateRegistration(token: Token | Constructor): never;
    /**
     * Formats a container error with rich context.
     */
    private static FormatError;
}
//# sourceMappingURL=ContainerErrors.d.ts.map