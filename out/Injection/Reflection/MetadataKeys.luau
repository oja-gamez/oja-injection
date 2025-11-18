-- Compiled with roblox-ts v3.0.0
--[[
	*
	 * Metadata keys used by OjaInjection decorators and container.
	 *
	 * All keys prefixed with "oja:" to avoid conflicts with other libraries.
	 
]]
local MetadataKeys = {
	Lifetime = "oja:lifetime",
	Dependencies = "oja:dependencies",
	DependencyTokens = "oja:dependency-tokens",
	RuntimeParameters = "oja:runtime-parameters",
	IsMulti = "oja:is-multi",
	KeyedImplementations = "oja:keyed-implementations",
	Implements = "oja:implements",
	ServiceName = "oja:service-name",
	CreatedAt = "oja:created-at",
	ScopeId = "oja:scope-id",
	Validated = "oja:validated",
	CircularDependencies = "oja:circular-dependencies",
}
--[[
	*
	 * Type-safe metadata key access
	 
]]
return {
	MetadataKeys = MetadataKeys,
}
