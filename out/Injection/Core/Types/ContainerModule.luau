-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local ContainerRegister = TS.import(script, script.Parent.Parent, "ContainerRegister").ContainerRegister
local ContainerModule
do
	ContainerModule = setmetatable({}, {
		__tostring = function()
			return "ContainerModule"
		end,
	})
	ContainerModule.__index = ContainerModule
	function ContainerModule.new(...)
		local self = setmetatable({}, ContainerModule)
		return self:constructor(...) or self
	end
	function ContainerModule:constructor()
		self._register = ContainerRegister.new()
	end
	function ContainerModule:Single(implementation)
		return self._register:Single(implementation)
	end
	function ContainerModule:Scoped(implementation)
		return self._register:Scoped(implementation)
	end
	function ContainerModule:Factory(implementation)
		return self._register:Factory(implementation)
	end
	function ContainerModule:Multi(token, implementations)
		self._register:Multi(token, implementations)
	end
	function ContainerModule:Keyed(token, keyedImplementations)
		self._register:Keyed(token, keyedImplementations)
	end
	function ContainerModule:_getRegister()
		return self._register
	end
end
return {
	ContainerModule = ContainerModule,
}
