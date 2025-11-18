import type { Token } from "../Core/Types";

/**
 * Registry of all created tokens for debugging and validation.
 * Maps token to its description.
 */
const tokenRegistry = new Map<Token, string>();

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
export function createToken<T>(description: string): Token<T> {
	// Create unique token (in Luau this is just a unique table/object)
	// We use a unique object since symbols don't exist in Luau
	const token = {
		__description: description,
	} as Token<T>;

	// Register for debugging (detect duplicate token names)
	if (tokenRegistry.has(token)) {
		const existing = tokenRegistry.get(token)!;
		error(
			`Token "${description}" already exists!\n` +
				`Existing: ${existing}\n` +
				`This usually means you're creating the same token twice.\n` +
				`Make sure each token is created only once and exported.`,
		);
	}

	tokenRegistry.set(token, description);

	return token;
}

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
export function getTokenDescription(token: Token): string {
	return tokenRegistry.get(token) ?? token.__description ?? "Unknown Token";
}

/**
 * Gets all registered tokens.
 * Used for container validation and debugging.
 *
 * @returns Map of all tokens to their descriptions
 *
 * @internal
 */
export function getAllTokens(): ReadonlyMap<Token, string> {
	return tokenRegistry;
}

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
export function isToken(value: unknown): value is Token {
	return typeIs(value, "table") && tokenRegistry.has(value as Token);
}
