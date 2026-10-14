import type {FieldBinding} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {AccessMap} from "./types.ts";

/**
 * Whether `path` is granted in a server access map. Used for read *and* write maps: both
 * nest sub-documents under `keys` (`{address: {keys: {city: true}}}`).
 *
 * A flat dotted key (`"address.city"`) is honoured first when present. A missing map or
 * path means "not gated".
 */
export function hasAccessPath(access: AccessMap | undefined, path: string | undefined): boolean {
    if (!access || !path) return true;
    if (access[path] !== undefined) return !!access[path];

    const parts = path.split(".");
    let cursor: any = access;

    for (let i = 0; i < parts.length; i++) {
        if (!cursor || typeof cursor !== "object") return false;
        const next = cursor[parts[i]];
        if (i === parts.length - 1) return !!next;
        cursor = next?.keys ?? next;
    }
    return false;
}

/** At least one key granted. An empty list grants nothing. */
export function hasAnyAccessPath(access: AccessMap | undefined, paths: readonly string[]): boolean {
    return paths.some((p) => hasAccessPath(access, p));
}

function accessNode(access: AccessMap, path: string): unknown {
    if (access[path] !== undefined) return access[path];
    const parts = path.split(".");
    let cursor: unknown = access;
    for (let i = 0; i < parts.length; i++) {
        if (!cursor || typeof cursor !== "object") return undefined;
        const next = (cursor as Record<string, unknown>)[parts[i]];
        if (i === parts.length - 1) return next;
        const nested = next as {keys?: unknown} | undefined;
        cursor = nested && typeof nested === "object" && "keys" in nested ? nested.keys : next;
    }
    return undefined;
}

/**
 * A parent granted as a whole (`true` or `{}` with no `keys`) covers its children.
 * `{keys: {...}}` does not: each child is its own grant.
 */
function parentCoversChildren(node: unknown): boolean {
    if (node === true) return true;
    if (!node || typeof node !== "object") return false;
    return !("keys" in node);
}

/**
 * Whether one field of an embedded array item is readable.
 * `listPath` is the array (`geolocation`); `fieldName` is the item key (`city`).
 *
 * No map, or an empty map, means the sheet is not gating these values. `SheetViewRenderer`
 * turns both `read: true` and `read: false` into `{}`; a real field denial is a map that
 * names other keys and omits this one. A parent granted as a whole (`true` or `{}` with
 * no `keys`) covers its children. `{keys: {...}}` grants only the keys it lists.
 */
export function embeddedFieldReadable(
    access: AccessMap | undefined,
    listPath: string | undefined,
    fieldName: string,
): boolean {
    if (!access || Object.keys(access).length === 0) return true;
    const path = listPath ? `${listPath}.${fieldName}` : fieldName;
    if (hasAccessPath(access, path)) return true;
    if (!listPath || !hasAccessPath(access, listPath)) return false;
    return parentCoversChildren(accessNode(access, listPath));
}

export type DisplayCardAccessSpec = {
    /** Access paths for the *value* being rendered (not card chrome). */
    paths: string[];
    /** `any` = at least one path; `all` = every path. */
    mode: "any" | "all";
};

/**
 * Paths that gate the DisplayCard *value* (HiddenElement `show`), derived from what
 * is rendered — not from `permissions.read` (that only hides/shows the whole card):
 * - `field.name` like `country.name`
 * - `parent` + `valuePath` joins (e.g. createdBy name+surname)
 *
 * Card visibility stays on explicit `node.permissions` in the sheet renderer.
 * Set `field.skipReadAccessGate` (or use a `statistics.*` path) to skip value gating
 * for computed aggregates that are not real ACL keys.
 */
export function resolveDisplayCardValueAccessSpec(
    binding: FieldBinding | undefined,
): DisplayCardAccessSpec | null {
    if (binding?.skipReadAccessGate) {
        return null;
    }

    const wp = binding?.widgetProps ?? {};
    const parent = typeof wp.parent === "string" && wp.parent.length > 0 ? wp.parent : undefined;
    const valuePath = Array.isArray(wp.valuePath)
        ? (wp.valuePath as unknown[]).filter((p): p is string => typeof p === "string" && p.length > 0)
        : [];

    if (parent && valuePath.length > 0) {
        return {
            paths: valuePath.map((p) => `${parent}.${p}`),
            mode: "any",
        };
    }

    const fieldName = typeof binding?.name === "string" ? binding.name : undefined;
    if (fieldName) {
        // Computed listing aggregates — not model ACL keys. Backend sanitizeStatistics
        // already strips values the caller cannot see.
        if (fieldName === "statistics" || fieldName.startsWith("statistics.")) {
            return null;
        }
        return {paths: [fieldName], mode: "all"};
    }

    return null;
}

/** True when the user may see the rendered value (vs locked HiddenElement). */
export function hasDisplayCardValueAccess(
    access: AccessMap | undefined,
    binding: FieldBinding | undefined,
): boolean {
    const spec = resolveDisplayCardValueAccessSpec(binding);
    if (!spec || spec.paths.length === 0) return true;
    if (!access) return true;
    if (spec.mode === "any") {
        return hasAnyAccessPath(access, spec.paths);
    }
    return spec.paths.every((p) => hasAccessPath(access, p));
}

/** Keep only `valuePath` segments the user can read under `parent`. */
export function filterAccessibleValuePath(
    access: AccessMap | undefined,
    parent: string,
    valuePath: string[],
): string[] {
    if (!access) return valuePath;
    return valuePath.filter((p) => hasAccessPath(access, `${parent}.${p}`));
}
