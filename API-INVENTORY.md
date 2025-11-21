# Public API Inventory (source of truth)

Keep this list in sync with the code and `docs/api/public-abi.md`. Only include exports that are currently implemented.

## Functions
- `registerModule(definition: (builder: ModuleBuilder) => void): RegisteredModule`
  - Builder methods: `single`, `scoped`, `factory`, `multi`, `keyed`; `BindingBuilder.Bind(...)` maps implementations to tokens.
- `registerScopeModule<TParams extends unknown[]>(definition: (builder: ScopeBuilder, ...params: TParams) => void): (...params: TParams) => RegisteredScopeModule`
  - Scope builder: `withRoot`, `provideExternal`.
- `createToken<T>(description: string): Token<T>`

## Classes
- `Container` — `Use`, `Launch`, `CreateScope`, `GetTickManager` (internal `Resolve` exists but is not part of the public contract).
- `Scope` — `CreateChildScope`, `ProvideExternal`, `Destroy`, `DebugServices`, `GetScopeId`.
- `TickManager` — `Pause`, `Resume`, `IsPaused`, `GetDebugInfo`.

## Decorators
- `Single()`, `Scoped()`, `Factory()` — lifetimes.
- `Inject(token)`, `RuntimeParameter()` — injection helpers.

## Types and interfaces
- `Token<T>`, `Constructor<T = any>`, `Lifetime = "singleton" | "scoped" | "factory"`.
- `FactoryFunction<T, TArgs extends any[] = any[]>`, `KeyedFactory<T, TKey extends string = string>`.
- Lifecycle: `IStartable`, `IDestroyable`, `ITickable`, `IFixedTickable`, `IRenderTickable`.
- Diagnostics: `ServiceDebugInfo`, `IScopeDebugInfo`.

Anything not listed here should be considered internal and free to change.
