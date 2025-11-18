/**
 * Reflection/metadata API for OjaInjection
 * Ported from Flamework's reflect.ts with adaptations for C# naming conventions
 */
export declare namespace Reflect {
    /**
     * Apply metadata onto this object.
     */
    function DefineMetadata(obj: object, key: string, value: unknown, property?: string): void;
    /**
     * Delete metadata from this object.
     */
    function DeleteMetadata(obj: object, key: string, property?: string): void;
    /**
     * Get metadata from this object.
     * Type parameter is an assertion.
     */
    function GetOwnMetadata<T>(obj: object, key: string, property?: string): T | undefined;
    /**
     * Check if this object has the specified metadata key.
     */
    function HasOwnMetadata(obj: object, key: string, property?: string): boolean;
    /**
     * Retrieve all metadata keys for this object.
     */
    function GetOwnMetadataKeys(obj: object, property?: string): string[];
    /**
     * Retrieves all properties (that contain metadata) on this object.
     */
    function GetOwnProperties(obj: object): string[];
    /**
     * Retrieve all values for the specified key from the object and its parents.
     * Type parameter is an assertion.
     */
    function GetMetadatas<T extends defined>(obj: object, key: string, property?: string): T[];
    /**
     * Get metadata from this object or its parents.
     * Type parameter is an assertion.
     */
    function GetMetadata<T>(obj: object, key: string, property?: string): T | undefined;
    /**
     * Check if this object or any of its parents has the specified metadata key.
     */
    function HasMetadata(obj: object, key: string, property?: string): boolean;
    /**
     * Retrieve all metadata keys for this object and its parents.
     */
    function GetMetadataKeys(obj: object, property?: string): string[];
    /**
     * Retrieves all properties (that contain metadata) on this object and its parents.
     */
    function GetProperties(obj: object): string[];
}
//# sourceMappingURL=Reflect.d.ts.map