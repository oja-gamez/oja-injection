import type { Constructor, Token } from "./";
import { ContainerRegister } from "../ContainerRegister";
import type { BindingBuilder } from "../BindingBuilder";
/**
 * Builder exposed to module definitions.
 * Provides helpers for registering services with explicit lifetimes.
 */
export interface ModuleBuilder {
    /** Registers a singleton service. */
    single(implementation: Constructor): BindingBuilder;
    /** Registers a scoped service. */
    scoped(implementation: Constructor): BindingBuilder;
    /** Registers a factory service (new instance per injection). */
    factory(implementation: Constructor): BindingBuilder;
    /** Registers multiple implementations for a token. */
    multi(token: Token, implementations: Constructor[]): void;
    /** Registers keyed implementations for runtime lookup. */
    keyed(token: Token, keyedImplementations: Record<string, Constructor>): void;
}
/**
 * Internal module representation consumed by the container.
 */
export interface RegisteredModule {
    /** @internal */
    _getRegister(): ContainerRegister;
}
/**
 * Module definition function.
 */
export type ModuleDefinition = (builder: ModuleBuilder) => void;
/**
 * Declares a module using a builder DSL.
 *
 * @example
 * export const LoggingModule = registerModule((m) => {
 *     m.single(LoggerService).bind(ILoggerToken);
 * });
 */
export declare function registerModule(definition: ModuleDefinition): RegisteredModule;
//# sourceMappingURL=ContainerModule.d.ts.map