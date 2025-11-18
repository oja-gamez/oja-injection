import type { Constructor, Token } from "./";
import { ScopeRegister } from "../ScopeRegister";

export class ScopeModule {
	private readonly _register = new ScopeRegister();

	protected WithRoot(root: Constructor): void {
		this._register.WithRoot(root);
	}

	protected ProvideExternal<T>(token: Token<T> | Constructor<T>, data: T): void {
		this._register.ProvideExternal(token, data);
	}

	/** @internal */
	_getRegister(): ScopeRegister {
		return this._register;
	}
}
