import type {AccessContextValue} from "@coreModule/helpers/context/accessContext.tsx";
import type {NavGroup, NavItem, NavSubItem, ProtectedNav} from "@coreModule/helpers/types/sidebarNav.types.ts";

/** `useAccessHydrated()` value: `null` outside `AccessProvider`, `false` while loading, then `true`. */
type AccessHydrated = boolean | null;

function hasRead(read: unknown): boolean {
    return read === true
        || (typeof read === "object" && read !== null && Object.keys(read).length > 0);
}

function hasReadOnMap(map: AccessContextValue, resourceId: string, perspective: "self" | "others"): boolean {
    const entry = map[resourceId.toLowerCase()];
    if (!entry) return false;
    // Loose schemas omit `others`; `useAccess` then serves `self`.
    const chosen = perspective === "others" && entry.others ? entry.others : entry.self;
    return hasRead(chosen?.read);
}

/**
 * Whether the user may see a nav entry. Entries without permissions are public;
 * while the access map is still loading everything is shown, to avoid a flicker of missing items.
 * `accessPerspective: "others"` requires the others-read grant (lists of other people's records).
 */
export function navItemAllowed(item: ProtectedNav, map: AccessContextValue, hydrated: AccessHydrated): boolean {
    if (!item.permissions.length) return true;
    if (hydrated === false) return true;
    const perspective = item.accessPerspective === "others" ? "others" : "self";
    const check = (permission: string) => hasReadOnMap(map, permission, perspective);
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
 * Drops groups the user may not read, filters the rest with {@link filterNavItems},
 * and drops groups left without visible entries.
 */
export function filterNavGroups(groups: NavGroup[], map: AccessContextValue, hydrated: AccessHydrated): NavGroup[] {
    return groups.flatMap((group) => {
        if (!navItemAllowed(group, map, hydrated)) return [];
        const items = filterNavItems(group.items, map, hydrated);
        return items.length ? [{...group, items}] : [];
    });
}
