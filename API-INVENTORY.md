# OjaInjection - Public API Inventory

Complete list of all public exports and their use cases. For internal review only.

---

## Core Classes

### `Container`
**What:** Main DI container, manages all service registrations and lifetimes
**Use case:** Create once at app startup, load modules, setup player scopes
**Public Methods:**
- `LoadModule(mod)` - Register services from a module
- `CreateScope(id?)` - Create new scope for scoped services
- `SetupPlayerScopes(config)` - Auto-manage player scopes (create on join, destroy on leave)
- `Launch()` - Auto-resolve all singleton IStartable services (app entry point)

### `Scope`
**What:** Manages scoped service lifetimes (per-player, per-round, etc.)
**Use case:** Created by Container, holds scoped instances, cleanup on destroy
**Public Methods:**
- `CreateChildScope(id?)` - Create nested scope (round inside player, ability inside round)
- `Destroy()` - Sync cleanup, calls IDestroyable.Destroy()
- `DestroyAsync()` - Async cleanup, calls IAsyncDestroyable.DestroyAsync() then IDestroyable.Destroy()
- `DebugServices()` - Get diagnostic info about scope state
- `GetScopeId()` - Get scope's unique ID

---

## Module Builder (Registration API)

### `DeclareInjectable(fn)` function
**What:** Declare classes as injectable dependencies
**Use case:** Define what classes can be injected and their lifetimes
**Example:**
```typescript
const mod = DeclareInjectable((b) => {
    b.single(AudioManager);
    b.scoped(PlayerStats);
    b.factory(DamageCalculator);
});
```

### Plain Module Format
**What:** Simple object syntax for declaring modules
**Use case:** Declare services without needing builder API
**Example:**
```typescript
const ILogger = createToken<ILogger>("ILogger");

const Module = {
    single: [[ILogger, ConsoleLogger], AudioManager],
    scoped: [PlayerStats],
    factory: [DamageCalculator]
};
```
**Properties:**
- `single` - Singleton services (one instance for entire app)
- `scoped` - Scoped services (one instance per scope)
- `factory` - Factory services (new instance every injection)
- `multi` - Multi-injection (inject as arrays)
- `keyed` - Keyed injection (inject as KeyedFactory<T>)

**Note:** No `as const` needed! Arrays and tuples are now mutable for simplicity.

### Builder API (parameter in callback)
**What:** DSL methods available via builder parameter in DeclareInjectable callback
**Methods:**
- `b.single(token, impl?)` - One instance for entire app (singleton)
- `b.scoped(token, impl?)` - One instance per scope
- `b.factory(token, impl?)` - New instance every injection
- `b.multi(token, impl)` - Register multiple implementations, inject as array
- `b.keyed(token, key, impl)` - Register by key, inject as KeyedFactory<T> (callable function)

**Important:** Use `(b) => { b.single(...) }` pattern - NOT destructuring. Roblox TS doesn't support destructuring methods.

---

## Decorators

### Lifetime Decorators
**What:** Mark service lifetime on class definition
**Use case:** Alternative to builder registration

- `@Single()` - Singleton lifetime
- `@Scoped()` - Scoped lifetime
- `@Factory()` - Factory lifetime

### Injection Decorators
**What:** Mark constructor parameters for dependency injection

- `@Inject(token)` - Inject dependency by token
- `@RuntimeParameter()` - Value provided at scope creation (Player, RoundId, etc.)
- `@Optional()` - Dependency is optional, inject undefined if missing

---

## Lifecycle Interfaces

**What:** Implement these for automatic lifecycle management
**Use case:** Container/Scope calls these methods automatically

### `IStartable`
```typescript
interface IStartable {
    Start(): void;
}
```
**When:** Called after construction (for singletons after container.Launch(), for scoped after resolve)
**Use case:** Initialization logic, connect events, start timers

### `ITickable`
```typescript
interface ITickable {
    Tick(deltaTime: number): void;
}
```
**When:** Called every frame (Heartbeat)
**Use case:** Game loops, continuous updates

### `IFixedTickable`
```typescript
interface IFixedTickable {
    FixedTick(deltaTime: number): void;
}
```
**When:** Called every frame (Heartbeat)
**Use case:** Physics updates, fixed timestep logic

### `IRenderTickable`
```typescript
interface IRenderTickable {
    RenderTick(deltaTime: number): void;
}
```
**When:** Called every render frame (RenderStepped, client only)
**Use case:** Camera updates, visual effects

### `IDestroyable`
```typescript
interface IDestroyable {
    Destroy(): void;
}
```
**When:** Called when scope destroyed (sync)
**Use case:** Disconnect events, clear references

### `IAsyncDestroyable`
```typescript
interface IAsyncDestroyable {
    DestroyAsync(): Promise<void>;
}
```
**When:** Called when scope destroyed (async, before IDestroyable)
**Use case:** Save data, async cleanup (ProfileService)

---

## Tokens

### `createToken<T>(description)`
**What:** Create a unique token for interface injection
**Use case:** Inject interfaces that don't exist at runtime
**Example:**
```typescript
const ILogger = createToken<ILogger>("ILogger");

@Single()
class ConsoleLogger implements ILogger {}

DeclareInjectable((b) => {
    b.single(ILogger, ConsoleLogger);
});

class Service {
    constructor(@Inject(ILogger) logger: ILogger) {}
}
```

---

## Types

### `Token<T>`
**What:** Opaque type representing an interface
**Use case:** Type-safe tokens for DI

### `Constructor<T>`
**What:** Class constructor type
**Use case:** Type for class-based injection

### `Lifetime`
**What:** `"singleton" | "scoped" | "factory"`
**Use case:** Service lifetime specification

### `FactoryFunction<T, TArgs>`
**What:** Auto-generated factory function type
**Use case:** Inject factories that take runtime parameters
```typescript
(arg1: string, arg2: number) => ServiceInstance
```

### `KeyedFactory<T>`
**What:** Factory function that creates instances by string key
**Use case:** Multiple implementations by key (weapons, abilities, etc.)
```typescript
(key: string) => T
```
**Example:**
```typescript
constructor(@Inject(IWeapon) private createWeapon: KeyedFactory<IWeapon>) {
    const sword = this.createWeapon("sword"); // Direct function call
}
```

### `ServiceDebugInfo`
**What:** Debug info for a single service
**Fields:** Name, Type, Lifetime, CreatedAt
**Use case:** Debugging, inspection

### `IScopeDebugInfo`
**What:** Debug info for entire scope
**Fields:** ScopeId, CreatedAt, ParentScopeId, Services[], ChildScopes, TotalServices
**Use case:** Debugging, memory leak detection

---

## Interfaces

### `IContainer`
**What:** Public container interface
**Use case:** Type for container dependency injection (singletons can inject)

### `IScope`
**What:** Public scope interface
**Use case:** Type for scope dependency injection (for creating child scopes)

### `PlayerScopeConfig<T>`
**What:** Configuration for SetupPlayerScopes
**Fields:**
- `rootService: Constructor<T>` - Service to resolve (triggers dependency chain)
- `onScopeCreated?: (scope, player) => void` - Hook after scope created
- `onScopeDestroyed?: (scope, player) => void` - Hook after scope destroyed

---

## What Should Be Public vs Internal?

### Still Public - Could Review:

1. **`Scope` class** - Exported but users shouldn't construct directly (only via Container.CreateScope())
   - Kept because users need it as a type for dependency injection

### Already Removed (No Configuration Knobs):

- ❌ **`ContainerConfig`** - Too much mental load, use standard defaults
- ❌ **`ModuleDefinition`** type - Internal type, users don't need it
- ❌ **`AbstractConstructor`** - Just noise, removed
- ❌ **`ModuleBuilder`** interface - Internal, users only see destructured methods
- ❌ **Manual lifecycle interfaces:** `IAsyncStartable`, `IWarmupable`, `IStoppable` - Confusing, removed
- ❌ **Debugging utilities:** `getAllTokens()`, `getTokenDescription()`, `isToken()` - Internal only

---

## Removed from Public API (Now Internal Only)

- ❌ `container.Resolve()` - Footgun, use container.Launch() instead
- ❌ `container.GetPlayerScope()` - Footgun, scopes managed internally
- ❌ `container.WithPlayerScope()` - Testing helper, not for production
- ❌ `scope.Resolve()` - Footgun, DI handles resolution automatically
- ❌ `scope.ProvideExternal()` - Advanced internal use only
- ❌ `container.Validate()` - Auto-called internally, no need to expose
- ❌ `Module` class - Users only need `DeclareInjectable()` function

---

## Summary Stats

**Total Public Exports:** ~26 (down from ~40)
- Classes: 2 (Container, Scope)
- Functions: 8 (6 decorators + 1 helper [createToken] + DeclareInjectable)
- Types: 9 (Token, Constructor, Lifetime, FactoryFunction, KeyedFactory, ServiceDebugInfo, IScopeDebugInfo, PlainModule, Registration)
- Interfaces: 8 (6 lifecycle + IContainer + IScope + PlayerScopeConfig)

**Auto-called Lifecycle Interfaces:** 6
- IStartable, ITickable, IFixedTickable, IRenderTickable, IDestroyable, IAsyncDestroyable

**Removed:** 5 configuration types + 3 manual lifecycle interfaces + 3 debugging utils + footgun methods + Bind() helper (no longer needed with mutable tuples)
