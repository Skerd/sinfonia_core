import {useSelector} from "react-redux";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {useAccessHydrated, useAccessMap, type AccessPerspective} from "@coreModule/helpers/context/accessContext.tsx";

/**
 * Whether the session's roles hold an `@action`'s permission (D14), so a menu shows only the actions
 * the server will run. Same tag as maestro's `actionPermissionTag`, read from the company-role permissions
 * the session already carries (`validateToken`):
 * - a scoped model: `<collection>[action:<scope>:<action>]`;
 * - a "loose" model (`accessMode: "loose"`): `<collection>[action:<action>]`, which has no `others` scope (D95).
 *
 * The model counts as loose once the access map from `/access/all` has loaded and lists the collection
 * without an `others` entry (that response omits `others` exactly for loose models). Until then, and
 * outside an `AccessProvider`, the scoped tag is used, so a loose model's action reads `false` until the
 * map arrives.
 *
 * @param collection - The model's collection name, e.g. `users`, `channels`.
 * @param action - The action's permission name: its method name, or the shared name it declares.
 * @param scope - `self` (default) for your own records, `others` for someone else's. Always `false` for
 *   `others` on a loose model, as maestro has no such tag.
 * @example
 * const canApprove = useActionAccess("swissoutreachemails", "approve");
 * const canUnlock = useActionAccess("users", "unlockActivation", "others");
 */
export function useActionAccess(collection: string, action: string, scope: AccessPerspective = "self"): boolean {
    const hydrated = useAccessHydrated();
    const entry = useAccessMap()[collection.toLowerCase()];
    const loose = hydrated === true && entry !== undefined && entry.others === undefined;
    const tag = loose
        ? scope === "self" ? `${collection}[action:${action}]` : undefined
        : `${collection}[action:${scope}:${action}]`;
    return useSelector((state: RootState) => tag !== undefined && state.authentication.user.permissions.includes(tag));
}
