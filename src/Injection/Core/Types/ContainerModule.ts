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

class ModuleBuilderImpl implements ModuleBuilder {
    constructor(private readonly register: ContainerRegister) {}

    single(implementation: Constructor): BindingBuilder {
        return this.register.Single(implementation);
    }

    scoped(implementation: Constructor): BindingBuilder {
        return this.register.Scoped(implementation);
    }

    factory(implementation: Constructor): BindingBuilder {
        return this.register.Factory(implementation);
    }

    multi(token: Token, implementations: Constructor[]): void {
        this.register.Multi(token, implementations);
    }

    keyed(token: Token, keyedImplementations: Record<string, Constructor>): void {
        this.register.Keyed(token, keyedImplementations);
    }
}

/**
 * Declares a module using a builder DSL.
 *
 * @example
 * export const LoggingModule = registerModule((m) => {
 *     m.single(LoggerService).bind(ILoggerToken);
 * });
 */
export function registerModule(definition: ModuleDefinition): RegisteredModule {
    const register = new ContainerRegister();
    const builder = new ModuleBuilderImpl(register);
    definition(builder);

    return {
        _getRegister() {
            return register;
        },
    };
}
