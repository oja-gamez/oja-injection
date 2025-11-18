-- Compiled with roblox-ts v3.0.0
--[[
	*
	 * Diagnostic and debugging type definitions.
	 
]]
--[[
	*
	 * Resolution context for tracking dependency chains.
	 * Used to detect circular dependencies and provide rich error messages.
	 
]]
--[[
	*
	 * Error information for container errors with context.
	 
]]
--[[
	*
	 * Diagnostic information about a service instance in a scope.
	 * Used by Scope.DebugServices() for debugging and leak detection.
	 
]]
--[[
	*
	 * Diagnostic information about a scope and its contents.
	 * Used for debugging memory leaks and inspecting scope state.
	 *
	 * @example
	 * const debug = playerScope.DebugServices()
	 * print(`Player scope has ${debug.TotalServices} services`)
	 * print(`Child scopes: ${debug.ChildScopes}`)
	 * for (const service of debug.Services) {
	 *     print(`  - ${service.Name} (${service.Type})`)
	 * }
	 
]]
return nil
