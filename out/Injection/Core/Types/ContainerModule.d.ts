import type { Constructor, Token } from "./";
import { ContainerRegister } from "../ContainerRegister";
import type { BindingBuilder } from "../BindingBuilder";
export declare class ContainerModule {
    private readonly _register;
    protected Single(implementation: Constructor): BindingBuilder;
    protected Scoped(implementation: Constructor): BindingBuilder;
    protected Factory(implementation: Constructor): BindingBuilder;
    protected Multi(token: Token, implementations: Constructor[]): void;
    protected Keyed(token: Token, keyedImplementations: Record<string, Constructor>): void;
    /** @internal */
    _getRegister(): ContainerRegister;
}
//# sourceMappingURL=ContainerModule.d.ts.map