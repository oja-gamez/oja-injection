/**
 * Diagnostic and debugging type definitions.
 */

import type { Lifetime } from "./Lifetimes";
import type { Constructor } from "./Constructors";
import type { Token } from "./Tokens";

/**
 * Resolution context for tracking dependency chains.
 * Used to detect circular dependencies and provide rich error messages.
 */
export interface ResolutionContext {
	/** Current dependency chain being resolved */
	Chain: (Token | Constructor)[];
}

/**
 * Error information for container errors with context.
 */
export interface ContainerErrorInfo {
	/** Error type */
	Type: "CircularDependency" | "MissingRegistration" | "InvalidToken" | "LifetimeViolation" | "ConstructorError" | "DuplicateRegistration";

	/** Error message */
	Message: string;

	/** Token/constructor that caused the error */
	Token: Token | Constructor;

	/** Resolution chain leading to the error */
	ResolutionChain?: (Token | Constructor)[];

	/** Additional context */
	Context?: string;
}

/**
 * Diagnostic information about a service instance in a scope.
 * Used by Scope.DebugServices() for debugging and leak detection.
 */
export interface ServiceDebugInfo {
	/** Service class name */
	Name: string;

	/** Full type name */
	Type: string;

	/** Service lifetime */
	Lifetime: Lifetime;

	/** Timestamp when instance was created */
	CreatedAt: number;

	/** Number of instances (for factory services) */
	InstanceCount?: number;
}

/**
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
 */
export interface IScopeDebugInfo {
	/** Unique scope identifier */
	ScopeId: string;

	/** Timestamp when scope was created */
	CreatedAt: number;

	/** Parent scope ID if this is a child scope */
	ParentScopeId?: string;

	/** Array of services in this scope */
	Services: ServiceDebugInfo[];

	/** Number of child scopes */
	ChildScopes: number;

	/** Total number of service instances in this scope */
	TotalServices: number;
}
