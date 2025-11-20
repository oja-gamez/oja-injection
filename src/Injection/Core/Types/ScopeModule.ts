import type { Constructor, Token } from "./";
import { ScopeRegister } from "../ScopeRegister";

/** Builder exposed while defining scope modules. */
export interface ScopeBuilder {
	/** Marks the root service that should be eagerly resolved when the scope starts. */
	withRoot(root: Constructor): void;

	/** Provides runtime data or external instances to the scope. */
	provideExternal<T>(token: Token<T> | Constructor<T>, data: T): void;
}

/** Internal representation consumed by the container. */
export interface RegisteredScopeModule {
	/** @internal */
	_getRegister(): ScopeRegister;
}

type ScopeDefinition<TParams extends unknown[]> = (builder: ScopeBuilder, ...params: TParams) => void;

class ScopeBuilderImpl implements ScopeBuilder {
	constructor(private readonly register: ScopeRegister) {}

	withRoot(root: Constructor): void {
		this.register.WithRoot(root);
	}

	provideExternal<T>(token: Token<T> | Constructor<T>, data: T): void {
		this.register.ProvideExternal(token, data);
	}
}

/** Factory returned from registerScopeModule. */
export type ScopeModuleFactory<TParams extends unknown[]> = (...params: TParams) => RegisteredScopeModule;

/** Declares a scope module using the builder DSL. */
export function registerScopeModule<TParams extends unknown[] = []>(
	definition: ScopeDefinition<TParams>,
): ScopeModuleFactory<TParams> {
	return (...params: TParams): RegisteredScopeModule => {
		const register = new ScopeRegister();
		const builder = new ScopeBuilderImpl(register);
		definition(builder, ...params);

		return {
			_getRegister() {
				return register;
			},
		};
	};
}
