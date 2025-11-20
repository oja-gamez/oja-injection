-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
--[[
	*
	 * Global tick manager for all ITickable services across all scopes.
	 * Uses a single RunService connection to tick all registered tickables.
	 
]]
local RunService = TS.import(script, TS.getModule(script, "@rbxts", "services")).RunService
--[[
	*
	 * Singleton tick manager that handles all ticking for the entire application.
	 * Scopes register/unregister their tickables with this manager.
	 *
	 * @remarks
	 * Uses only one Heartbeat and one RenderStepped connection for the entire game,
	 * regardless of how many scopes or tickables exist. This is optimal for performance.
	 
]]
local TickManager
do
	TickManager = setmetatable({}, {
		__tostring = function()
			return "TickManager"
		end,
	})
	TickManager.__index = TickManager
	function TickManager.new(...)
		local self = setmetatable({}, TickManager)
		return self:constructor(...) or self
	end
	function TickManager:constructor()
		self._tickables = {}
		self._fixedTickables = {}
		self._renderTickables = {}
		self._paused = false
	end
	function TickManager:RegisterTickable(tickable)
		local __tickables = self._tickables
		local _tickable = tickable
		table.insert(__tickables, _tickable)
		self:EnsureHeartbeatConnection()
	end
	function TickManager:RegisterFixedTickable(tickable)
		local __fixedTickables = self._fixedTickables
		local _tickable = tickable
		table.insert(__fixedTickables, _tickable)
		self:EnsureHeartbeatConnection()
	end
	function TickManager:RegisterRenderTickable(tickable)
		local __renderTickables = self._renderTickables
		local _tickable = tickable
		table.insert(__renderTickables, _tickable)
		self:EnsureRenderSteppedConnection()
	end
	function TickManager:UnregisterTickable(tickable)
		local __tickables = self._tickables
		local _tickable = tickable
		local index = (table.find(__tickables, _tickable) or 0) - 1
		if index ~= -1 then
			-- ▼ Array.unorderedRemove ▼
			local _index = index + 1
			local _exp = self._tickables
			local _length = #_exp
			local _value = _exp[_index]
			if _value ~= nil then
				_exp[_index] = _exp[_length]
				_exp[_length] = nil
			end
			-- ▲ Array.unorderedRemove ▲
		end
	end
	function TickManager:UnregisterFixedTickable(tickable)
		local __fixedTickables = self._fixedTickables
		local _tickable = tickable
		local index = (table.find(__fixedTickables, _tickable) or 0) - 1
		if index ~= -1 then
			-- ▼ Array.unorderedRemove ▼
			local _index = index + 1
			local _exp = self._fixedTickables
			local _length = #_exp
			local _value = _exp[_index]
			if _value ~= nil then
				_exp[_index] = _exp[_length]
				_exp[_length] = nil
			end
			-- ▲ Array.unorderedRemove ▲
		end
	end
	function TickManager:UnregisterRenderTickable(tickable)
		local __renderTickables = self._renderTickables
		local _tickable = tickable
		local index = (table.find(__renderTickables, _tickable) or 0) - 1
		if index ~= -1 then
			-- ▼ Array.unorderedRemove ▼
			local _index = index + 1
			local _exp = self._renderTickables
			local _length = #_exp
			local _value = _exp[_index]
			if _value ~= nil then
				_exp[_index] = _exp[_length]
				_exp[_length] = nil
			end
			-- ▲ Array.unorderedRemove ▲
		end
	end
	function TickManager:Pause()
		self._paused = true
	end
	function TickManager:Resume()
		self._paused = false
	end
	function TickManager:IsPaused()
		return self._paused
	end
	function TickManager:GetDebugInfo()
		return {
			Tickables = #self._tickables,
			FixedTickables = #self._fixedTickables,
			RenderTickables = #self._renderTickables,
			TotalTickables = #self._tickables + #self._fixedTickables + #self._renderTickables,
			Paused = self._paused,
		}
	end
	function TickManager:EnsureHeartbeatConnection()
		if not self._heartbeatConnection then
			self._heartbeatConnection = RunService.Heartbeat:Connect(function(deltaTime)
				if self._paused then
					return nil
				end
				self:TickAll(deltaTime)
			end)
		end
	end
	function TickManager:EnsureRenderSteppedConnection()
		if not self._renderSteppedConnection and RunService:IsClient() then
			self._renderSteppedConnection = RunService.RenderStepped:Connect(function(deltaTime)
				if self._paused then
					return nil
				end
				self:RenderTickAll(deltaTime)
			end)
		end
	end
	function TickManager:TickAll(deltaTime)
		-- Tick ITickable
		for _, tickable in self._tickables do
			TS.try(function()
				tickable:Tick(deltaTime)
			end, function(e)
				warn(`[TickManager] Error ticking service: {e}`)
			end)
		end
		-- Tick IFixedTickable
		for _, tickable in self._fixedTickables do
			TS.try(function()
				tickable:FixedTick(deltaTime)
			end, function(e)
				warn(`[TickManager] Error fixed-ticking service: {e}`)
			end)
		end
	end
	function TickManager:RenderTickAll(deltaTime)
		for _, tickable in self._renderTickables do
			TS.try(function()
				tickable:RenderTick(deltaTime)
			end, function(e)
				warn(`[TickManager] Error render-ticking service: {e}`)
			end)
		end
	end
	function TickManager:Destroy()
		local _result = self._heartbeatConnection
		if _result ~= nil then
			_result:Disconnect()
		end
		local _result_1 = self._renderSteppedConnection
		if _result_1 ~= nil then
			_result_1:Disconnect()
		end
		self._tickables = {}
		self._fixedTickables = {}
		self._renderTickables = {}
	end
end
return {
	TickManager = TickManager,
}
