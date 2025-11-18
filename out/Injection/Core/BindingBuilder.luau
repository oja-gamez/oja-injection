-- Compiled with roblox-ts v3.0.0
local BindingBuilder
do
	BindingBuilder = setmetatable({}, {
		__tostring = function()
			return "BindingBuilder"
		end,
	})
	BindingBuilder.__index = BindingBuilder
	function BindingBuilder.new(...)
		local self = setmetatable({}, BindingBuilder)
		return self:constructor(...) or self
	end
	function BindingBuilder:constructor(implementation, lifetime, onBind)
		self.implementation = implementation
		self.lifetime = lifetime
		self.onBind = onBind
	end
	function BindingBuilder:Bind(token)
		self.onBind(token, self.implementation, self.lifetime)
	end
end
return {
	BindingBuilder = BindingBuilder,
}
