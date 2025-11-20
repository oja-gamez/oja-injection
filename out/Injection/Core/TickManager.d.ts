/**
 * Global tick manager for all ITickable services across all scopes.
 * Uses a single RunService connection to tick all registered tickables.
 */
import type { ITickable, IFixedTickable, IRenderTickable } from "./Types";
/**
 * Singleton tick manager that handles all ticking for the entire application.
 * Scopes register/unregister their tickables with this manager.
 *
 * @remarks
 * Uses only one Heartbeat and one RenderStepped connection for the entire game,
 * regardless of how many scopes or tickables exist. This is optimal for performance.
 */
export declare class TickManager {
    private _tickables;
    private _fixedTickables;
    private _renderTickables;
    private _heartbeatConnection?;
    private _renderSteppedConnection?;
    private _paused;
    /**
     * Registers a tickable service.
     * @internal Called by Scope when tracking instances
     */
    RegisterTickable(tickable: ITickable): void;
    /**
     * Registers a fixed tickable service.
     * @internal Called by Scope when tracking instances
     */
    RegisterFixedTickable(tickable: IFixedTickable): void;
    /**
     * Registers a render tickable service.
     * @internal Called by Scope when tracking instances
     */
    RegisterRenderTickable(tickable: IRenderTickable): void;
    /**
     * Unregisters a tickable service.
     * @internal Called by Scope when destroying
     */
    UnregisterTickable(tickable: ITickable): void;
    /**
     * Unregisters a fixed tickable service.
     * @internal Called by Scope when destroying
     */
    UnregisterFixedTickable(tickable: IFixedTickable): void;
    /**
     * Unregisters a render tickable service.
     * @internal Called by Scope when destroying
     */
    UnregisterRenderTickable(tickable: IRenderTickable): void;
    /**
     * Pauses all ticking globally.
     * Useful for debugging or game pause states.
     */
    Pause(): void;
    /**
     * Resumes all ticking globally.
     */
    Resume(): void;
    /**
     * Gets the current paused state.
     */
    IsPaused(): boolean;
    /**
     * Gets debug information about registered tickables.
     */
    GetDebugInfo(): {
        Tickables: number;
        FixedTickables: number;
        RenderTickables: number;
        TotalTickables: number;
        Paused: boolean;
    };
    /**
     * Ensures Heartbeat connection exists.
     */
    private EnsureHeartbeatConnection;
    /**
     * Ensures RenderStepped connection exists.
     */
    private EnsureRenderSteppedConnection;
    /**
     * Ticks all registered tickables.
     */
    private TickAll;
    /**
     * Render ticks all registered render tickables.
     */
    private RenderTickAll;
    /**
     * Destroys the tick manager and disconnects all connections.
     * @internal Only called when shutting down the entire application
     */
    Destroy(): void;
}
//# sourceMappingURL=TickManager.d.ts.map