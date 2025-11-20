-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local Reflect = TS.import(script, script.Parent.Parent, "Reflection", "Reflect").Reflect
local MetadataKeys = TS.import(script, script.Parent.Parent, "Reflection", "MetadataKeys").MetadataKeys
local Scope = TS.import(script, script.Parent, "Scope").Scope
local TickManager = TS.import(script, script.Parent, "TickManager").TickManager
local isToken = TS.import(script, script.Parent.Parent, "Tokens", "CreateToken").isToken
local ContainerErrors = TS.import(script, script.Parent, "ContainerErrors").ContainerErrors
--[[
	*
	 * Main dependency injection container.
	 *
	 * The Container is the core of the OjaInjection system. It manages service registrations,
	 * singleton instances, scope creation, and player-scoped dependency injection.
	 *
	 * @example
	 * ```ts
	 * // Create and configure container
	 * const container = new Container({
	 *   StrictDuplicates: true,
	 *   MaxResolutionDepth: 50
	 * });
	 *
	 * // Register modules
	 * container.Use(CoreModule);
	 * container.Use(GameModule);
	 *
	 * // Launch application (auto-resolves IStartable singletons)
	 * container.Launch();
	 * ```
	 
]]
local Container
do
	Container = setmetatable({}, {
		__tostring = function()
			return "Container"
		end,
	})
	Container.__index = Container
	function Container.new(...)
		local self = setmetatable({}, Container)
		return self:constructor(...) or self
	end
	function Container:constructor()
		self._registrations = {}
		self._singletons = {}
		self._multiRegistrations = {}
		self._keyedRegistrations = {}
		self._validated = false
		self._resolutionLock = false
		self._tickManager = TickManager.new()
	end
	function Container:Use(module)
		local register = module:_getRegister()
		-- Process single/scoped/factory registrations
		local registrations = register:GetRegistrations()
		for _, registration in registrations do
			self:ValidateToken(registration.token)
			local serviceReg = {
				Token = registration.token,
				Implementation = registration.implementation,
				Lifetime = registration.lifetime,
				Type = "single",
			}
			local __registrations = self._registrations
			local _token = registration.token
			if __registrations[_token] ~= nil then
				ContainerErrors:DuplicateRegistration(registration.token)
			end
			self:RegisterSingle(registration.token, serviceReg)
		end
		-- Process multi-injection registrations
		local multiRegistrations = register:GetMultiRegistrations()
		for _, multiReg in multiRegistrations do
			self:ValidateToken(multiReg.token)
			for _1, implementation in multiReg.implementations do
				self:RegisterMulti(multiReg.token, implementation)
			end
		end
		-- Process keyed injection registrations
		local keyedRegistrations = register:GetKeyedRegistrations()
		for _, keyedReg in keyedRegistrations do
			self:ValidateToken(keyedReg.token)
			self:RegisterKeyed(keyedReg.token, keyedReg.key, keyedReg.implementation)
		end
		self._validated = false
	end
	function Container:Launch()
		-- Validate all registrations before starting services
		self:Validate()
		for token, registrations in self._registrations do
			for _, registration in registrations do
				if registration.Lifetime == "singleton" then
					-- When Implementation is undefined, the Token IS the implementation (class-only registration)
					local impl = (registration.Implementation or registration.Token)
					-- In Roblox-TS/Lua, methods are directly on the class, not on .prototype
					local _start = impl.Start
					if type(_start) == "function" then
						self:Resolve(token)
						break
					end
				end
			end
		end
	end
	function Container:Resolve(token)
		if not self._validated then
			self:Validate()
		end
		self:ValidateToken(token)
		local _condition = isToken(token)
		if _condition then
			local __keyedRegistrations = self._keyedRegistrations
			local _token = token
			_condition = __keyedRegistrations[_token] ~= nil
		end
		if _condition then
			return self:ResolveKeyed(token)
		end
		local __singletons = self._singletons
		local _token = token
		if __singletons[_token] ~= nil then
			local __singletons_1 = self._singletons
			local _token_1 = token
			return __singletons_1[_token_1]
		end
		local registration = self:GetRegistration(token)
		if not registration then
			ContainerErrors:MissingRegistration(token)
		end
		if registration.Lifetime ~= "singleton" then
			ContainerErrors:LifetimeViolation(token, `Cannot resolve non-singleton service from container.\n` .. `    Service has lifetime: {registration.Lifetime}\n` .. `    Use scope.Resolve() for scoped/factory services.`)
		end
		local context = ContainerErrors:CreateContext()
		local instance = self:CreateInstanceWithContext(registration, context)
		local __singletons_1 = self._singletons
		local _token_1 = token
		__singletons_1[_token_1] = instance
		return instance
	end
	function Container:CreateScope(module)
		local register = module:_getRegister()
		local scope = Scope.new(self, self._tickManager, nil)
		-- Provide external data
		local externals = register:GetExternals()
		for token, instance in pairs(externals) do
			scope:ProvideRuntime(token, instance)
		end
		-- Resolve root if specified
		local root = register:GetRoot()
		if root then
			scope:Resolve(root)
			scope:StartAll()
		end
		return scope
	end
	function Container:GetTickManager()
		return self._tickManager
	end
	function Container:Validate()
		if self._validated then
			return nil
		end
		local errors = {}
		for token, registrations in self._registrations do
			for _, registration in registrations do
				TS.try(function()
					self:ValidateRegistration(registration)
				end, function(e)
					local _arg0 = tostring(e)
					table.insert(errors, _arg0)
				end)
			end
		end
		TS.try(function()
			self:ValidateNoServiceLocator()
		end, function(e)
			local _arg0 = tostring(e)
			table.insert(errors, _arg0)
		end)
		if #errors > 0 then
			local _exp = `[OjaInjection] Container validation failed with {#errors} error(s):\n`
			-- ▼ ReadonlyArray.map ▼
			local _newValue = table.create(#errors)
			local _callback = function(e, i)
				return `  {i + 1}. {e}`
			end
			for _k, _v in errors do
				_newValue[_k] = _callback(_v, _k - 1, errors)
			end
			-- ▲ ReadonlyArray.map ▲
			error(_exp .. table.concat(_newValue, "\n"))
		end
		self._validated = true
	end
	function Container:ValidateNoServiceLocator()
		for token, registrations in self._registrations do
			for _, registration in registrations do
				local lifetime = registration.Lifetime
				local implementation = registration.Implementation or (registration.Token)
				-- Get dependencies
				local dependencyTokens = Reflect.GetMetadata(implementation, MetadataKeys.DependencyTokens)
				local autowiredDeps = Reflect.GetMetadata(implementation, MetadataKeys.Dependencies)
				local _array = {}
				local _length = #_array
				local _array_1 = (dependencyTokens or {})
				local _Length = #_array_1
				table.move(_array_1, 1, _Length, _length + 1, _array)
				_length += _Length
				local _array_2 = (autowiredDeps or {})
				table.move(_array_2, 1, #_array_2, _length + 1, _array)
				local deps = _array
				for _1, dep in deps do
					if not dep then
						continue
					end
				end
			end
		end
	end
	function Container:ValidateRegistration(registration)
		local implementation = registration.Implementation or (registration.Token)
		local dependencyTokens = Reflect.GetMetadata(implementation, MetadataKeys.DependencyTokens)
		local autowiredDeps = Reflect.GetMetadata(implementation, MetadataKeys.Dependencies)
		local runtimeParamIndices = Reflect.GetMetadata(implementation, MetadataKeys.RuntimeParameters) or {}
		local _result = dependencyTokens
		if _result ~= nil then
			_result = #_result
		end
		local _condition = _result
		if not (_condition ~= 0 and _condition == _condition and _condition) then
			_condition = 0
		end
		local _result_1 = autowiredDeps
		if _result_1 ~= nil then
			_result_1 = #_result_1
		end
		local _condition_1 = _result_1
		if not (_condition_1 ~= 0 and _condition_1 == _condition_1 and _condition_1) then
			_condition_1 = 0
		end
		local maxLength = math.max(_condition, _condition_1, if #runtimeParamIndices > 0 then math.max(unpack(runtimeParamIndices)) + 1 else 0)
		do
			local i = 0
			local _shouldIncrement = false
			while true do
				if _shouldIncrement then
					i += 1
				else
					_shouldIncrement = true
				end
				if not (i < maxLength) then
					break
				end
				local _i = i
				if table.find(runtimeParamIndices, _i) ~= nil then
					continue
				end
				local _result_2 = dependencyTokens
				if _result_2 ~= nil then
					_result_2 = _result_2[i + 1]
				end
				local _condition_2 = _result_2
				if not _condition_2 then
					local _result_3 = autowiredDeps
					if _result_3 ~= nil then
						_result_3 = _result_3[i + 1]
					end
					_condition_2 = _result_3
				end
				local token = _condition_2
				if not token then
					continue
				end
				if not self:GetRegistration(token) and not (self._multiRegistrations[token] ~= nil) and not (self._keyedRegistrations[token] ~= nil) then
					error(`Dependency not registered: {ContainerErrors:GetTokenName(token)}\n` .. `  Required by: {ContainerErrors:GetTokenName(registration.Token)}`)
				end
			end
		end
	end
	function Container:CreateInstance(registration, scope, runtimeArgs)
		local context = ContainerErrors:CreateContext()
		return self:CreateInstanceWithContext(registration, context, scope, runtimeArgs)
	end
	function Container:CreateInstanceWithContext(registration, context, scope, runtimeArgs)
		local token = registration.Token
		local implementation = registration.Implementation or token
		if ContainerErrors:IsCircular(token, context) then
			ContainerErrors:CircularDependency(token, context)
		end
		local _exp = context.Chain
		table.insert(_exp, token)
		local _exitType, _returns = TS.try(function()
			local dependencies = self:ResolveDependenciesWithContext(implementation, context, scope, runtimeArgs)
			local instance = implementation.new(unpack(dependencies))
			self:ValidateLifecycleInterfaces(instance, registration.Lifetime)
			local _exp_1 = context.Chain
			_exp_1[#_exp_1] = nil
			return TS.TRY_RETURN, { instance }
		end, function(e)
			local _condition = type(e) == "string"
			if _condition then
				local _value = (string.find(e, "[OjaInjection]"))
				_condition = not (_value ~= 0 and _value == _value and _value)
			end
			if _condition then
				ContainerErrors:ConstructorError(token, e, context)
			end
			error(e)
		end)
		if _exitType then
			return unpack(_returns)
		end
	end
	function Container:ResolveDependencies(constructor, scope, runtimeArgs)
		local context = ContainerErrors:CreateContext()
		return self:ResolveDependenciesWithContext(constructor, context, scope, runtimeArgs)
	end
	function Container:ResolveDependenciesWithContext(constructor, context, scope, runtimeArgs)
		local dependencyTokens = Reflect.GetMetadata(constructor, MetadataKeys.DependencyTokens)
		local autowiredDeps = Reflect.GetMetadata(constructor, MetadataKeys.Dependencies)
		local runtimeParamIndices = Reflect.GetMetadata(constructor, MetadataKeys.RuntimeParameters) or {}
		local _result = dependencyTokens
		if _result ~= nil then
			_result = #_result
		end
		local _condition = _result
		if not (_condition ~= 0 and _condition == _condition and _condition) then
			_condition = 0
		end
		local _result_1 = autowiredDeps
		if _result_1 ~= nil then
			_result_1 = #_result_1
		end
		local _condition_1 = _result_1
		if not (_condition_1 ~= 0 and _condition_1 == _condition_1 and _condition_1) then
			_condition_1 = 0
		end
		local maxLength = math.max(_condition, _condition_1, if #runtimeParamIndices > 0 then math.max(unpack(runtimeParamIndices)) + 1 else 0)
		local resolvedDeps = table.create(maxLength)
		do
			local i = 0
			local _shouldIncrement = false
			while true do
				if _shouldIncrement then
					i += 1
				else
					_shouldIncrement = true
				end
				if not (i < maxLength) then
					break
				end
				local _i = i
				if table.find(runtimeParamIndices, _i) ~= nil then
					local _i_1 = i
					local runtimeIndex = (table.find(runtimeParamIndices, _i_1) or 0) - 1
					local _result_2 = runtimeArgs
					if _result_2 ~= nil then
						_result_2 = _result_2[runtimeIndex + 1]
					end
					resolvedDeps[i + 1] = _result_2
					continue
				end
				local _result_2 = dependencyTokens
				if _result_2 ~= nil then
					_result_2 = _result_2[i + 1]
				end
				local _condition_2 = _result_2
				if not _condition_2 then
					local _result_3 = autowiredDeps
					if _result_3 ~= nil then
						_result_3 = _result_3[i + 1]
					end
					_condition_2 = _result_3
				end
				local token = _condition_2
				if not token then
					error(`Cannot resolve parameter {i} of {constructor.name}\n` .. `No @Inject() decorator found and no autowired type.\n` .. `Either add @Inject(Token) or ensure parameter has a concrete type.`)
				end
				self:ValidateDeadService(constructor, token)
				local resolved = self:ResolveDependencyWithContext(token, context, scope)
				resolvedDeps[i + 1] = resolved
			end
		end
		return resolvedDeps
	end
	function Container:ValidateDeadService(constructor, dependencyToken)
		local lifetime = Reflect.GetMetadata(constructor, MetadataKeys.Lifetime)
		if lifetime ~= "scoped" and lifetime ~= "factory" then
			return nil
		end
		local depName = self:GetTokenName(dependencyToken)
		if depName == "IContainer" or depName == "IScope" then
			local serviceName = self:GetTokenName(constructor)
			error(`[OjaInjection] DeadService: Service locator anti-pattern detected\n` .. `Service: {serviceName} ({lifetime})\n` .. `Attempted to inject: {depName}\n` .. `Scoped and factory services cannot inject IContainer or IScope.\n` .. `Only singletons can inject IContainer (for creating scopes).`)
		end
	end
	function Container:ValidateLifecycleInterfaces(instance, lifetime)
		if lifetime ~= "singleton" then
			local _warmup = instance.Warmup
			local hasWarmup = type(_warmup) == "function"
			if hasWarmup then
				error(`[OjaInjection] LifecycleViolation: IWarmupable can only be used on singleton services\n` .. `Service lifetime: {lifetime}\n` .. `IWarmupable is for CPU-intensive pre-computation on singletons only.`)
			end
		end
	end
	function Container:ResolveDependency(token, scope)
		local context = ContainerErrors:CreateContext()
		return self:ResolveDependencyWithContext(token, context, scope)
	end
	function Container:ResolveDependencyWithContext(token, context, scope)
		self:ValidateToken(token)
		local _condition = isToken(token)
		if _condition then
			local __multiRegistrations = self._multiRegistrations
			local _token = token
			_condition = __multiRegistrations[_token] ~= nil
		end
		if _condition then
			return self:ResolveMulti(token, scope)
		end
		local _condition_1 = isToken(token)
		if _condition_1 then
			local __keyedRegistrations = self._keyedRegistrations
			local _token = token
			_condition_1 = __keyedRegistrations[_token] ~= nil
		end
		if _condition_1 then
			return self:ResolveKeyed(token, scope)
		end
		local registration = self:GetRegistration(token)
		if not registration then
			ContainerErrors:MissingRegistration(token, context)
		end
		if registration.Lifetime == "singleton" then
			local __singletons = self._singletons
			local _token = token
			if __singletons[_token] ~= nil then
				local __singletons_1 = self._singletons
				local _token_1 = token
				return __singletons_1[_token_1]
			end
			local instance = self:CreateInstanceWithContext(registration, context)
			local __singletons_1 = self._singletons
			local _token_1 = token
			__singletons_1[_token_1] = instance
			return instance
		elseif registration.Lifetime == "scoped" then
			if not scope then
				ContainerErrors:LifetimeViolation(token, `Cannot resolve scoped service without scope.\n` .. `    Scoped services must be resolved from a Scope, not the Container.`, context)
			end
			return scope:ResolveWithContext(token, context)
		else
			return self:CreateInstanceWithContext(registration, context, scope)
		end
	end
	function Container:GetRegistration(token)
		local __registrations = self._registrations
		local _token = token
		local registrations = __registrations[_token]
		local _result = registrations
		if _result ~= nil then
			_result = _result[1]
		end
		return _result
	end
	function Container:GetAllRegistrations(token)
		local __registrations = self._registrations
		local _token = token
		local _condition = __registrations[_token]
		if not _condition then
			_condition = {}
		end
		return _condition
	end
	function Container:RegisterSingle(token, registration)
		local __registrations = self._registrations
		local _token = token
		if not (__registrations[_token] ~= nil) then
			local __registrations_1 = self._registrations
			local _token_1 = token
			__registrations_1[_token_1] = {}
		end
		local __registrations_1 = self._registrations
		local _token_1 = token
		local _exp = __registrations_1[_token_1]
		local _registration = registration
		table.insert(_exp, _registration)
	end
	function Container:RegisterMulti(token, implementation)
		local __multiRegistrations = self._multiRegistrations
		local _token = token
		if not (__multiRegistrations[_token] ~= nil) then
			local __multiRegistrations_1 = self._multiRegistrations
			local _token_1 = token
			__multiRegistrations_1[_token_1] = {}
		end
		local __multiRegistrations_1 = self._multiRegistrations
		local _token_1 = token
		local _exp = __multiRegistrations_1[_token_1]
		local _implementation = implementation
		table.insert(_exp, _implementation)
	end
	function Container:RegisterKeyed(token, key, implementation)
		local __keyedRegistrations = self._keyedRegistrations
		local _token = token
		if not (__keyedRegistrations[_token] ~= nil) then
			local __keyedRegistrations_1 = self._keyedRegistrations
			local _token_1 = token
			__keyedRegistrations_1[_token_1] = {}
		end
		local __keyedRegistrations_1 = self._keyedRegistrations
		local _token_1 = token
		local _exp = __keyedRegistrations_1[_token_1]
		local _key = key
		local _implementation = implementation
		_exp[_key] = _implementation
	end
	function Container:ResolveMulti(token, scope)
		local __multiRegistrations = self._multiRegistrations
		local _token = token
		local _condition = __multiRegistrations[_token]
		if not _condition then
			_condition = {}
		end
		local implementations = _condition
		-- ▼ ReadonlyArray.map ▼
		local _newValue = table.create(#implementations)
		local _callback = function(impl)
			local reg = {
				Token = token,
				Implementation = impl,
				Lifetime = "singleton",
				Type = "multi",
			}
			return self:CreateInstance(reg, scope)
		end
		for _k, _v in implementations do
			_newValue[_k] = _callback(_v, _k - 1, implementations)
		end
		-- ▲ ReadonlyArray.map ▲
		return _newValue
	end
	function Container:ResolveKeyed(token, scope)
		local __keyedRegistrations = self._keyedRegistrations
		local _token = token
		local implementations = __keyedRegistrations[_token]
		if not implementations then
			return function(key)
				error(`[OjaInjection] No keyed implementation found for key: "{key}"`)
			end
		end
		return function(key)
			local _key = key
			local impl = implementations[_key]
			if not impl then
				local availableKeys = {}
				for k in implementations do
					table.insert(availableKeys, k)
				end
				error(`[OjaInjection] Keyed injection failed\n` .. `Token: {self:GetTokenName(token)}\n` .. `Key: "{key}"\n` .. `Available keys: {table.concat(availableKeys, ", ")}`)
			end
			local reg = {
				Token = token,
				Implementation = impl,
				Lifetime = "factory",
				Type = "keyed",
				Key = key,
			}
			return self:CreateInstance(reg, scope)
		end
	end
	function Container:GetTokenName(token)
		if isToken(token) then
			local _condition = token.__description
			if not (_condition ~= "" and _condition) then
				_condition = "UnknownToken"
			end
			return _condition
		end
		local _condition = token.name
		if not (_condition ~= "" and _condition) then
			_condition = "UnknownClass"
		end
		return _condition
	end
	function Container:ValidateToken(token)
		if token == nil or token == nil then
			ContainerErrors:InvalidToken(token)
		end
		local _condition = not isToken(token)
		if _condition then
			local _token = token
			_condition = not (type(_token) == "table")
			if _condition then
				local _token_1 = token
				_condition = not (type(_token_1) == "function")
			end
		end
		if _condition then
			ContainerErrors:InvalidToken(token)
		end
	end
end
return {
	Container = Container,
}
