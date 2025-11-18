import type { Token, Constructor, Lifetime } from "./Types";
import { BindingBuilder } from "./BindingBuilder";

export interface Registration {
	token: Token | Constructor;
	implementation: Constructor;
	lifetime: Lifetime;
}

export interface MultiRegistration {
	token: Token;
	implementations: Constructor[];
}

export interface KeyedRegistration {
	token: Token;
	key: string;
	implementation: Constructor;
}

export class ContainerRegister {
	private registrations: Registration[] = [];
	private multiRegistrations: MultiRegistration[] = [];
	private keyedRegistrations: KeyedRegistration[] = [];

	Single(implementation: Constructor): BindingBuilder {
		this.registrations.push({
			token: implementation,
			implementation: implementation,
			lifetime: "singleton",
		});

		return new BindingBuilder(implementation, "singleton", (token, impl, lifetime) => {
			this.registrations.push({
				token: token,
				implementation: impl,
				lifetime: lifetime,
			});
		});
	}

	Scoped(implementation: Constructor): BindingBuilder {
		this.registrations.push({
			token: implementation,
			implementation: implementation,
			lifetime: "scoped",
		});

		return new BindingBuilder(implementation, "scoped", (token, impl, lifetime) => {
			this.registrations.push({
				token: token,
				implementation: impl,
				lifetime: lifetime,
			});
		});
	}

	Factory(implementation: Constructor): BindingBuilder {
		this.registrations.push({
			token: implementation,
			implementation: implementation,
			lifetime: "factory",
		});

		return new BindingBuilder(implementation, "factory", (token, impl, lifetime) => {
			this.registrations.push({
				token: token,
				implementation: impl,
				lifetime: lifetime,
			});
		});
	}

	Multi(token: Token, implementations: Constructor[]): void {
		this.multiRegistrations.push({
			token,
			implementations,
		});
	}

	Keyed(token: Token, keyedImplementations: Record<string, Constructor>): void {
		for (const [key, implementation] of pairs(keyedImplementations)) {
			this.keyedRegistrations.push({
				token,
				key: key as string,
				implementation,
			});
		}
	}

	GetRegistrations(): Registration[] {
		return this.registrations;
	}

	GetMultiRegistrations(): MultiRegistration[] {
		return this.multiRegistrations;
	}

	GetKeyedRegistrations(): KeyedRegistration[] {
		return this.keyedRegistrations;
	}
}
