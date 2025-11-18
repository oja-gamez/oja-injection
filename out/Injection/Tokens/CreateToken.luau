-- Compiled with roblox-ts v3.0.0
--[[
	*
	 * Registry of all created tokens for debugging and validation.
	 * Maps token to its description.
	 
]]
local tokenRegistry = {}
--[=[
	*
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
	 
]=]
local function createToken(description)
	-- Create unique token (in Luau this is just a unique table/object)
	-- We use a unique object since symbols don't exist in Luau
	local token = {
		__description = description,
	}
	-- Register for debugging (detect duplicate token names)
	if tokenRegistry[token] ~= nil then
		local existing = tokenRegistry[token]
		error(`Token "{description}" already exists!\n` .. `Existing: {existing}\n` .. `This usually means you're creating the same token twice.\n` .. `Make sure each token is created only once and exported.`)
	end
	local _description = description
	tokenRegistry[token] = _description
	return token
end
--[[
	*
	 * Gets the human-readable description for a token.
	 * Used for debugging and error messages.
	 *
	 * @param token - Token to get description for
	 * @returns Token description or "Unknown Token" if not registered
	 *
	 * @example
	 * const ILogger = createToken<ILogger>("ILogger")
	 * getTokenDescription(ILogger) // "ILogger"
	 
]]
local function getTokenDescription(token)
	local _token = token
	local _condition = tokenRegistry[_token]
	if _condition == nil then
		_condition = token.__description
		if _condition == nil then
			_condition = "Unknown Token"
		end
	end
	return _condition
end
--[[
	*
	 * Gets all registered tokens.
	 * Used for container validation and debugging.
	 *
	 * @returns Map of all tokens to their descriptions
	 *
	 * @internal
	 
]]
local function getAllTokens()
	return tokenRegistry
end
--[[
	*
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
	 
]]
local function isToken(value)
	local _value = value
	local _condition = type(_value) == "table"
	if _condition then
		local _value_1 = value
		_condition = tokenRegistry[_value_1] ~= nil
	end
	return _condition
end
return {
	createToken = createToken,
	getTokenDescription = getTokenDescription,
	getAllTokens = getAllTokens,
	isToken = isToken,
}
