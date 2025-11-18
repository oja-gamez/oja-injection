import type { Constructor, Token } from "./";
import { ScopeRegister } from "../ScopeRegister";
export declare class ScopeModule {
    private readonly _register;
    protected WithRoot(root: Constructor): void;
    protected ProvideExternal<T>(token: Token<T> | Constructor<T>, data: T): void;
    /** @internal */
    _getRegister(): ScopeRegister;
}
//# sourceMappingURL=ScopeModule.d.ts.map