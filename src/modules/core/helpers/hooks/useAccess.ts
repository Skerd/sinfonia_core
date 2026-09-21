import {useContext, useMemo} from "react";
import {
    AccessContext,
    AccessDebugOverrideContext,
    emptyAccessObject,
    mergeAccessOverride,
    type AccessObject,
    type AccessPerspective,
} from "@coreModule/helpers/context/accessContext.tsx";

/**
 * Reads access for a resource from the nearest `AccessProvider`.
 *
 * @param resourceId - camelCase plural resource id (e.g. `users`, `companyUsers`).
 * @param perspective - `self` (default) or `others`; when the schema is `loose`, `others` is omitted and `self` is used.
 */
export function useAccess(resourceId: string, perspective: AccessPerspective = "self"): AccessObject {
    const accessMap = useContext(AccessContext);
    const debugOverrides = useContext(AccessDebugOverrideContext)?.overrides;
    const key = resourceId ? resourceId.toLowerCase() : "";
    const entry = key ? accessMap[key] : undefined;
    // `others` falls back to `self` when the schema is loose and the server sent no `others`.
    const effective: AccessPerspective = perspective === "others" && entry?.others ? "others" : "self";
    const override = debugOverrides?.[key]?.[effective];

    // Memoized so consumers can put the result in effect/memo deps without re-running every render.
    return useMemo(() => {
        const chosen = entry?.[effective];
        if (!chosen) {
            return emptyAccessObject(key);
        }
        return mergeAccessOverride(chosen.resourceId === key ? chosen : {...chosen, resourceId: key}, override);
    }, [entry, effective, key, override]);
}
