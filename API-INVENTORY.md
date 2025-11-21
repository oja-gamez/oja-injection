# OjaInjection - Public API Inventory

Complete list of all public exports and their use cases. For internal review only.

---

## Core Classes

### `Container`
**What:** Main DI container, manages all service registrations and lifetimes
**Use case:** Create once at app startup, load modules, create player scopes
**Public Methods:**
- `Use(module)` - Register services from a module
- `CreateScope(module)` - Create new scope with a scope module
- `GetTickManager()` - Get the global TickManager for advanced control
- `Launch()` - Auto-resolve all singleton IStartable services (app entry point)

### `Scope`
**What:** Manages scoped service lifetimes (per-player, per-round, etc.)
**Use case:** Created by Container, holds scoped instances, cleanup on destroy
**Public Methods:**
- `CreateChildScope(id?)` - Create nested scope (round inside player, ability inside round)
- `Destroy()` - Sync cleanup, calls IDestroyable.Destroy()
- `ProvideRuntime<T>(token, instance)` - Provide runtime data to the scope
- `DebugServices()` - Get diagnostic info about scope state
- `GetScopeId()` - Get scope's unique ID

### `TickManager`
**What:** Global tick manager that handles all ITickable services across all scopes
**Use case:** Accessed via container.GetTickManager() for advanced control (pause/resume/debug)
**Public Methods:**
- `Pause()` - Pauses all ticking globally
- `Resume()` - Resumes all ticking
- `IsPaused()` - Returns whether ticking is currently paused
- `GetDebugInfo()` - Returns diagnostic info: { Tickables, FixedTickables, RenderTickables, TotalTickables, Paused }

**Performance Note:** Uses only ONE Heartbeat and ONE RenderStepped connection for the entire game, regardless of how many tickables exist.

---

## Module Builder (Registration API)

### `registerModule(fn)` function
**What:** Declare classes as injectable dependencies
**Use case:** Define what classes can be injected and their lifetimes
**Example:**
```typescript
const mod = registerModule((m) => {
    m.single(AudioManager);
    m.scoped(PlayerStats);
    m.factory(DamageCalculator);
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
**What:** DSL methods available via builder parameter in registerModule callback
**Methods:**
- `m.single(implementation)` - Register singleton, returns BindingBuilder for .Bind()
- `m.scoped(implementation)` - Register scoped service, returns BindingBuilder for .Bind()
- `m.factory(implementation)` - Register factory service, returns BindingBuilder for .Bind()
- `m.multi(token, implementations)` - Register multiple implementations, inject as array
- `m.keyed(token, keyedImplementations)` - Register by key, inject as KeyedFactory<T> (callable function)

**Important:** Use `(m) => { m.single(...) }` pattern - NOT destructuring. Roblox TS doesn't support destructuring methods.

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

registerModule((m) => {
    m.single(ConsoleLogger).Bind(ILogger);
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

