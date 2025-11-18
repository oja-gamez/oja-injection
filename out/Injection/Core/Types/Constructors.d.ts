/**
 * Constructor type definitions for dependency injection.
 */
/**
 * Represents a class constructor that can be instantiated with new.
 * Used for registering and resolving services in the DI container.
 *
 * @template T - The type of instance the constructor creates
 */
export type Constructor<T = any> = new (...args: any[]) => T;
/**
 * Abstract constructor type for class references that may not be directly instantiable.
 * Used for inheritance and interface implementation checks.
 *
 * @template T - The type of instance the constructor represents
 */
export type AbstractConstructor<T = any> = abstract new (...args: any[]) => T;
//# sourceMappingURL=Constructors.d.ts.map