# @oja-gamez/oja-injection

Opinionated dependency injection container for Roblox TypeScript.

## Usage

```ts
import { Container, ContainerModule, ScopeModule, Single, Scoped, Inject, createToken } from "@oja-gamez/oja-injection"

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
class GameServices extends ContainerModule {
  constructor() {
    this.Single(AudioManager)
    this.Scoped(PlayerStats)
  }
}

// Create container
const container = new Container()
container.Use(new GameServices())

// Create scopes
const PlayerToken = createToken<Player>("Player")

class PlayerScopeModule extends ScopeModule {
  constructor(private player: Player) {
    this.WithRoot(PlayerStats)
    this.ProvideExternal(PlayerToken, player)
  }
}

Players.PlayerAdded.Connect((player) => {
  const scope = container.CreateScope(new PlayerScopeModule(player))

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

class GameServices extends ContainerModule {
  constructor() {
    this.Single(ConsoleLogger).Bind(ILogger)  // Implementation → Interface
  }
}

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

### IWarmupable
CPU-intensive pre-computation (singletons only).

```ts
@Single()
class PathfindingService implements IWarmupable {
  Warmup() {
    // Build navmesh on startup
  }
}
```

## Scopes

### Creating Scopes

```ts
class PlayerScopeModule extends ScopeModule {
  constructor(
    private player: Player,
    private profile: PlayerProfile
  ) {
    this.WithRoot(PlayerController)  // Entry point - eagerly resolved
    this.ProvideExternal(PlayerToken, player)
    this.ProvideExternal(ProfileToken, profile)
  }
}

const scope = container.CreateScope(new PlayerScopeModule(player, profile))
```

### External Data

Provide runtime data to scopes:

```ts
const PlayerToken = createToken<Player>("Player")
const ProfileToken = createToken<PlayerProfile>("Profile")

class PlayerScopeModule extends ScopeModule {
  constructor(
    private player: Player,
    private profile: PlayerProfile
  ) {
    this.WithRoot(PlayerController)
    this.ProvideExternal(PlayerToken, player)
    this.ProvideExternal(ProfileToken, profile)
  }
}

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

class GameServices extends ContainerModule {
  constructor() {
    this.Multi(IPlugin, [AnalyticsPlugin, TeleportPlugin, ShopPlugin])
  }
}

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

class GameServices extends ContainerModule {
  constructor() {
    this.Keyed(IWeapon, {
      Sword: SwordWeapon,
      Bow: BowWeapon,
      Staff: StaffWeapon
    })
  }
}

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
const scope = container.CreateScope(new PlayerScopeModule(player, profile))

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

class GameServices extends ContainerModule {
  constructor() {
    this.Single(ProfileStoreImpl).Bind(IDataStore)
  }
}

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

## License

ISC
