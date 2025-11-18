/**
 * Reflection/metadata API for OjaInjection
 * Ported from Flamework's reflect.ts with adaptations for C# naming conventions
 */
export namespace Reflect {
	/** object -> property -> key -> value */
	const metadata = new WeakMap<object, Map<string | typeof NO_PROP_MARKER, Map<string, unknown>>>();

	const NO_PROP_MARKER = {} as { _nominal_Marker: never };

	function getObjMetadata(obj: object, prop: string | undefined, create: true): Map<string, unknown>;
	function getObjMetadata(obj: object, prop?: string): Map<string, unknown> | undefined;
	function getObjMetadata(obj: object, prop?: string, create?: boolean) {
		const realProp = prop ?? NO_PROP_MARKER;
		if (create) {
			let objMetadata = metadata.get(obj);
			if (!objMetadata) metadata.set(obj, (objMetadata = new Map()));

			let propMetadata = objMetadata.get(realProp);
			if (!propMetadata) objMetadata.set(realProp, (propMetadata = new Map()));

			return propMetadata;
		} else {
			return metadata.get(obj)?.get(realProp);
		}
	}

	function getParentConstructor(obj: object) {
		const metatable = getmetatable(obj) as { __index?: object };
		if (metatable && typeIs(metatable, "table")) {
			return rawget(metatable, "__index") as object;
		}
	}

	/**
	 * Apply metadata onto this object.
	 */
	export function DefineMetadata(obj: object, key: string, value: unknown, property?: string) {
		const objMetadata = getObjMetadata(obj, property, true);
		objMetadata.set(key, value);
	}

	/**
	 * Delete metadata from this object.
	 */
	export function DeleteMetadata(obj: object, key: string, property?: string) {
		const objMetadata = getObjMetadata(obj, property);
		objMetadata?.delete(key);
	}

	/**
	 * Get metadata from this object.
	 * Type parameter is an assertion.
	 */
	export function GetOwnMetadata<T>(obj: object, key: string, property?: string): T | undefined {
		const objMetadata = getObjMetadata(obj, property);
		return objMetadata?.get(key) as T;
	}

	/**
	 * Check if this object has the specified metadata key.
	 */
	export function HasOwnMetadata(obj: object, key: string, property?: string) {
		const objMetadata = getObjMetadata(obj, property);
		return objMetadata?.has(key) ?? false;
	}

	/**
	 * Retrieve all metadata keys for this object.
	 */
	export function GetOwnMetadataKeys(obj: object, property?: string) {
		const objMetadata = getObjMetadata(obj, property);
		const keys = new Array<string>();

		objMetadata?.forEach((_, key) => keys.push(key));
		return keys;
	}

	/**
	 * Retrieves all properties (that contain metadata) on this object.
	 */
	export function GetOwnProperties(obj: object) {
		const properties = metadata.get(obj);
		if (!properties) return [];

		const keys = new Array<string>();
		for (const [key] of properties) {
			if (key !== NO_PROP_MARKER) {
				keys.push(key as string);
			}
		}
		return keys;
	}

	/**
	 * Retrieve all values for the specified key from the object and its parents.
	 * Type parameter is an assertion.
	 */
	export function GetMetadatas<T extends defined>(obj: object, key: string, property?: string): T[] {
		const values = new Array<T>();

		const value = GetOwnMetadata(obj, key, property);
		if (value !== undefined) {
			values.push(value as T);
		}

		const parent = getParentConstructor(obj);
		if (parent) {
			GetMetadatas<T>(parent, key, property).forEach((value) => values.push(value));
		}

		return values;
	}

	/**
	 * Get metadata from this object or its parents.
	 * Type parameter is an assertion.
	 */
	export function GetMetadata<T>(obj: object, key: string, property?: string): T | undefined {
		const value = GetOwnMetadata(obj, key, property);
		if (value !== undefined) {
			return value as T;
		}

		const parent = getParentConstructor(obj);
		if (parent) {
			return GetMetadata(parent, key, property);
		}
	}

	/**
	 * Check if this object or any of its parents has the specified metadata key.
	 */
	export function HasMetadata(obj: object, key: string, property?: string): boolean {
		const value = HasOwnMetadata(obj, key, property);
		if (value) {
			return value;
		}

		const parent = getParentConstructor(obj);
		if (parent) {
			return HasMetadata(parent, key, property);
		}

		return false;
	}

	/**
	 * Retrieve all metadata keys for this object and its parents.
	 */
	export function GetMetadataKeys(obj: object, property?: string): string[] {
		const keys = new Set<string>(GetOwnMetadataKeys(obj, property));

		const parent = getParentConstructor(obj);
		if (parent) {
			GetMetadataKeys(parent, property).forEach((key) => keys.add(key));
		}

		return [...keys];
	}

	/**
	 * Retrieves all properties (that contain metadata) on this object and its parents.
	 */
	export function GetProperties(obj: object) {
		const keys = new Set<string>(GetOwnProperties(obj));

		const parent = getParentConstructor(obj);
		if (parent) {
			GetProperties(parent).forEach((key) => keys.add(key));
		}

		return [...keys];
	}
}
