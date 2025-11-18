/**
 * Service lifetime definitions.
 */
/**
 * Service lifetime determines when instances are created and how long they live.
 *
 * - "singleton": One instance for entire application, created on first injection
 * - "scoped": One instance per scope, created when scope is created or on first injection in scope
 * - "factory": New instance every time injected, not cached
 */
export type Lifetime = "singleton" | "scoped" | "factory";
//# sourceMappingURL=Lifetimes.d.ts.map