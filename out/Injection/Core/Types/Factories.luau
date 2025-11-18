-- Compiled with roblox-ts v3.0.0
--[[
	*
	 * Factory function type definitions for runtime-parameterized services.
	 
]]
--[[
	*
	 * Factory function signature for creating scoped instances with runtime parameters.
	 * Container auto-generates these for services with @RuntimeParameter() decorators.
	 *
	 * @template T - The type of instance the factory creates
	 * @template TArgs - Tuple type of runtime arguments
	 *
	 * @example
	 * // Container generates this for FireballInstance:
	 * type FireballFactory = FactoryFunction<FireballInstance, [level: number, target: Enemy]>
	 *
	 * // Usage:
	 * constructor(private createFireball: FireballFactory) {}
	 * const instance = this.createFireball(5, enemy)
	 
]]
--[[
	*
	 * Factory function that creates instances by string key.
	 * Container auto-injects this when constructor parameter has this type.
	 *
	 * Use for runtime instance creation from string IDs (abilities, items, etc.)
	 * without service locator pattern.
	 *
	 * @template T - The interface/base type to create
	 * @template TKey - The string literal union of valid keys (optional)
	 *
	 * @example
	 * // Define ability IDs
	 * type AbilityId = "fireball" | "icebolt" | "shield"
	 *
	 * // Inject keyed factory
	 * constructor(private createAbility: KeyedFactory<IAbility, AbilityId>) {}
	 *
	 * // Create by key
	 * const fireball = this.createAbility("fireball")  // Type-safe
	 
]]
return nil
