import {useContext, useMemo} from "react";
import {
    AccessContext,
    AccessDebugOverrideContext,
    emptyAccessObject,
    mergeAccessOverride,
    useAccessHydrated,
    type AccessObject,
    type AccessPerspective,
} from "@coreModule/helpers/context/accessContext.tsx";

/** `true` when `read` is unrestricted or names at least one field. An empty map is a denial. */
function hasReadGrant(read: unknown): boolean {
    return read === true || (typeof read === "object" && read !== null && Object.keys(read).length > 0);
}

/**
 * Reads access for a resource from the nearest `AccessProvider`.
 *
 * `read` is `null` while the access map is still loading, `false` when there is no read grant,
 * and otherwise `true` or the readable field map.
 *
 * @param resourceId - camelCase plural resource id (e.g. `users`, `companyUsers`).
 * @param perspective - `self` (default) or `others`; when the schema is `loose`, `others` is omitted and `self` is used.
 */
export function useAccess(resourceId: string, perspective: AccessPerspective = "self"): AccessObject {
    const accessMap = useContext(AccessContext);
    const hydrated = useAccessHydrated();
    const debugOverrides = useContext(AccessDebugOverrideContext)?.overrides;
    const key = resourceId ? resourceId.toLowerCase() : "";
    const entry = key ? accessMap[key] : undefined;
    // `others` falls back to `self` when the schema is loose and the server sent no `others`.
    const effective: AccessPerspective = perspective === "others" && entry?.others ? "others" : "self";
    const override = debugOverrides?.[key]?.[effective];

    // Memoized so consumers can put the result in effect/memo deps without re-running every render.
    return useMemo(() => {
        const chosen = entry?.[effective];
        const resolved = !chosen
            ? emptyAccessObject(key)
            : mergeAccessOverride(chosen.resourceId === key ? chosen : {...chosen, resourceId: key}, override);
        const read = hydrated === false ? null : hasReadGrant(resolved.read) ? resolved.read : false;
        return {...resolved, read};
    }, [entry, effective, key, override, hydrated]);
}
