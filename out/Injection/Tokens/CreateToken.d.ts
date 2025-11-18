import type { Token } from "../Core/Types";
/**
 * Creates a unique dependency injection token for interface-based injection.
 *
 * Tokens solve the problem of TypeScript interfaces being erased at runtime.
 * Since interfaces don't exist at runtime, we can't use them directly for DI.
 * Instead, we create unique symbols (tokens) that represent the interface.
 *
 * @template T - The interface or type this token represents
 * @param description - Human-readable description for debugging
 * @returns Unique token that can be used with @Inject() decorator
 *
 * @example
 * // Define interface
 * interface ILogger {
 *     Log(message: string): void
 * }
 *
 * // Create token
 * export const ILogger = createToken<ILogger>("ILogger")
 *
 * // Register implementation
 * container.Use({
 *     Single: [[ILogger, ConsoleLogger]]
 * })
 *
 * // Inject via token
 * class GameServer {
 *     constructor(@Inject(ILogger) private logger: ILogger) {
 *         this.logger.Log("Server started")
 *     }
 * }
 *
 * @example
 * // Multi-injection with tokens
 * const IDamageModifier = createToken<IDamageModifier>("IDamageModifier")
 *
 * container.Use({
 *     Multi: {
 *         [IDamageModifier]: [CriticalHitModifier, ArmorReduction]
 *     }
 * })
 *
 * // Injected as array
 * constructor(@Inject(IDamageModifier) modifiers: IDamageModifier[]) {}
 *
 * @example
 * // Keyed injection with tokens
 * const IAbilityProto = createToken<IAbilityPrototype>("IAbilityProto")
 *
 * container.Use({
 *     Keyed: {
 *         [IAbilityProto]: {
 *             fireball: FireballPrototype,
 *             icebolt: IceBoltPrototype
 *         }
 *     }
 * })
 *
 * // Injected as KeyedFactory function
 * constructor(@Inject(IAbilityProto) createAbility: KeyedFactory<IAbilityPrototype>) {}
 */
export declare function createToken<T>(description: string): Token<T>;
/**
 * Gets the human-readable description for a token.
 * Used for debugging and error messages.
 *
 * @param token - Token to get description for
 * @returns Token description or "Unknown Token" if not registered
 *
 * @example
 * const ILogger = createToken<ILogger>("ILogger")
 * getTokenDescription(ILogger) // "ILogger"
 */
export declare function getTokenDescription(token: Token): string;
/**
 * Gets all registered tokens.
 * Used for container validation and debugging.
 *
 * @returns Map of all tokens to their descriptions
 *
 * @internal
 */
export declare function getAllTokens(): ReadonlyMap<Token, string>;
/**
 * Checks if a value is a token created by createToken().
 *
 * @param value - Value to check
 * @returns True if value is a token
 *
 * @example
 * const ILogger = createToken<ILogger>("ILogger")
 * isToken(ILogger) // true
 * isToken(ConsoleLogger) // false
 * isToken("string") // false
 */
export declare function isToken(value: unknown): value is Token;
//# sourceMappingURL=CreateToken.d.ts.map