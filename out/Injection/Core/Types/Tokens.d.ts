/**
 * Token type definitions for interface-based dependency injection.
 */
/**
 * Unique token used as a dependency injection token.
 * Tokens enable interface-based injection since TypeScript interfaces are erased at runtime.
 *
 * In Luau, tokens are implemented as unique objects (tables) since symbols don't exist.
 * Create tokens with createToken<T>("TokenName")
 *
 * @template T - The type this token represents
 *
 * @example
 * const ILogger = createToken<ILogger>("ILogger")
 * // Later: @Inject(ILogger) logger: ILogger
 */
export type Token<T = any> = {
    readonly __type?: T;
    readonly __description?: string;
};
//# sourceMappingURL=Tokens.d.ts.map