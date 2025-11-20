/**
 * Core type definitions for OjaInjection DI container.
 * Organized by concern for better discoverability.
 */

// Constructor types
export type { Constructor, AbstractConstructor } from "./Constructors";

// Token types
export type { Token } from "./Tokens";

// Lifetime types
export type { Lifetime } from "./Lifetimes";

// Lifecycle interfaces
export type {
	IDestroyable,
	IStartable,
	ITickable,
	IFixedTickable,
	IRenderTickable,
} from "./Lifecycle";

// Factory types
export type { FactoryFunction, KeyedFactory } from "./Factories";

// Module types
export { registerModule } from "./ContainerModule";
export type { ModuleBuilder, ModuleDefinition, RegisteredModule } from "./ContainerModule";
export { registerScopeModule } from "./ScopeModule";
export type { ScopeBuilder, RegisteredScopeModule, ScopeModuleFactory } from "./ScopeModule";

// Diagnostic types
export type { ServiceDebugInfo, IScopeDebugInfo, ResolutionContext, ContainerErrorInfo } from "./Diagnostics";
