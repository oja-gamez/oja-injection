# @oja-gamez/oja-injection

Opinionated dependency injection container for Roblox TypeScript.

## Usage

```ts
import { Container, registerModule, registerScopeModule, Single, Scoped, Inject, createToken } from "@oja-gamez/oja-injection"

// Define services
@Single()
class AudioManager {
  PlaySound(id: string) { }
}

@Scoped()
class PlayerStats {
  constructor(
    @Inject(AudioManager) private audio: AudioManager
  ) {}
}

// Register services
const GameServices = registerModule((m) => {
  m.single(AudioManager)
  m.scoped(PlayerStats)
})

// Create container
const container = new Container()
container.Use(GameServices)

// Create scopes
const PlayerToken = createToken<Player>("Player")

const PlayerScopeModule = registerScopeModule((scope, player: Player) => {
  scope.withRoot(PlayerStats)
  scope.provideExternal(PlayerToken, player)
})

Players.PlayerAdded.Connect((player) => {
  const scope = container.CreateScope(PlayerScopeModule(player))

  player.AncestryChanged.Connect(() => {
    if (!player.IsDescendantOf(game)) {
      scope.Destroy()
    }
  })
})
```

## Service Lifetimes

### Singleton (`@Single()`)
One instance for the entire application.

```ts
@Single()
class DataService {
  // Shared across all scopes
}
```

### Scoped (`@Scoped()`)
One instance per scope (e.g., per player).

```ts
@Scoped()
class PlayerInventory {
  // New instance for each player
}
```

### Factory (`@Factory()`)
New instance every injection.

```ts
@Factory()
class DamageCalculator {
  // Fresh instance each time
}
```

## Dependency Injection

### Constructor Injection

```ts
@Scoped()
class CombatSystem {
  constructor(
    @Inject(PlayerInventory) private inventory: PlayerInventory,
    @Inject(AudioManager) private audio: AudioManager
  ) {}
}
```

### Token-Based Injection

```ts
const ILogger = createToken<Logger>("ILogger")

const GameServices = registerModule((m) => {
  m.single(ConsoleLogger).Bind(ILogger)  // Implementation → Interface
})

@Single()
class ErrorHandler {
  constructor(@Inject(ILogger) private logger: Logger) {}
}
```

## Lifecycle Hooks

### IStartable
Called after service construction.

```ts
@Scoped()
class PlayerSession implements IStartable {
  Start() {
    print("Player session started")
  }
}
```

### IDestroyable
Called when scope is destroyed.

```ts
@Scoped()
class ConnectionManager implements IDestroyable {
  private connections: RBXScriptConnection[] = []

  Destroy() {
    this.connections.forEach(c => c.Disconnect())
  }
}
```

### ITickable
Called every frame.

```ts
@Scoped()
class MovementController implements ITickable {
  Tick(deltaTime: number) {
    // Update movement
  }
}
```

## Global Tick Management

All `ITickable`, `IFixedTickable`, and `IRenderTickable` services are automatically managed by a **global TickManager**. This provides optimal performance with only **one RunService connection for the entire game**, regardless of how many scopes or tickables exist.

### Automatic Registration

Ticking is completely automatic - just implement the interface:

```ts
@Scoped()
class PlayerMovement implements ITickable {
  Tick(deltaTime: number) {
    // Called every frame automatically
    // Registered when scope creates this service
    // Unregistered when scope is destroyed
  }
}
```

### Performance

- ✅ **One Heartbeat connection** for all ITickable + IFixedTickable services
- ✅ **One RenderStepped connection** for all IRenderTickable services
- ✅ **Automatic cleanup** when scopes are destroyed
- ✅ **Scales to thousands of tickables** without performance issues

### Advanced Control

Access the global TickManager for debugging and control:

```ts
const container = new Container();

// Pause all ticking globally (useful for debugging)
container.GetTickManager().Pause();
container.GetTickManager().Resume();

// Get debug information
const info = container.GetTickManager().GetDebugInfo();
print(`Total tickables: ${info.TotalTickables}`);
print(`Paused: ${info.Paused}`);
```

## Scopes

### Creating Scopes

```ts
const PlayerScopeModule = registerScopeModule((scope, player: Player, profile: PlayerProfile) => {
  scope.withRoot(PlayerController)  // Entry point - eagerly resolved
  scope.provideExternal(PlayerToken, player)
  scope.provideExternal(ProfileToken, profile)
})

const scope = container.CreateScope(PlayerScopeModule(player, profile))
```

### External Data

Provide runtime data to scopes:

```ts
const PlayerToken = createToken<Player>("Player")
const ProfileToken = createToken<PlayerProfile>("Profile")

const PlayerScopeModule = registerScopeModule((scope, player: Player, profile: PlayerProfile) => {
  scope.withRoot(PlayerController)
  scope.provideExternal(PlayerToken, player)
  scope.provideExternal(ProfileToken, profile)
})

@Scoped()
class PlayerData {
  constructor(
    @Inject(PlayerToken) private player: Player,
    @Inject(ProfileToken) private profile: PlayerProfile
  ) {}
}
```

## Multi-Injection

Inject arrays of implementations:

```ts
const IPlugin = createToken<Plugin>("IPlugin")

const GameServices = registerModule((m) => {
  m.multi(IPlugin, [AnalyticsPlugin, TeleportPlugin, ShopPlugin])
})

@Single()
class PluginManager {
  constructor(@Inject(IPlugin) private plugins: Plugin[]) {
    // Receives array of all plugins
  }
}
```

## Keyed Injection

Inject factories for runtime resolution:

```ts
const IWeapon = createToken<Weapon>("IWeapon")

const GameServices = registerModule((m) => {
  m.keyed(IWeapon, {
    Sword: SwordWeapon,
    Bow: BowWeapon,
    Staff: StaffWeapon
  })
})

@Scoped()
class WeaponSystem {
  constructor(@Inject(IWeapon) private weaponFactory: KeyedFactory<Weapon>) {
    const sword = this.weaponFactory("Sword")
    const bow = this.weaponFactory("Bow")
  }
}
```

## Best Practices

### Load Data Before Creating Scopes

```ts
// Good - load async data first
const profile = await ProfileStore.LoadAsync(player.UserId)
const scope = container.CreateScope(PlayerScopeModule(player, profile))

// Bad - don't load async data in services
@Scoped()
class BadService {
  async Start() {
    await this.LoadData()  // Anti-pattern
  }
}
```

### Use Tokens for Abstractions

```ts
// Good - depend on abstraction
const IDataStore = createToken<DataStore>("IDataStore")

const GameServices = registerModule((m) => {
  m.single(ProfileStoreImpl).Bind(IDataStore)
})

@Single()
class UserService {
  constructor(@Inject(IDataStore) private store: DataStore) {}
}

// Bad - depend on concrete class directly
@Single()
class UserService {
  constructor(@Inject(ProfileService) private profiles: ProfileService) {}
}
```

### Clean Up Scopes

```ts
Players.PlayerRemoving.Connect((player) => {
  const scope = playerScopes.get(player)
  if (scope) {
    scope.Destroy()  // Calls IDestroyable.Destroy() on all services
    playerScopes.delete(player)
  }
})
```

## Advanced API

### Scope Class

The `Scope` class is returned by `container.CreateScope()` and provides lifecycle management for scoped services.

**Methods:**

- `Destroy()` - Destroys the scope and all its services. Calls `IDestroyable.Destroy()` on all services that implement it.
- `GetScopeId()` - Returns the unique ID of this scope (useful for debugging).
- `DebugServices()` - Returns debug information about all services in this scope.

**Example:**

```ts
const scope = container.CreateScope(PlayerScopeModule(player))

// Get scope ID for logging
const scopeId = scope.GetScopeId()
print(`Created scope: ${scopeId}`)

// Debug services
const debugInfo = scope.DebugServices()
print(`Scope has ${debugInfo.Services.size()} services`)

// Clean up when done
scope.Destroy()
```

### TickManager

Global tick manager that handles all `ITickable`, `IFixedTickable`, and `IRenderTickable` services. Access via `container.GetTickManager()`.

**Methods:**

- `Pause()` - Pauses all ticking globally (useful for pausing game logic).
- `Resume()` - Resumes all ticking.
- `IsPaused()` - Returns whether ticking is currently paused.
- `GetDebugInfo()` - Returns diagnostic information about registered tickables.

**Example:**

```ts
const tickManager = container.GetTickManager()

// Pause game logic (e.g., when opening pause menu)
tickManager.Pause()

// Resume
tickManager.Resume()

// Debug tickable services
const debugInfo = tickManager.GetDebugInfo()
print(`Tickables: ${debugInfo.TickableCount}`)
print(`Fixed Tickables: ${debugInfo.FixedTickableCount}`)
print(`Paused: ${debugInfo.Paused}`)
```

**Performance Note:**

OjaInjection uses **one Heartbeat connection** and **one RenderStepped connection** for the entire game, regardless of how many tickable services you have. This is significantly more efficient than creating individual connections per service.

## License

ISC
