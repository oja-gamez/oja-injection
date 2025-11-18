-- Compiled with roblox-ts v3.0.0
--[[
	*
	 * Reflection/metadata API for OjaInjection
	 * Ported from Flamework's reflect.ts with adaptations for C# naming conventions
	 
]]
local Reflect = {}
do
	local _container = Reflect
	--* object -> property -> key -> value 
	local metadata = setmetatable({}, {
		__mode = "k",
	})
	local NO_PROP_MARKER = {}
	local function getObjMetadata(obj, prop, create)
		local _condition = prop
		if _condition == nil then
			_condition = NO_PROP_MARKER
		end
		local realProp = _condition
		if create then
			local _obj = obj
			local objMetadata = metadata[_obj]
			if not objMetadata then
				local _exp = obj
				objMetadata = {}
				local _objMetadata = objMetadata
				metadata[_exp] = _objMetadata
			end
			local propMetadata = objMetadata[realProp]
			if not propMetadata then
				local _objMetadata = objMetadata
				propMetadata = {}
				local _propMetadata = propMetadata
				_objMetadata[realProp] = _propMetadata
			end
			return propMetadata
		else
			local _obj = obj
			local _result = metadata[_obj]
			if _result ~= nil then
				_result = _result[realProp]
			end
			return _result
		end
	end
	local function getParentConstructor(obj)
		local metatable = getmetatable(obj)
		if metatable and type(metatable) == "table" then
			return rawget(metatable, "__index")
		end
	end
	--[[
		*
			 * Apply metadata onto this object.
			 
	]]
	local function DefineMetadata(obj, key, value, property)
		local objMetadata = getObjMetadata(obj, property, true)
		local _key = key
		local _value = value
		objMetadata[_key] = _value
	end
	_container.DefineMetadata = DefineMetadata
	--[[
		*
			 * Delete metadata from this object.
			 
	]]
	local function DeleteMetadata(obj, key, property)
		local objMetadata = getObjMetadata(obj, property)
		local _result = objMetadata
		if _result ~= nil then
			local _key = key
			_result[_key] = nil
		end
	end
	_container.DeleteMetadata = DeleteMetadata
	--[[
		*
			 * Get metadata from this object.
			 * Type parameter is an assertion.
			 
	]]
	local function GetOwnMetadata(obj, key, property)
		local objMetadata = getObjMetadata(obj, property)
		local _result = objMetadata
		if _result ~= nil then
			local _key = key
			_result = _result[_key]
		end
		return _result
	end
	_container.GetOwnMetadata = GetOwnMetadata
	--[[
		*
			 * Check if this object has the specified metadata key.
			 
	]]
	local function HasOwnMetadata(obj, key, property)
		local objMetadata = getObjMetadata(obj, property)
		local _result = objMetadata
		if _result ~= nil then
			local _key = key
			_result = _result[_key] ~= nil
		end
		local _condition = _result
		if _condition == nil then
			_condition = false
		end
		return _condition
	end
	_container.HasOwnMetadata = HasOwnMetadata
	--[[
		*
			 * Retrieve all metadata keys for this object.
			 
	]]
	local function GetOwnMetadataKeys(obj, property)
		local objMetadata = getObjMetadata(obj, property)
		local keys = {}
		local _result = objMetadata
		if _result ~= nil then
			-- ▼ ReadonlyMap.forEach ▼
			local _callback = function(_, key)
				local _key = key
				table.insert(keys, _key)
				return #keys
			end
			for _k, _v in _result do
				_callback(_v, _k, _result)
			end
			-- ▲ ReadonlyMap.forEach ▲
		end
		return keys
	end
	_container.GetOwnMetadataKeys = GetOwnMetadataKeys
	--[[
		*
			 * Retrieves all properties (that contain metadata) on this object.
			 
	]]
	local function GetOwnProperties(obj)
		local _obj = obj
		local properties = metadata[_obj]
		if not properties then
			return {}
		end
		local keys = {}
		for key in properties do
			if key ~= NO_PROP_MARKER then
				table.insert(keys, key)
			end
		end
		return keys
	end
	_container.GetOwnProperties = GetOwnProperties
	--[[
		*
			 * Retrieve all values for the specified key from the object and its parents.
			 * Type parameter is an assertion.
			 
	]]
	local function GetMetadatas(obj, key, property)
		local values = {}
		local value = GetOwnMetadata(obj, key, property)
		if value ~= nil then
			table.insert(values, value)
		end
		local parent = getParentConstructor(obj)
		if parent then
			local _exp = GetMetadatas(parent, key, property)
			-- ▼ ReadonlyArray.forEach ▼
			local _callback = function(value)
				local _value = value
				table.insert(values, _value)
				return #values
			end
			for _k, _v in _exp do
				_callback(_v, _k - 1, _exp)
			end
			-- ▲ ReadonlyArray.forEach ▲
		end
		return values
	end
	_container.GetMetadatas = GetMetadatas
	--[[
		*
			 * Get metadata from this object or its parents.
			 * Type parameter is an assertion.
			 
	]]
	local function GetMetadata(obj, key, property)
		local value = GetOwnMetadata(obj, key, property)
		if value ~= nil then
			return value
		end
		local parent = getParentConstructor(obj)
		if parent then
			return GetMetadata(parent, key, property)
		end
	end
	_container.GetMetadata = GetMetadata
	--[[
		*
			 * Check if this object or any of its parents has the specified metadata key.
			 
	]]
	local function HasMetadata(obj, key, property)
		local value = HasOwnMetadata(obj, key, property)
		if value then
			return value
		end
		local parent = getParentConstructor(obj)
		if parent then
			return HasMetadata(parent, key, property)
		end
		return false
	end
	_container.HasMetadata = HasMetadata
	--[[
		*
			 * Retrieve all metadata keys for this object and its parents.
			 
	]]
	local function GetMetadataKeys(obj, property)
		local _set = {}
		for _, _v in GetOwnMetadataKeys(obj, property) do
			_set[_v] = true
		end
		local keys = _set
		local parent = getParentConstructor(obj)
		if parent then
			local _exp = GetMetadataKeys(parent, property)
			-- ▼ ReadonlyArray.forEach ▼
			local _callback = function(key)
				local _key = key
				keys[_key] = true
				return keys
			end
			for _k, _v in _exp do
				_callback(_v, _k - 1, _exp)
			end
			-- ▲ ReadonlyArray.forEach ▲
		end
		local _array = {}
		local _length = #_array
		for _v in keys do
			_length += 1
			_array[_length] = _v
		end
		return _array
	end
	_container.GetMetadataKeys = GetMetadataKeys
	--[[
		*
			 * Retrieves all properties (that contain metadata) on this object and its parents.
			 
	]]
	local function GetProperties(obj)
		local _set = {}
		for _, _v in GetOwnProperties(obj) do
			_set[_v] = true
		end
		local keys = _set
		local parent = getParentConstructor(obj)
		if parent then
			local _exp = GetProperties(parent)
			-- ▼ ReadonlyArray.forEach ▼
			local _callback = function(key)
				local _key = key
				keys[_key] = true
				return keys
			end
			for _k, _v in _exp do
				_callback(_v, _k - 1, _exp)
			end
			-- ▲ ReadonlyArray.forEach ▲
		end
		local _array = {}
		local _length = #_array
		for _v in keys do
			_length += 1
			_array[_length] = _v
		end
		return _array
	end
	_container.GetProperties = GetProperties
end
return {
	Reflect = Reflect,
}
