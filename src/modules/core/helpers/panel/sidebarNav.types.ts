import type { To } from "react-router-dom";
import type { ElementType } from "react";

/** Permission / clearance fields used by {@link NavGroup} items (wired through ProtectNavigation). */
export type ProtectedNav = {
    permissions: string[];
    usersPermissions: string[];
    atLeastOnePermission: boolean;
};

export type NavGroup = ProtectedNav & {
    title: string;
    items: NavItem[];
};

export type NavItem = NavCollapsible | NavLink;

export type NavLink = NavLinkItem & {
    items?: never;
};

/** Flat link inside a collapsible menu or nested subgroup. */
export type NavLinkItem = BaseNavItem & {
    url: To;
};

/** Subgroup under a top-level collapsible (e.g. Real Estate under Configurations). */
export type NavSubCollapsible = BaseNavItem & {
    items: NavLinkItem[];
    url?: never;
};

export type NavCollapsible = BaseNavItem & {
    items: (NavLinkItem | NavSubCollapsible)[];
    url?: never;
};

export type BaseNavItem = ProtectedNav & {
    title: string;
    badge?: string | number;
    icon?: ElementType;
};
