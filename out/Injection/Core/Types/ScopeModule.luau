-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local ScopeRegister = TS.import(script, script.Parent.Parent, "ScopeRegister").ScopeRegister
--* Builder exposed while defining scope modules. 
--* Internal representation consumed by the container. 
local ScopeBuilderImpl
do
	ScopeBuilderImpl = setmetatable({}, {
		__tostring = function()
			return "ScopeBuilderImpl"
		end,
	})
	ScopeBuilderImpl.__index = ScopeBuilderImpl
	function ScopeBuilderImpl.new(...)
		local self = setmetatable({}, ScopeBuilderImpl)
		return self:constructor(...) or self
	end
	function ScopeBuilderImpl:constructor(register)
		self.register = register
	end
	function ScopeBuilderImpl:withRoot(root)
		self.register:WithRoot(root)
	end
	function ScopeBuilderImpl:provideExternal(token, data)
		self.register:ProvideExternal(token, data)
	end
end
--* Factory returned from registerScopeModule. 
--* Declares a scope module using the builder DSL. 
local function registerScopeModule(definition)
	return function(...)
		local params = { ... }
		local register = ScopeRegister.new()
		local builder = ScopeBuilderImpl.new(register)
		definition(builder, unpack(params))
		return {
			_getRegister = function(self)
				return register
			end,
		}
	end
end
return {
	registerScopeModule = registerScopeModule,
}
