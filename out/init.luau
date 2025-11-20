-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local exports = {}
--* Public API surface for OjaInjection. 
local _Types = TS.import(script, script, "Injection", "Core", "Types")
exports.registerModule = _Types.registerModule
exports.registerScopeModule = _Types.registerScopeModule
exports.createToken = TS.import(script, script, "Injection", "Tokens", "CreateToken").createToken
local _Lifetime = TS.import(script, script, "Injection", "Decorators", "Lifetime")
exports.Single = _Lifetime.Single
exports.Scoped = _Lifetime.Scoped
exports.Factory = _Lifetime.Factory
local _Injection = TS.import(script, script, "Injection", "Decorators", "Injection")
exports.Inject = _Injection.Inject
exports.RuntimeParameter = _Injection.RuntimeParameter
exports.Container = TS.import(script, script, "Injection", "Core", "Container").Container
exports.Scope = TS.import(script, script, "Injection", "Core", "Scope").Scope
exports.TickManager = TS.import(script, script, "Injection", "Core", "TickManager").TickManager
return exports
