-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local exports = {}
-- ===== Core Types =====
local _Types = TS.import(script, script, "Injection", "Core", "Types")
exports.ContainerModule = _Types.ContainerModule
exports.ScopeModule = _Types.ScopeModule
-- ===== Tokens =====
exports.createToken = TS.import(script, script, "Injection", "Tokens", "CreateToken").createToken
-- ===== Decorators =====
local _Lifetime = TS.import(script, script, "Injection", "Decorators", "Lifetime")
exports.Single = _Lifetime.Single
exports.Scoped = _Lifetime.Scoped
exports.Factory = _Lifetime.Factory
local _Injection = TS.import(script, script, "Injection", "Decorators", "Injection")
exports.Inject = _Injection.Inject
exports.RuntimeParameter = _Injection.RuntimeParameter
-- ===== Container & Scope =====
exports.Container = TS.import(script, script, "Injection", "Core", "Container").Container
exports.Scope = TS.import(script, script, "Injection", "Core", "Scope").Scope
return exports
