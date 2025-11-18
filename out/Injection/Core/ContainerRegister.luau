-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local BindingBuilder = TS.import(script, script.Parent, "BindingBuilder").BindingBuilder
local ContainerRegister
do
	ContainerRegister = setmetatable({}, {
		__tostring = function()
			return "ContainerRegister"
		end,
	})
	ContainerRegister.__index = ContainerRegister
	function ContainerRegister.new(...)
		local self = setmetatable({}, ContainerRegister)
		return self:constructor(...) or self
	end
	function ContainerRegister:constructor()
		self.registrations = {}
		self.multiRegistrations = {}
		self.keyedRegistrations = {}
	end
	function ContainerRegister:Single(implementation)
		local _registrations = self.registrations
		local _arg0 = {
			token = implementation,
			implementation = implementation,
			lifetime = "singleton",
		}
		table.insert(_registrations, _arg0)
		return BindingBuilder.new(implementation, "singleton", function(token, impl, lifetime)
			local _registrations_1 = self.registrations
			local _arg0_1 = {
				token = token,
				implementation = impl,
				lifetime = lifetime,
			}
			table.insert(_registrations_1, _arg0_1)
		end)
	end
	function ContainerRegister:Scoped(implementation)
		local _registrations = self.registrations
		local _arg0 = {
			token = implementation,
			implementation = implementation,
			lifetime = "scoped",
		}
		table.insert(_registrations, _arg0)
		return BindingBuilder.new(implementation, "scoped", function(token, impl, lifetime)
			local _registrations_1 = self.registrations
			local _arg0_1 = {
				token = token,
				implementation = impl,
				lifetime = lifetime,
			}
			table.insert(_registrations_1, _arg0_1)
		end)
	end
	function ContainerRegister:Factory(implementation)
		local _registrations = self.registrations
		local _arg0 = {
			token = implementation,
			implementation = implementation,
			lifetime = "factory",
		}
		table.insert(_registrations, _arg0)
		return BindingBuilder.new(implementation, "factory", function(token, impl, lifetime)
			local _registrations_1 = self.registrations
			local _arg0_1 = {
				token = token,
				implementation = impl,
				lifetime = lifetime,
			}
			table.insert(_registrations_1, _arg0_1)
		end)
	end
	function ContainerRegister:Multi(token, implementations)
		local _multiRegistrations = self.multiRegistrations
		local _arg0 = {
			token = token,
			implementations = implementations,
		}
		table.insert(_multiRegistrations, _arg0)
	end
	function ContainerRegister:Keyed(token, keyedImplementations)
		for key, implementation in pairs(keyedImplementations) do
			local _keyedRegistrations = self.keyedRegistrations
			local _arg0 = {
				token = token,
				key = key,
				implementation = implementation,
			}
			table.insert(_keyedRegistrations, _arg0)
		end
	end
	function ContainerRegister:GetRegistrations()
		return self.registrations
	end
	function ContainerRegister:GetMultiRegistrations()
		return self.multiRegistrations
	end
	function ContainerRegister:GetKeyedRegistrations()
		return self.keyedRegistrations
	end
end
return {
	ContainerRegister = ContainerRegister,
}
