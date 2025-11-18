-- Compiled with roblox-ts v3.0.0
--[[
	*
	 * Lifecycle interface definitions for service initialization, updates, and cleanup.
	 
]]
-- ===== Destruction Interfaces =====
--[[
	*
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
	 
]]
-- ===== Initialization Interfaces =====
--[[
	*
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
	 
]]
--[[
	*
	 * Interface for services that need CPU-intensive pre-computation during container bootstrap.
	 *
	 * ONLY for singleton services - scoped/factory services don't get warmup lifecycle.
	 * Container calls Warmup() before IStartable.
	 *
	 * Use for CPU-bound work (navmesh, parsing, pre-computation).
	 *
	 * Work should complete in reasonable time (seconds). If warmup takes 10+ seconds,
	 * consider whether it should be in bootstrap or deferred to lazy initialization.
	 *
	 * @example
	 * @Single()
	 * class PathfindingService implements IWarmupable {
	 *     private navmesh!: Navmesh;
	 *
	 *     Warmup(): void {
	 *         // Build navmesh during startup (2 seconds of CPU work)
	 *         this.navmesh = this.BuildNavmesh();
	 *         print("Navmesh pre-computed");
	 *     }
	 *
	 *     FindPath(start: Vector3, end: Vector3): Vector3[] {
	 *         // Instant - navmesh already built
	 *         return this.navmesh.FindPath(start, end);
	 *     }
	 * }
	 
]]
-- ===== Update/Tick Interfaces =====
--[[
	*
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
	 
]]
--[[
	*
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
	 
]]
--[[
	*
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
	 
]]
return nil
