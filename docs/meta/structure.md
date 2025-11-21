# Documentation Structure Plan (Docusaurus-ready)

This is the folder layout to target when we stand up Docusaurus. It keeps “why” material separate from the typed public API and leaves room for guides and recipes.

```
docs/
  intro.md                     // Quick pitch + links
  guides/
    getting-started.md         // Install + first container + first scope
    scopes-and-lifetimes.md    // Single vs scoped vs factory, lifecycle hooks
    runtime-parameters.md      // Using @RuntimeParameter factories
    tick-manager.md            // Heartbeat/render ticking and pausing
  recipes/
    player-scopes.md           // Player join/leave flow with scopes
    keyed-factories.md         // Key-based resolution pattern
    modules-and-composition.md // Splitting features into modules
  api/
    public-api.md              // Canonical typed API surface (this PR adds it)
    container.md               // Deep dive on Container/Scope/TickManager
    decorators.md              // Lifetime + injection decorators
    tokens-and-types.md        // Token helpers, lifetimes, FactoryFunction, KeyedFactory
  meta/
    structure.md               // You are here; docs conventions
```

Root-level Docusaurus files to add later:
- `docusaurus.config.ts` with site metadata and navbar
- `sidebars.ts` that mirrors the layout above
- Optional: `typedoc.json` + a generated `docs/api/typedoc` if we want API pages generated straight from TypeScript comments
