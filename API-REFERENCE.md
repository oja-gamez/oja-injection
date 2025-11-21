# OjaInjection API Reference (current)

Canonical typed API lives at `docs/api/public-api.md`. This file summarizes the same surface for quick lookup.

## Quick start

```ts
import {
  Container, registerModule, registerScopeModule,
  Single, Scoped, Inject, createToken,
} from "@zeemontana/oja-injection"

// 1) Tokens for interfaces/runtime data
const ILogger = createToken<ILogger>("ILogger")
const PlayerToken = createToken<Player>("Player")

// 2) Services
@Single()
class ConsoleLogger implements ILogger {
  Log(message: string) { print(message) }
}

@Scoped()
class PlayerController implements IStartable {
  constructor(
    @Inject(ILogger) private logger: ILogger,
    @Inject(PlayerToken) private player: Player,
  ) {}

  Start() {
    this.logger.Log(`${this.player.Name} joined`)
  }
}

// 3) Module registration
const GameModule = registerModule((m) => {
  m.single(ConsoleLogger).Bind(ILogger)
  m.scoped(PlayerController)
})

// 4) Scope module for player data
const PlayerScope = registerScopeModule((scope, player: Player) => {
  scope.withRoot(PlayerController)
  scope.provideExternal(PlayerToken, player)
})

// 5) Bootstrap once
const container = new Container()
container.Use(GameModule)
container.Launch()

Players.PlayerAdded.Connect((player) => {
  const scope = container.CreateScope(PlayerScope(player))
  player.AncestryChanged.Connect(() => {
    if (!player.IsDescendantOf(game)) scope.Destroy()
  })
})
```

## Public surface (accurate)
- `Container` — `Use`, `Launch`, `CreateScope`, `GetTickManager` (internal `Resolve` exists but is not the recommended entry point).
- `Scope` — `CreateChildScope`, `ProvideExternal`, `Destroy`, `DebugServices`, `GetScopeId`.
- `TickManager` — `Pause`, `Resume`, `IsPaused`, `GetDebugInfo`.
- `registerModule` — builder DSL with `single`, `scoped`, `factory`, `multi`, `keyed`; `BindingBuilder.Bind` ties implementations to tokens.
- `registerScopeModule` — `withRoot` for eager resolution and `provideExternal` for runtime data injection.
- Decorators — `Single`, `Scoped`, `Factory`, `Inject`, `RuntimeParameter`.
- Tokens/types — `createToken`, `Token`, `Constructor`, `Lifetime`, `FactoryFunction`, `KeyedFactory`, `IStartable`, `IDestroyable`, `ITickable`, `IFixedTickable`, `IRenderTickable`, `ServiceDebugInfo`, `IScopeDebugInfo`.

See `docs/api/public-abi.md` for typed signatures and rationale for each piece. If any doc drifts from the code, update that file first.
