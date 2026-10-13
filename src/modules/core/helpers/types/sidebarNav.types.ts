import type {To} from "react-router-dom";
import type {ElementType} from "react";

/**
 * Access requirements of a nav entry, checked by `navItemAllowed` (`filterNavByAccess.ts`).
 * `permissions` are access-model ids (collection names, case-insensitive); empty means public.
 * `accessPerspective` selects which read grant is required: `self` (default) or `others`.
 * When the schema is loose the server omits `others`, and the check falls back to `self`.
 * `usersPermissions` is currently unused.
 */
export type ProtectedNav = {
    permissions: string[];
    usersPermissions: string[];
    atLeastOnePermission: boolean;
    accessPerspective?: "self" | "others";
};

export type BaseNavItem = ProtectedNav & {
    title: string;
    badge?: string | number;
    icon?: ElementType;
};

/** Leaf link, at any depth. */
export type NavLinkItem = BaseNavItem & {
    url: To;
};

/** Menu without its own URL; its entries may themselves be collapsibles (e.g. eCommerce → POS). */
export type NavCollapsible = BaseNavItem & {
    items: NavSubItem[];
    url?: never;
};

/** A collapsible nested under another one (e.g. Real Estate under Configurations). Same shape as {@link NavCollapsible}. */
export type NavSubCollapsible = NavCollapsible;

/** Entry inside a collapsible: a link or a further collapsible. */
export type NavSubItem = NavLinkItem | NavSubCollapsible;

/** Top-level leaf link; `items?: never` lets `item.items` narrow a {@link NavItem}. */
export type NavLink = NavLinkItem & {
    items?: never;
};

export type NavItem = NavCollapsible | NavLink;

export type NavGroup = ProtectedNav & {
    title: string;
    items: NavItem[];
};
