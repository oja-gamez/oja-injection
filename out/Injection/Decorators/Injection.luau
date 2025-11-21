-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local Reflect = TS.import(script, script.Parent.Parent, "Reflection", "Reflect").Reflect
local MetadataKeys = TS.import(script, script.Parent.Parent, "Reflection", "MetadataKeys").MetadataKeys
--[[
	*
	 * Marks a constructor parameter for dependency injection using a token.
	 * Required for interface-based injection since TypeScript interfaces are erased at runtime.
	 *
	 * Use when:
	 * - Injecting via interface (not concrete class)
	 * - Multi-injection (injecting array of implementations)
	 * - Keyed injection (injecting Map of implementations)
	 *
	 * @param token - The dependency injection token to inject
	 *
	 * @example
	 * // Interface injection
	 * interface ILogger {
	 *     Log(message: string): void
	 * }
	 * const ILogger = createToken<ILogger>("ILogger")
	 *
	 * class GameServer {
	 *     constructor(@Inject(ILogger) private logger: ILogger) {
	 *         this.logger.Log("Server started")
	 *     }
	 * }
	 *
	 * @example
	 * // Multi-injection (array)
	 * const IDamageModifier = createToken<IDamageModifier>("IDamageModifier")
	 *
	 * class CombatSystem {
	 *     constructor(
	 *         @Inject(IDamageModifier) private modifiers: IDamageModifier[]
	 *     ) {}
	 *
	 *     CalculateDamage(base: number): number {
	 *         let damage = base
	 *         for (const modifier of this.modifiers) {
	 *             damage = modifier.Modify(damage)
	 *         }
	 *         return damage
	 *     }
	 * }
	 *
	 * @example
	 * // Keyed injection (Map)
	 * const IAbilityProto = createToken<IAbilityPrototype>("IAbilityProto")
	 *
	 * class AbilitySystem {
	 *     constructor(
	 *         @Inject(IAbilityProto) private abilities: Map<string, IAbilityPrototype>
	 *     ) {}
	 *
	 *     GetAbility(name: string): IAbilityPrototype {
	 *         return this.abilities.get(name)!
	 *     }
	 * }
	 *
	 * @example
	 * // Mixed injection (concrete + interface)
	 * class PlayerController {
	 *     constructor(
	 *         private audioManager: AudioManager,  // Autowired (no decorator)
	 *         @Inject(ILogger) private logger: ILogger,  // Interface injection
	 *         @Inject(IInputHandler) private input: IInputHandler
	 *     ) {}
	 * }
	 
]]
local function Inject(token)
	return function(target, _propertyKey, parameterIndex)
		local existingTokens = Reflect.GetOwnMetadata(target, MetadataKeys.DependencyTokens) or {}
		existingTokens[parameterIndex + 1] = token
		Reflect.DefineMetadata(target, MetadataKeys.DependencyTokens, existingTokens)
	end
end
--[[
	*
	 * Marks a constructor parameter as runtime-provided (not injected).
	 * Runtime parameters are passed when creating instances via factory functions.
	 *
	 * Use for:
	 * - Per-instance configuration (level, target, position)
	 * - Data that changes per instantiation
	 * - Values not available at registration time
	 *
	 * The container auto-generates factory functions for services with runtime parameters:
	 * `type Factory<T, TArgs> = (...args: TArgs) => T`
	 *
	 * @example
	 * // Ability with runtime target
	 * @Scoped()
	 * class FireballInstance {
	 *     constructor(
	 *         @RuntimeParameter() private target: Enemy,
	 *         @RuntimeParameter() private level: number,
	 *         @Inject(IVFXManager) private vfx: IVFXManager  // Injected
	 *     ) {}
	 *
	 *     Cast() {
	 *         this.vfx.PlayEffect("fireball", this.target.Position)
	 *         this.target.TakeDamage(50 * this.level)
	 *     }
	 * }
	 *
	 * // Container generates factory:
	 * type FireballFactory = (target: Enemy, level: number) => FireballInstance
	 *
	 * // Usage in parent service:
	 * class AbilitySystem {
	 *     constructor(private createFireball: FireballFactory) {}
	 *
	 *     CastFireball(enemy: Enemy, level: number) {
	 *         const fireball = this.createFireball(enemy, level)
	 *         fireball.Cast()
	 *     }
	 * }
	 *
	 * @example
	 * // Mixed runtime and injected parameters
	 * @Scoped()
	 * class QuestInstance {
	 *     constructor(
	 *         @RuntimeParameter() private questId: string,  // Runtime
	 *         @RuntimeParameter() private playerLevel: number,  // Runtime
	 *         @Inject(IQuestData) private questData: IQuestData,  // Injected
	 *         private rewardCalculator: RewardCalculator  // Autowired
	 *     ) {}
	 * }
	 *
	 * // Factory signature: (questId: string, playerLevel: number) => QuestInstance
	 
]]
local function RuntimeParameter()
	return function(target, _propertyKey, parameterIndex)
		local existingParams = Reflect.GetOwnMetadata(target, MetadataKeys.RuntimeParameters) or {}
		local _parameterIndex = parameterIndex
		if not (table.find(existingParams, _parameterIndex) ~= nil) then
			local _parameterIndex_1 = parameterIndex
			table.insert(existingParams, _parameterIndex_1)
		end
		Reflect.DefineMetadata(target, MetadataKeys.RuntimeParameters, existingParams)
	end
end
return {
	Inject = Inject,
	RuntimeParameter = RuntimeParameter,
}
