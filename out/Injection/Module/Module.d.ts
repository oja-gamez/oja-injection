import type { Token, Constructor, Lifetime } from "../Core/Types";
/**
 * Registration type for service registrations.
 */
export type RegistrationType = "single" | "multi" | "keyed";
/**
 * Internal service registration record.
 * Stores how a service should be registered in the container.
 */
export interface ServiceRegistration {
    /** Token or constructor to register */
    Token: Token | Constructor;
    /** Implementation constructor (if token is interface) */
    Implementation?: Constructor;
    /** Service lifetime */
    Lifetime: Lifetime;
    /** Registration type */
    Type: RegistrationType;
    /** Key for keyed registrations */
    Key?: string;
}
//# sourceMappingURL=Module.d.ts.map