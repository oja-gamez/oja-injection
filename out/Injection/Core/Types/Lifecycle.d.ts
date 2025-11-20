/**
 * Lifecycle interface definitions for service initialization, updates, and cleanup.
 */
/**
 * Interface for services that need synchronous cleanup when destroyed.
 * Container automatically calls Destroy() when scope is destroyed.
 *
 * Use for:
 * - Disconnecting connections
 * - Clearing caches
 * - Releasing resources
 *
 * @example
 * @Scoped()
 * class VFXManager implements IDestroyable {
 *     private effects: ParticleEmitter[] = []
 *
 *     Destroy() {
 *         for (const effect of this.effects) {
 *             effect.Destroy()
 *         }
 *         this.effects = []
 *     }
 * }
 */
export interface IDestroyable {
    /**
     * Synchronous cleanup called when scope is destroyed.
     * Release resources, disconnect connections, clear state.
     *
     * IMPORTANT: All external resources (ProfileStore, network connections, etc.)
     * should be managed in bootstrap code OUTSIDE the container and provided via tokens.
     * Services should only cleanup their own internal state, not external resources.
     */
    Destroy(): void;
}
/**
 * Interface for services that need synchronous initialization after construction.
 * Container automatically calls Start() immediately after creating the instance.
 *
 * Use for:
 * - Setting up event connections
 * - Registering listeners
 * - Starting background tasks
 * - Initializing state that requires other dependencies
 *
 * @example
 * @Scoped()
 * class PlayerSession implements IStartable {
 *     constructor(@Inject(IEventBus) private events: IEventBus) {}
 *
 *     Start() {
 *         // Setup happens after all dependencies injected
 *         this.events.Subscribe("PlayerDied", this.OnPlayerDied)
 *         print("PlayerSession started")
 *     }
 * }
 */
export interface IStartable {
    /**
     * Synchronous initialization called immediately after construction.
     * All dependencies are injected before this is called.
     */
    Start(): void;
}
/**
 * Interface for services that need per-frame updates.
 * Container/Scope connects to RunService.Heartbeat ONCE and calls all tickables.
 *
 * Use for:
 * - Gameplay logic updates
 * - AI behavior
 * - Physics simulation
 * - General per-frame processing
 *
 * Performance: Container uses ONE Heartbeat connection for ALL tickables,
 * not one connection per service. Much more efficient.
 *
 * @example
 * @Scoped()
 * class CombatSystem implements ITickable {
 *     Tick(deltaTime: number) {
 *         // Update combat state
 *         this.ProcessDamageOverTime(deltaTime)
 *         this.UpdateCooldowns(deltaTime)
 *     }
 * }
 */
export interface ITickable {
    /**
     * Called every frame by container/scope.
     * Container manages ONE RunService.Heartbeat connection for all tickables.
     *
     * @param deltaTime - Time elapsed since last frame (in seconds)
     */
    Tick(deltaTime: number): void;
}
/**
 * Interface for services that need fixed-rate updates (physics).
 * Container/Scope connects to RunService.Heartbeat ONCE for fixed timestep updates.
 *
 * Use for:
 * - Physics simulation
 * - Network tick
 * - Deterministic gameplay logic
 *
 * Note: In Roblox, Heartbeat is the standard for physics updates.
 * This interface provides semantic clarity for fixed-rate logic.
 *
 * @example
 * @Singleton()
 * class PhysicsSystem implements IFixedTickable {
 *     FixedTick(deltaTime: number) {
 *         // Physics updates at consistent rate
 *         this.SimulatePhysics(deltaTime)
 *     }
 * }
 */
export interface IFixedTickable {
    /**
     * Called at fixed intervals for physics/network updates.
     * Uses RunService.Heartbeat (runs after physics).
     *
     * @param deltaTime - Fixed time step (typically 1/60s)
     */
    FixedTick(deltaTime: number): void;
}
/**
 * Interface for services that need pre-render updates.
 * Container/Scope connects to RunService.RenderStepped ONCE.
 *
 * Use for:
 * - Camera updates
 * - Visual effects
 * - UI animations
 * - Anything that needs to update RIGHT before rendering
 *
 * Warning: RenderStepped only runs on client. Server services should not implement this.
 *
 * @example
 * @Singleton()
 * class CameraController implements IRenderTickable {
 *     RenderTick(deltaTime: number) {
 *         // Update camera position/rotation before render
 *         this.UpdateCameraPosition(deltaTime)
 *         this.ApplyCameraShake(deltaTime)
 *     }
 * }
 */
export interface IRenderTickable {
    /**
     * Called before rendering (client-only).
     * Uses RunService.RenderStepped (runs before rendering).
     *
     * @param deltaTime - Time elapsed since last render frame
     */
    RenderTick(deltaTime: number): void;
}
//# sourceMappingURL=Lifecycle.d.ts.map