import type { Token, Constructor, Lifetime } from "./Types";
export declare class BindingBuilder {
    private implementation;
    private lifetime;
    private onBind;
    constructor(implementation: Constructor, lifetime: Lifetime, onBind: (token: Token | Constructor, impl: Constructor, lifetime: Lifetime) => void);
    Bind(token: Token | Constructor): void;
}
//# sourceMappingURL=BindingBuilder.d.ts.map