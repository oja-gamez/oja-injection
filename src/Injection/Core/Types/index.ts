/**
 * Core type definitions for OjaInjection DI container.
 * Organized by concern for better discoverability.
 */

export type { Constructor, AbstractConstructor } from "./Constructors";

export type { Token } from "./Tokens";

export type { Lifetime } from "./Lifetimes";

export type {
	IDestroyable,
	IStartable,
	ITickable,
	IFixedTickable,
	IRenderTickable,
} from "./Lifecycle";

export type { FactoryFunction, KeyedFactory } from "./Factories";

export { registerModule } from "./ContainerModule";
export type { ModuleBuilder, ModuleDefinition, RegisteredModule } from "./ContainerModule";
export { registerScopeModule } from "./ScopeModule";
export type { ScopeBuilder, RegisteredScopeModule, ScopeModuleFactory } from "./ScopeModule";

export type { ServiceDebugInfo, IScopeDebugInfo, ResolutionContext, ContainerErrorInfo } from "./Diagnostics";
