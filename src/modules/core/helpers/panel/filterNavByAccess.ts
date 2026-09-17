import type {AccessContextValue} from "@baseModule/helpers/context/accessContext.tsx";
import type {NavGroup, NavItem, NavSubItem, ProtectedNav} from "@coreModule/helpers/panel/sidebarNav.types.ts";

/** `useAccessHydrated()` value: `null` outside `AccessProvider`, `false` while loading, then `true`. */
type AccessHydrated = boolean | null;

function hasReadOnMap(map: AccessContextValue, resourceId: string): boolean {
    const read = map[resourceId.toLowerCase()]?.self?.read;
    return read === true
        || (typeof read === "object" && read !== null && Object.keys(read).length > 0);
}

/**
 * Whether the user may see a nav entry. Entries without permissions are public;
 * while the access map is still loading everything is shown, to avoid a flicker of missing items.
 */
export function navItemAllowed(item: ProtectedNav, map: AccessContextValue, hydrated: AccessHydrated): boolean {
    if (!item.permissions.length) return true;
    if (hydrated === false) return true;
    const check = (permission: string) => hasReadOnMap(map, permission);
    return item.atLeastOnePermission ? item.permissions.some(check) : item.permissions.every(check);
}

/**
 * Drops entries the user may not read. Collapsibles are kept only when they are allowed
 * and still have at least one visible child.
 */
export function filterNavItems<T extends NavItem | NavSubItem>(items: T[], map: AccessContextValue, hydrated: AccessHydrated): T[] {
    return items.flatMap((item): T[] => {
        if (!("items" in item) || !item.items) {
            return navItemAllowed(item, map, hydrated) ? [item] : [];
        }
        const children = filterNavItems(item.items, map, hydrated);
        if (children.length === 0 || !navItemAllowed(item, map, hydrated)) return [];
        return [{...item, items: children}];
    });
}

/**
 * Applies {@link filterNavItems} to every group and drops groups left empty.
 * Group-level permissions are not checked, matching the sidebar (`ProtectNavigation` is currently a no-op).
 */
export function filterNavGroups(groups: NavGroup[], map: AccessContextValue, hydrated: AccessHydrated): NavGroup[] {
    return groups.flatMap((group) => {
        const items = filterNavItems(group.items, map, hydrated);
        return items.length ? [{...group, items}] : [];
    });
}
