import type {ElementType} from "react";
import {createPath} from "react-router-dom";
import type {NavGroup, NavItem, NavSubItem} from "@coreModule/helpers/types/sidebarNav.types.ts";

export type FlatPanelNavLink = {
    title: string;
    url: string;
    icon?: ElementType;
    groupTitle: string;
    badge?: string | number;
};

/** Collects the leaf links under one entry, depth-first; collapsibles contribute only their children. */
function collectLinks(item: NavItem | NavSubItem, groupTitle: string): FlatPanelNavLink[] {
    if ("items" in item && item.items) {
        return item.items.flatMap((child) => collectLinks(child, groupTitle));
    }
    if (!item.url) {
        return [];
    }
    return [{
        title: item.title,
        url: typeof item.url === "string" ? item.url : createPath(item.url),
        icon: item.icon,
        groupTitle,
        badge: item.badge,
    }];
}

/** Leaf sidebar links only (skips collapsible parents without a URL). */
export function flattenPanelNavLinks(groups: NavGroup[]): FlatPanelNavLink[] {
    return groups.flatMap((group) => group.items.flatMap((item) => collectLinks(item, group.title)));
}
