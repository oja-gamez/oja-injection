-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local exports = {}
--[[
	*
	 * Core type definitions for OjaInjection DI container.
	 * Organized by concern for better discoverability.
	 
]]
-- Constructor types
-- Token types
-- Lifetime types
-- Lifecycle interfaces
-- Factory types
-- Module types
exports.registerModule = TS.import(script, script, "ContainerModule").registerModule
exports.registerScopeModule = TS.import(script, script, "ScopeModule").registerScopeModule
-- Diagnostic types
return exports
