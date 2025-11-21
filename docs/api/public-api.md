# OjaInjection Public API (Typed)

Canonical, typed reference for everything exported from `@zeemontana/oja-injection`. This is the single source of truth for docs going forward.

## Why this container
- Enforces lifetimes (`singleton`, `scoped`, `factory`) and blocks service-locator patterns by default.
- Single global `TickManager` reduces RunService connections while still supporting per-scope tickables.
- Runtime parameters plus generated factories let you pass data without leaking the container.
- Modules keep features isolated; scope modules let you inject external data (players, profiles, etc.) safely.
- Validation catches missing registrations and circular dependencies before you start ticking.

## Import surface

```ts
import {
  // Functions
  registerModule, registerScopeModule, createToken,
  // Decorators
  Single, Scoped, Factory, Inject, RuntimeParameter,
  // Classes
  Container, Scope, TickManager,
  // Types
  Token, Constructor, Lifetime,
  FactoryFunction, KeyedFactory,
  IStartable, IDestroyable, ITickable, IFixedTickable, IRenderTickable,
  ServiceDebugInfo, IScopeDebugInfo,
} from "@zeemontana/oja-injection"
```

## Core classes

### `Container`
```ts
class Container {
  Use(module: RegisteredModule): void
  Launch(): void
  CreateScope(module: RegisteredScopeModule): Scope
  GetTickManager(): TickManager
  // Resolve<T>(token): T // available, but kept internal; prefer modules + scopes
}
```
- Create one per experience/server; load feature modules with `Use`.
- `Launch()` validates and eagerly starts singleton `IStartable` services.
- `CreateScope()` builds a `Scope` using a `registerScopeModule` factory.
- `GetTickManager()` exposes pause/resume + debug info for tickables.

### `Scope`
```ts
class Scope {
  CreateChildScope(id?: string): Scope
  ProvideExternal<T>(token: Token<T> | Constructor<T>, instance: T): void
  Destroy(): void
  DebugServices(): IScopeDebugInfo
  GetScopeId(): string
}
```
- Use `ProvideExternal` for external data (players, profile objects).
- Call `Destroy` to clean up scoped services and unregister tickables.
- `DebugServices` returns per-scope diagnostics (ID, services, child count).

### `TickManager`
```ts
class TickManager {
  Pause(): void
  Resume(): void
  IsPaused(): boolean
  GetDebugInfo(): {
    Tickables: number
    FixedTickables: number
    RenderTickables: number
    TotalTickables: number
    Paused: boolean
  }
}
```
- One Heartbeat and one RenderStepped connection for all services.
- Scopes register/unregister `ITickable`/`IFixedTickable`/`IRenderTickable` automatically.

## Module registration

### `registerModule(definition)`
```ts
type ModuleDefinition = (builder: ModuleBuilder) => void
function registerModule(definition: ModuleDefinition): RegisteredModule
```

`ModuleBuilder` methods:
- `single(impl: Constructor): BindingBuilder`
- `scoped(impl: Constructor): BindingBuilder`
- `factory(impl: Constructor): BindingBuilder`
- `multi(token: Token, impls: Constructor[]): void`
- `keyed(token: Token, map: Record<string, Constructor>): void`

`BindingBuilder`:
- `.Bind(token: Token | Constructor): void` to expose an implementation behind a token or interface.

Example:
```ts
const GameModule = registerModule((m) => {
  m.single(AudioManager)
  m.single(ConsoleLogger).Bind(ILogger)
  m.scoped(PlayerController)
  m.multi(IPlugin, [AnalyticsPlugin, ShopPlugin])
  m.keyed(IWeapon, { Bow: BowWeapon, Sword: SwordWeapon })
})
```

### `registerScopeModule(definition)`
```ts
type ScopeDefinition<TParams extends unknown[]> =
  (builder: ScopeBuilder, ...params: TParams) => void

function registerScopeModule<TParams extends unknown[] = []>(
  definition: ScopeDefinition<TParams>,
): (...params: TParams) => RegisteredScopeModule
```

`ScopeBuilder` methods:
- `withRoot(root: Constructor): void` — eagerly resolve this entry point, then call `Start()` on scoped `IStartable` instances.
- `provideExternal<T>(token: Token<T> | Constructor<T>, data: T): void` — inject runtime data or pre-built objects.

Example:
```ts
const PlayerScope = registerScopeModule((scope, player: Player, profile: Profile) => {
  scope.withRoot(PlayerController)
  scope.provideExternal(PlayerToken, player)
  scope.provideExternal(ProfileToken, profile)
})
// Later: container.CreateScope(PlayerScope(player, profile))
```

## Decorators
- `Single(): ClassDecorator` — singleton lifetime.
- `Scoped(): ClassDecorator` — scoped lifetime (per scope).
- `Factory(): ClassDecorator` — new instance on every resolve.
- `Inject(token: Token<any> | Constructor<any>): ParameterDecorator` — inject by token/interface instead of autowired concrete types.
- `RuntimeParameter(): ParameterDecorator` — mark constructor parameters supplied at runtime; container generates `FactoryFunction` signatures for them.

## Tokens and factory helpers
- `createToken<T>(description: string): Token<T>` — create opaque token for interfaces.
- `type Token<T> = unique symbol-like handle used at runtime`.
- `type Constructor<T = any> = new (...args: any[]) => T`.
- `type Lifetime = "singleton" | "scoped" | "factory"`.
- `type FactoryFunction<T, TArgs extends any[] = any[]> = (...args: TArgs) => T` — auto-generated when a service uses `@RuntimeParameter()`.
- `type KeyedFactory<T, TKey extends string = string> = (key: TKey) => T` — injected when `m.keyed` is used.

## Lifecycle interfaces
```ts
interface IStartable { Start(): void }
interface IDestroyable { Destroy(): void }
interface ITickable { Tick(deltaTime: number): void }
interface IFixedTickable { FixedTick(deltaTime: number): void }
interface IRenderTickable { RenderTick(deltaTime: number): void }
```
- `Start` is called automatically for singleton `IStartable` after `Launch()`.
- Scoped `IStartable` instances are started when their scope’s root is resolved.
- `Destroy` is called when a scope is destroyed.

## Diagnostics
- `ServiceDebugInfo`: `{ Name: string; Type: string; Lifetime: Lifetime; CreatedAt: number; InstanceCount?: number }`
- `IScopeDebugInfo`: `{ ScopeId; CreatedAt; ParentScopeId?; Services: ServiceDebugInfo[]; ChildScopes; TotalServices }`
- Use `Scope.DebugServices()` to inspect scopes; use `TickManager.GetDebugInfo()` for ticking stats.
