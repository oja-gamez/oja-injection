import type { Token, Constructor, Lifetime } from "./Types";

export class BindingBuilder {
	constructor(
		private implementation: Constructor,
		private lifetime: Lifetime,
		private onBind: (token: Token | Constructor, impl: Constructor, lifetime: Lifetime) => void,
	) {}

	Bind(token: Token | Constructor): void {
		this.onBind(token, this.implementation, this.lifetime);
	}
}
