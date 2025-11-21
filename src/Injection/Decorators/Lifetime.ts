import { Reflect } from "../Reflection/Reflect";
import { MetadataKeys } from "../Reflection/MetadataKeys";
import type { Constructor, Lifetime } from "../Core/Types";

/**
 * Marks a class as a singleton service (one instance for entire application).
 * Singleton instances are created on first injection and shared across the entire app.
 *
 * Use for:
 * - Managers (AudioManager, VFXManager, etc.)
 * - Shared state (GameState, MatchController)
 * - Expensive services that should only exist once
 *
 * @example
 * @Single()
 * class AudioManager {
 *     private sounds = new Map<string, Sound>()
 *
 *     PlaySound(name: string) {
 *         // ...
 *     }
 * }
 *
 * @example
 * // With dependencies
 * @Single()
 * class GameServer {
 *     constructor(
 *         private audioManager: AudioManager,  // Autowired
 *         @Inject(ILogger) private logger: ILogger  // Interface injection
 *     ) {}
 * }
 */
export function Single() {
	return function <T extends Constructor>(target: T) {
		Reflect.DefineMetadata(target, MetadataKeys.Lifetime, "singleton" as Lifetime);
		Reflect.DefineMetadata(target, MetadataKeys.ServiceName, (target as unknown as { name: string }).name);

		return target;
	};
}

/**
 * Marks a class as a scoped service (one instance per scope).
 * Scoped instances are created when the scope is created or on first injection within that scope.
 * Destroyed automatically when scope is destroyed.
 *
 * Use for:
 * - Per-player state (PlayerStats, PlayerInventory)
 * - Per-match state (MatchState, TeamController)
 * - Per-cast state (AbilityInstance, VFXController)
 *
 * @example
 * @Scoped()
 * class PlayerStats {
 *     health = 100
 *     mana = 50
 *
 *     TakeDamage(amount: number) {
 *         this.health -= amount
 *     }
 * }
 *
 * @example
 * // With IDestroyable for cleanup
 * @Scoped()
 * class FireballInstance implements IDestroyable {
 *     constructor(
 *         @RuntimeParameter() private target: Enemy,
 *         @Inject(IVFXManager) private vfx: IVFXManager
 *     ) {}
 *
 *     Destroy() {
 *         // Auto-called when ability scope destroyed
 *     }
 * }
 */
export function Scoped() {
	return function <T extends Constructor>(target: T) {
		Reflect.DefineMetadata(target, MetadataKeys.Lifetime, "scoped" as Lifetime);
		Reflect.DefineMetadata(target, MetadataKeys.ServiceName, (target as unknown as { name: string }).name);

		return target;
	};
}

/**
 * Marks a class as a factory service (new instance every injection).
 * Factory instances are never cached - a new instance is created every time.
 *
 * Use for:
 * - Stateless utilities (DamageCalculator, PathFinder)
 * - Lightweight objects that don't need caching
 * - Services with per-use configuration
 *
 * @example
 * @Factory()
 * class DamageCalculator {
 *     Calculate(base: number, modifiers: IDamageModifier[]): number {
 *         let damage = base
 *         for (const modifier of modifiers) {
 *             damage = modifier.Modify(damage)
 *         }
 *         return damage
 *     }
 * }
 *
 * @example
 * // Each injection gets a new instance
 * class CombatSystem {
 *     constructor(
 *         private calculator: DamageCalculator  // New instance
 *     ) {}
 *
 *     Attack(attacker: Character, target: Character) {
 *         // This is a NEW calculator instance
 *         const damage = this.calculator.Calculate(attacker.attack, [])
 *     }
 * }
 */
export function Factory() {
	return function <T extends Constructor>(target: T) {
		Reflect.DefineMetadata(target, MetadataKeys.Lifetime, "factory" as Lifetime);
		Reflect.DefineMetadata(target, MetadataKeys.ServiceName, (target as unknown as { name: string }).name);

		return target;
	};
}
