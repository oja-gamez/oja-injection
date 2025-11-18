-- Compiled with roblox-ts v3.0.0
local ScopeRegister
do
	ScopeRegister = setmetatable({}, {
		__tostring = function()
			return "ScopeRegister"
		end,
	})
	ScopeRegister.__index = ScopeRegister
	function ScopeRegister.new(...)
		local self = setmetatable({}, ScopeRegister)
		return self:constructor(...) or self
	end
	function ScopeRegister:constructor()
		self.externals = {}
	end
	function ScopeRegister:WithRoot(root)
		self.root = root
	end
	function ScopeRegister:ProvideExternal(token, data)
		local _externals = self.externals
		local _token = token
		local _data = data
		_externals[_token] = _data
	end
	function ScopeRegister:GetRoot()
		return self.root
	end
	function ScopeRegister:GetExternals()
		return self.externals
	end
end
return {
	ScopeRegister = ScopeRegister,
}
