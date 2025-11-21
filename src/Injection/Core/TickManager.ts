/**
 * Global tick manager for all ITickable services across all scopes.
 * Uses a single RunService connection to tick all registered tickables.
 */

import { RunService } from "@rbxts/services";
import type { ITickable, IFixedTickable, IRenderTickable } from "./Types";

/**
 * Singleton tick manager that handles all ticking for the entire application.
 * Scopes register/unregister their tickables with this manager.
 *
 * @remarks
 * Uses only one Heartbeat and one RenderStepped connection for the entire game,
 * regardless of how many scopes or tickables exist. This is optimal for performance.
 */
export class TickManager {
	private _tickables: ITickable[] = [];
	private _fixedTickables: IFixedTickable[] = [];
	private _renderTickables: IRenderTickable[] = [];

	private _heartbeatConnection?: RBXScriptConnection;
	private _renderSteppedConnection?: RBXScriptConnection;

	private _paused = false;

	/**
	 * Registers a tickable service.
	 * @internal Called by Scope when tracking instances
	 */
	RegisterTickable(tickable: ITickable): void {
		this._tickables.push(tickable);
		this.EnsureHeartbeatConnection();
	}

	/**
	 * Registers a fixed tickable service.
	 * @internal Called by Scope when tracking instances
	 */
	RegisterFixedTickable(tickable: IFixedTickable): void {
		this._fixedTickables.push(tickable);
		this.EnsureHeartbeatConnection();
	}

	/**
	 * Registers a render tickable service.
	 * @internal Called by Scope when tracking instances
	 */
	RegisterRenderTickable(tickable: IRenderTickable): void {
		this._renderTickables.push(tickable);
		this.EnsureRenderSteppedConnection();
	}

	/**
	 * Unregisters a tickable service.
	 * @internal Called by Scope when destroying
	 */
	UnregisterTickable(tickable: ITickable): void {
		const index = this._tickables.indexOf(tickable);
		if (index !== -1) {
			this._tickables.unorderedRemove(index);
		}
	}

	/**
	 * Unregisters a fixed tickable service.
	 * @internal Called by Scope when destroying
	 */
	UnregisterFixedTickable(tickable: IFixedTickable): void {
		const index = this._fixedTickables.indexOf(tickable);
		if (index !== -1) {
			this._fixedTickables.unorderedRemove(index);
		}
	}

	/**
	 * Unregisters a render tickable service.
	 * @internal Called by Scope when destroying
	 */
	UnregisterRenderTickable(tickable: IRenderTickable): void {
		const index = this._renderTickables.indexOf(tickable);
		if (index !== -1) {
			this._renderTickables.unorderedRemove(index);
		}
	}

	/**
	 * Pauses all ticking globally.
	 * Useful for debugging or game pause states.
	 */
	Pause(): void {
		this._paused = true;
	}

	/**
	 * Resumes all ticking globally.
	 */
	Resume(): void {
		this._paused = false;
	}

	/**
	 * Gets the current paused state.
	 */
	IsPaused(): boolean {
		return this._paused;
	}

	/**
	 * Gets debug information about registered tickables.
	 */
	GetDebugInfo(): {
		Tickables: number;
		FixedTickables: number;
		RenderTickables: number;
		TotalTickables: number;
		Paused: boolean;
	} {
		return {
			Tickables: this._tickables.size(),
			FixedTickables: this._fixedTickables.size(),
			RenderTickables: this._renderTickables.size(),
			TotalTickables: this._tickables.size() + this._fixedTickables.size() + this._renderTickables.size(),
			Paused: this._paused,
		};
	}

	/**
	 * Ensures Heartbeat connection exists.
	 */
	private EnsureHeartbeatConnection(): void {
		if (!this._heartbeatConnection) {
			this._heartbeatConnection = RunService.Heartbeat.Connect((deltaTime) => {
				if (this._paused) return;
				this.TickAll(deltaTime);
			});
		}
	}

	/**
	 * Ensures RenderStepped connection exists.
	 */
	private EnsureRenderSteppedConnection(): void {
		if (!this._renderSteppedConnection && RunService.IsClient()) {
			this._renderSteppedConnection = RunService.RenderStepped.Connect((deltaTime) => {
				if (this._paused) return;
				this.RenderTickAll(deltaTime);
			});
		}
	}

	/**
	 * Ticks all registered tickables.
	 */
	private TickAll(deltaTime: number): void {
		for (const tickable of this._tickables) {
			try {
				tickable.Tick(deltaTime);
			} catch (e) {
				warn(`[TickManager] Error ticking service: ${e}`);
			}
		}

		for (const tickable of this._fixedTickables) {
			try {
				tickable.FixedTick(deltaTime);
			} catch (e) {
				warn(`[TickManager] Error fixed-ticking service: ${e}`);
			}
		}
	}

	/**
	 * Render ticks all registered render tickables.
	 */
	private RenderTickAll(deltaTime: number): void {
		for (const tickable of this._renderTickables) {
			try {
				tickable.RenderTick(deltaTime);
			} catch (e) {
				warn(`[TickManager] Error render-ticking service: ${e}`);
			}
		}
	}

	/**
	 * Destroys the tick manager and disconnects all connections.
	 * @internal Only called when shutting down the entire application
	 */
	Destroy(): void {
		this._heartbeatConnection?.Disconnect();
		this._renderSteppedConnection?.Disconnect();
		this._tickables = [];
		this._fixedTickables = [];
		this._renderTickables = [];
	}
}
