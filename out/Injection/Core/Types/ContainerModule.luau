-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local ContainerRegister = TS.import(script, script.Parent.Parent, "ContainerRegister").ContainerRegister
--[[
	*
	 * Builder exposed to module definitions.
	 * Provides helpers for registering services with explicit lifetimes.
	 
]]
--[[
	*
	 * Internal module representation consumed by the container.
	 
]]
--[[
	*
	 * Module definition function.
	 
]]
local ModuleBuilderImpl
do
	ModuleBuilderImpl = setmetatable({}, {
		__tostring = function()
			return "ModuleBuilderImpl"
		end,
	})
	ModuleBuilderImpl.__index = ModuleBuilderImpl
	function ModuleBuilderImpl.new(...)
		local self = setmetatable({}, ModuleBuilderImpl)
		return self:constructor(...) or self
	end
	function ModuleBuilderImpl:constructor(register)
		self.register = register
	end
	function ModuleBuilderImpl:single(implementation)
		return self.register:Single(implementation)
	end
	function ModuleBuilderImpl:scoped(implementation)
		return self.register:Scoped(implementation)
	end
	function ModuleBuilderImpl:factory(implementation)
		return self.register:Factory(implementation)
	end
	function ModuleBuilderImpl:multi(token, implementations)
		self.register:Multi(token, implementations)
	end
	function ModuleBuilderImpl:keyed(token, keyedImplementations)
		self.register:Keyed(token, keyedImplementations)
	end
end
--[[
	*
	 * Declares a module using a builder DSL.
	 *
	 * @example
	 * export const LoggingModule = registerModule((m) => {
	 *     m.single(LoggerService).bind(ILoggerToken);
	 * });
	 
]]
local function registerModule(definition)
	local register = ContainerRegister.new()
	local builder = ModuleBuilderImpl.new(register)
	definition(builder)
	return {
		_getRegister = function(self)
			return register
		end,
	}
end
return {
	registerModule = registerModule,
}
