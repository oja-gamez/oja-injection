-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local ScopeRegister = TS.import(script, script.Parent.Parent, "ScopeRegister").ScopeRegister
local ScopeModule
do
	ScopeModule = setmetatable({}, {
		__tostring = function()
			return "ScopeModule"
		end,
	})
	ScopeModule.__index = ScopeModule
	function ScopeModule.new(...)
		local self = setmetatable({}, ScopeModule)
		return self:constructor(...) or self
	end
	function ScopeModule:constructor()
		self._register = ScopeRegister.new()
	end
	function ScopeModule:WithRoot(root)
		self._register:WithRoot(root)
	end
	function ScopeModule:ProvideExternal(token, data)
		self._register:ProvideExternal(token, data)
	end
	function ScopeModule:_getRegister()
		return self._register
	end
end
return {
	ScopeModule = ScopeModule,
}
