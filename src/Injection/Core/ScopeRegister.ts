import type { Token, Constructor } from "./Types";

export class ScopeRegister {
	private root?: Constructor;
	private externals = new Map<Token | Constructor, unknown>();

	WithRoot(root: Constructor): void {
		this.root = root;
	}

	ProvideExternal<T>(token: Token<T> | Constructor<T>, data: T): void {
		this.externals.set(token, data);
	}

	GetRoot(): Constructor | undefined {
		return this.root;
	}

	GetExternals(): Map<Token | Constructor, unknown> {
		return this.externals;
	}
}
