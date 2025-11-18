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
export declare class ContainerRegister {
    private registrations;
    private multiRegistrations;
    private keyedRegistrations;
    Single(implementation: Constructor): BindingBuilder;
    Scoped(implementation: Constructor): BindingBuilder;
    Factory(implementation: Constructor): BindingBuilder;
    Multi(token: Token, implementations: Constructor[]): void;
    Keyed(token: Token, keyedImplementations: Record<string, Constructor>): void;
    GetRegistrations(): Registration[];
    GetMultiRegistrations(): MultiRegistration[];
    GetKeyedRegistrations(): KeyedRegistration[];
}
//# sourceMappingURL=ContainerRegister.d.ts.map