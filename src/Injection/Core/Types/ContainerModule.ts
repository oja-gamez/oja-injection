import type { Constructor, Token } from "./";
import { ContainerRegister } from "../ContainerRegister";
import type { BindingBuilder } from "../BindingBuilder";

export class ContainerModule {
	private readonly _register = new ContainerRegister();

	protected Single(implementation: Constructor): BindingBuilder {
		return this._register.Single(implementation);
	}

	protected Scoped(implementation: Constructor): BindingBuilder {
		return this._register.Scoped(implementation);
	}

	protected Factory(implementation: Constructor): BindingBuilder {
		return this._register.Factory(implementation);
	}

	protected Multi(token: Token, implementations: Constructor[]): void {
		this._register.Multi(token, implementations);
	}

	protected Keyed(token: Token, keyedImplementations: Record<string, Constructor>): void {
		this._register.Keyed(token, keyedImplementations);
	}

	/** @internal */
	_getRegister(): ContainerRegister {
		return this._register;
	}
}
