# OjaInjection API Reference

Dependency injection container for Roblox TypeScript.

## Installation

```bash
npm install @oja-gamez/oja-injection
```

## Core Classes

### Container
Main DI container that manages service registrations.

```ts
const container = new Container()
container.Use(module: RegisteredModule)
container.Launch()
container.CreateScope(module: RegisteredScopeModule): Scope
container.GetTickManager(): TickManager
```

### Scope
Manages scoped service lifetimes (per-player, per-round, etc.).

```ts
scope.Destroy()
scope.GetScopeId(): string
scope.DebugServices(): IScopeDebugInfo
scope.ProvideRuntime<T>(token, instance)
scope.CreateChildScope(id?: string): Scope
```

### TickManager
Global tick manager for all ITickable services.

```ts
tickManager.Pause()
tickManager.Resume()
tickManager.IsPaused(): boolean
tickManager.GetDebugInfo(): { Tickables, FixedTickables, RenderTickables, TotalTickables, Paused }
```

## Registration API

### registerModule(fn)
Define services and their lifetimes.

```ts
const GameModule = registerModule((m) => {
  m.single(AudioManager)
  m.scoped(PlayerStats)
  m.factory(DamageCalculator)
  m.multi(IPlugin, [Plugin1, Plugin2])
  m.keyed(IWeapon, { Sword: SwordImpl, Bow: BowImpl })
})

container.Use(GameModule)
```

**Builder methods:**
- `m.single(implementation)` - Singleton, returns `.Bind(token)` for interface binding
- `m.scoped(implementation)` - One instance per scope, returns `.Bind(token)`
- `m.factory(implementation)` - New instance every injection, returns `.Bind(token)`
- `m.multi(token, [impl1, impl2])` - Inject as array
- `m.keyed(token, { key: impl })` - Inject as KeyedFactory function

### registerScopeModule(fn)
Define scope configuration with external data.

```ts
const PlayerScope = registerScopeModule((scope, player: Player, data: PlayerData) => {
  scope.withRoot(PlayerController)
  scope.provideExternal(PlayerToken, player)
  scope.provideExternal(PlayerDataToken, data)
})

const scope = container.CreateScope(PlayerScope(player, data))
```

**Builder methods:**
- `scope.withRoot(service)` - Eagerly resolve this service (entry point)
- `scope.provideExternal(token, instance)` - Provide runtime data

## Decorators

### Lifetime Decorators
```ts
@Single()    // Singleton - one instance for entire app
@Scoped()    // Scoped - one instance per scope
@Factory()   // Factory - new instance every injection
```

### Injection Decorators
```ts
@Inject(token)         // Inject via token (for interfaces)
@RuntimeParameter()    // Value provided at scope creation
```

## Lifecycle Interfaces

Services can implement these for automatic lifecycle management:

```ts
interface IStartable {
  Start(): void  // Called after construction
}

interface IDestroyable {
  Destroy(): void  // Called when scope destroyed
}

interface ITickable {
  Tick(deltaTime: number): void  // Called every frame (Heartbeat)
}

interface IFixedTickable {
  FixedTick(deltaTime: number): void  // Called every frame (Heartbeat)
}

interface IRenderTickable {
  RenderTick(deltaTime: number): void  // Called every render frame (RenderStepped, client only)
}
```

## Tokens

Create tokens for interface injection:

```ts
const ILogger = createToken<ILogger>("ILogger")

registerModule((m) => {
  m.single(ConsoleLogger).Bind(ILogger)
})

@Single()
class GameServer {
  constructor(@Inject(ILogger) private logger: ILogger) {}
}
```

## Types

```ts
Token<T>                 // Opaque type for interface injection
Constructor<T>           // Class constructor type
Lifetime                 // "singleton" | "scoped" | "factory"
FactoryFunction<T>       // Auto-generated factory for @RuntimeParameter services
KeyedFactory<T>          // (key: string) => T
ServiceDebugInfo         // Debug info for single service
IScopeDebugInfo          // Debug info for entire scope
```

## Complete Example

```ts
import { Container, createToken, registerModule, registerScopeModule, Single, Scoped, Inject } from "@oja-gamez/oja-injection"

// 1. Define tokens for interfaces
const ILogger = createToken<ILogger>("ILogger")
const PlayerToken = createToken<Player>("Player")

// 2. Define services
@Single()
class AudioManager {
  PlaySound(id: string) { print(`Playing ${id}`) }
}

@Single()
class ConsoleLogger implements ILogger {
  Log(msg: string) { print(msg) }
}

@Scoped()
class PlayerController implements IStartable, ITickable, IDestroyable {
  constructor(
    @Inject(ILogger) private logger: ILogger,
    @Inject(PlayerToken) private player: Player,
    private audio: AudioManager
  ) {}

  Start() {
    this.logger.Log(`Player ${this.player.Name} joined`)
    this.audio.PlaySound("join")
  }

  Tick(dt: number) {
    // Update logic
  }

  Destroy() {
    this.logger.Log(`Player ${this.player.Name} left`)
  }
}

// 3. Register services
const GameModule = registerModule((m) => {
  m.single(AudioManager)
  m.single(ConsoleLogger).Bind(ILogger)
  m.scoped(PlayerController)
})

// 4. Create scope module
const PlayerScope = registerScopeModule((scope, player: Player) => {
  scope.withRoot(PlayerController)
  scope.provideExternal(PlayerToken, player)
})

// 5. Bootstrap
const container = new Container()
container.Use(GameModule)
container.Launch()

// 6. Create player scopes
Players.PlayerAdded.Connect((player) => {
  const scope = container.CreateScope(PlayerScope(player))

  player.AncestryChanged.Connect(() => {
    if (!player.IsDescendantOf(game)) {
      scope.Destroy()
    }
  })
})
```

## Key Patterns

### Load External Data First
```ts
// Load async data BEFORE creating scope
const playerData = await ProfileStore.LoadAsync(player.UserId)
const scope = container.CreateScope(PlayerScope(player, playerData))
```

### Multi-Injection (Arrays)
```ts
const IPlugin = createToken<IPlugin>("IPlugin")

registerModule((m) => {
  m.multi(IPlugin, [AnalyticsPlugin, ShopPlugin, TeleportPlugin])
})

@Single()
class PluginManager {
  constructor(@Inject(IPlugin) private plugins: IPlugin[]) {
    // Receives array of all plugins
  }
}
```

### Keyed Injection (Runtime Resolution)
```ts
const IWeapon = createToken<IWeapon>("IWeapon")

registerModule((m) => {
  m.keyed(IWeapon, {
    Sword: SwordWeapon,
    Bow: BowWeapon,
    Staff: StaffWeapon
  })
})

@Scoped()
class WeaponSystem {
  constructor(@Inject(IWeapon) private createWeapon: KeyedFactory<IWeapon>) {}

  Equip(type: string) {
    const weapon = this.createWeapon(type)  // Runtime resolution
    return weapon
  }
}
```

## Performance Notes

- **One RunService connection** for all tickables globally
- Automatic cleanup when scopes destroyed
- No performance penalty for deep dependency graphs
- Validation happens once at startup
