import {
    accessFieldPathExists,
    type AccessDebugOverrides,
    type AccessPermissionOverride,
} from "@coreModule/helpers/context/accessContext.tsx";

/**
 * Pure state math behind the `withDebug` panel, kept out of the component so it can be tested
 * without mounting popovers. Nothing here touches React or the DOM.
 */

export type AccessMapKind = "read" | "write";
export type AccessPerspective = "self" | "others";

export const ACCESS_BOOL_KEYS = ["create", "delete", "restore"] as const;
export type AccessBoolKey = typeof ACCESS_BOOL_KEYS[number];

/** HOC metadata props the badge counts. Only `withLanguage` and `withAxios` are injected today. */
export const DEBUG_SOURCE_PROPS = ["withLanguage", "withAxios", "withClearance", "withAccess"] as const;

const fieldsKeyFor = (kind: AccessMapKind): "readFields" | "writeFields" =>
    kind === "read" ? "readFields" : "writeFields";

/** Lower-cased, de-duplicated resource ids; blank entries are dropped. */
export function normalizeDebugResourceIds(resourceIds?: string | string[]): string[] {
    if (!resourceIds) {
        return [];
    }
    const list = Array.isArray(resourceIds) ? resourceIds : [resourceIds];
    return [...new Set(list.map((id) => id.trim().toLowerCase()).filter(Boolean))];
}

/**
 * Which resource(s) the access panel edits. A resolver is called per render, so one shared
 * component — a list, a table, a card shell — can name whichever resource that instance shows.
 */
export type DebugResourceIds =
    | string
    | string[]
    | ((props: Record<string, any>) => string | string[] | undefined);

/** Props that conventionally carry the resource id, tried in order when none was passed. */
export const RESOURCE_ID_PROPS = ["access", "accessModel", "resource", "resourceId"] as const;

/**
 * Ids the panel should offer for this render: an explicit list, whatever the resolver returns, or
 * failing both, the resource this instance was handed through a conventional prop.
 */
export function resolveDebugResourceIds(
    resourceIds: DebugResourceIds | undefined,
    props: Record<string, any>,
): string[] {
    if (typeof resourceIds === "function") {
        return normalizeDebugResourceIds(resourceIds(props));
    }
    if (resourceIds) {
        return normalizeDebugResourceIds(resourceIds);
    }
    for (const key of RESOURCE_ID_PROPS) {
        const value = props[key];
        if (typeof value === "string" && value.trim()) {
            return normalizeDebugResourceIds(value);
        }
    }
    return [];
}

/** A grant is `true`, or a field map with at least one entry. */
export function isAccessGranted(value: unknown): boolean {
    if (value === true) return true;
    if (value === false || value == null) return false;
    if (typeof value === "object") return Object.keys(value as object).length > 0;
    return Boolean(value);
}

export function perspectiveHasOverrides(override?: AccessPermissionOverride): boolean {
    if (!override) return false;
    return (
        override.create !== undefined
        || override.delete !== undefined
        || override.restore !== undefined
        || override.read !== undefined
        || override.write !== undefined
        || Object.keys(override.readFields ?? {}).length > 0
        || Object.keys(override.writeFields ?? {}).length > 0
    );
}

export function countPerspectiveOverrides(override?: AccessPermissionOverride): number {
    if (!override) return 0;
    let n = 0;
    for (const key of ACCESS_BOOL_KEYS) {
        if (override[key] !== undefined) n++;
    }
    if (override.read !== undefined) n++;
    if (override.write !== undefined) n++;
    n += Object.keys(override.readFields ?? {}).length;
    n += Object.keys(override.writeFields ?? {}).length;
    return n;
}

/** Every override in play, across resources and both perspectives. */
export function countResourceOverrides(overrides: AccessDebugOverrides): number {
    return Object.values(overrides).reduce(
        (sum, resource) => sum + countPerspectiveOverrides(resource.self) + countPerspectiveOverrides(resource.others),
        0,
    );
}

/**
 * Applies `mutate` to one resource/perspective and prunes what it empties, so an override map
 * never keeps `{}` entries that would read as "this resource is overridden".
 */
export function updatePerspectiveOverride(
    prev: AccessDebugOverrides,
    resourceId: string,
    perspective: AccessPerspective,
    mutate: (current: AccessPermissionOverride) => AccessPermissionOverride,
): AccessDebugOverrides {
    const resource = prev[resourceId] ?? {};
    const current = resource[perspective] ?? {};
    const cleaned: AccessPermissionOverride = {...mutate({...current})};
    if (cleaned.readFields && Object.keys(cleaned.readFields).length === 0) {
        delete cleaned.readFields;
    }
    if (cleaned.writeFields && Object.keys(cleaned.writeFields).length === 0) {
        delete cleaned.writeFields;
    }
    const nextResource = {...resource};
    if (!perspectiveHasOverrides(cleaned)) {
        delete nextResource[perspective];
    } else {
        nextResource[perspective] = cleaned;
    }
    const next = {...prev};
    if (Object.keys(nextResource).length === 0) {
        delete next[resourceId];
    } else {
        next[resourceId] = nextResource;
    }
    return next;
}

/** Master read/write switch. Matching the server's own value clears the override instead of restating it. */
export function setMasterOverride(
    current: AccessPermissionOverride,
    kind: AccessMapKind,
    enabled: boolean,
    baseMap: unknown,
): AccessPermissionOverride {
    const next = {...current};
    if (enabled === isAccessGranted(baseMap)) {
        delete next[kind];
    } else {
        next[kind] = enabled;
    }
    return next;
}

/**
 * Toggles one field path. Denying a path drops its descendants (they are already denied by it),
 * and granting one clears any ancestor denial that would otherwise hide it. Setting any field
 * clears the master switch, since the two express the same thing at different granularity.
 */
export function setFieldOverride(
    current: AccessPermissionOverride,
    kind: AccessMapKind,
    path: string,
    enabled: boolean,
    baseMap: unknown,
): AccessPermissionOverride {
    const next = {...current};
    delete next[kind];
    const fieldsKey = fieldsKeyFor(kind);
    const fields = {...(next[fieldsKey] ?? {})};

    if (enabled === accessFieldPathExists(baseMap, path)) {
        delete fields[path];
    } else {
        fields[path] = enabled;
    }

    if (!enabled) {
        for (const childPath of Object.keys(fields)) {
            if (childPath !== path && childPath.startsWith(`${path}.`)) {
                delete fields[childPath];
            }
        }
    } else {
        const parts = path.split(".");
        for (let i = 1; i < parts.length; i++) {
            const ancestor = parts.slice(0, i).join(".");
            if (fields[ancestor] === false) {
                delete fields[ancestor];
            }
        }
    }

    if (Object.keys(fields).length === 0) {
        delete next[fieldsKey];
    } else {
        next[fieldsKey] = fields;
    }
    return next;
}

/** "All on" clears the per-field overrides (back to the server map); "all off" denies each known path. */
export function setAllFieldOverrides(
    current: AccessPermissionOverride,
    kind: AccessMapKind,
    fieldPaths: readonly string[],
    enabled: boolean,
): AccessPermissionOverride {
    const next = {...current};
    delete next[kind];
    const fieldsKey = fieldsKeyFor(kind);
    if (enabled) {
        delete next[fieldsKey];
        return next;
    }
    const fields: Record<string, boolean> = {};
    for (const path of fieldPaths) {
        fields[path] = false;
    }
    next[fieldsKey] = fields;
    return next;
}

/** Drops both the master switch and the per-field overrides for one map. */
export function clearKindOverrides(
    current: AccessPermissionOverride,
    kind: AccessMapKind,
): AccessPermissionOverride {
    const next = {...current};
    delete next[kind];
    delete next[fieldsKeyFor(kind)];
    return next;
}

/** How many of the known HOC metadata props were injected, for the `n/4` badge. */
export function countDebugSources(props: Record<string, unknown>): number {
    return DEBUG_SOURCE_PROPS.filter((key) => !!props[key]).length;
}

export type DebugStateToggles = {
    testLoading: boolean;
    testError: boolean;
    testEmptyData: boolean;
};

/**
 * The loading/error/data props handed to the wrapped component, so its failure and empty states
 * can be exercised without touching the backend. Toggles only ever force a state on, never off.
 */
export function applyDebugStateOverrides(
    props: Record<string, any>,
    toggles: DebugStateToggles,
): {loading: unknown; error: unknown; data: unknown} {
    return {
        loading: props.loading || toggles.testLoading,
        error: props.error || toggles.testError,
        data: toggles.testEmptyData ? null : props.data,
    };
}
