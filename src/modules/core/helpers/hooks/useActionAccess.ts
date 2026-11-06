import {useSelector} from "react-redux";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import type {AccessPerspective} from "@coreModule/helpers/context/accessContext.tsx";

/**
 * Whether the session's roles hold an `@action`'s permission (D14), so a menu shows only the actions
 * the server will run. Same tag as maestro's `actionPermissionTag`: `<collection>[action:<scope>:<method>]`,
 * read from the company-role permissions the session already carries (`validateToken`).
 *
 * @param collection - The model's collection name, e.g. `users`, `channels`.
 * @param action - The action's permission name: its method name, or the shared name it declares.
 * @param scope - `self` (default) for your own records, `others` for someone else's.
 */
export function useActionAccess(collection: string, action: string, scope: AccessPerspective = "self"): boolean {
    const tag = `${collection}[action:${scope}:${action}]`;
    return useSelector((state: RootState) => state.authentication.user.permissions.includes(tag));
}
