import type { Token, Constructor } from "./Types";
export declare class ScopeRegister {
    private root?;
    private externals;
    WithRoot(root: Constructor): void;
    ProvideExternal<T>(token: Token<T> | Constructor<T>, data: T): void;
    GetRoot(): Constructor | undefined;
    GetExternals(): Map<Token | Constructor, unknown>;
}
//# sourceMappingURL=ScopeRegister.d.ts.map