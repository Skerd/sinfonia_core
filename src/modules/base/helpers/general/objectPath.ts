import type {TranslationValue} from "@baseModule/helpers/hocs/withLanguage.tsx";

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Reads a dotted path (`"a.b.c"`) from nested objects.
 * Returns `undefined` as soon as a segment is missing or a non-object is in the way.
 */
export function findFromObject(values: unknown, path: string): unknown {
    let current: unknown = values;
    for (const part of path.split(".")) {
        if (current == null || typeof current !== "object") return undefined;
        current = (current as Record<string, unknown>)[part];
    }
    return current;
}

/**
 * Looks up a translation. A key containing dots is tried as-is first (dictionaries keyed by
 * field path, e.g. `"address.city"`), then as a nested path.
 *
 * @returns The translation, or `path` itself when it is missing or empty, so the UI shows the key.
 */
export function findFromLanguage(values: TranslationValue, path: string): TranslationValue {
    if (isRecord(values) && Object.prototype.hasOwnProperty.call(values, path)) {
        return values[path];
    }
    return findFromObject(values, path) || path;
}
