 import type {ElementType} from "react";
import type {NavGroup, NavItem, NavLinkItem, NavSubCollapsible} from "@coreModule/helpers/panel/sidebarNav.types.ts";

export type FlatPanelNavLink = {
    title: string;
    url: string;
    icon?: ElementType;
    groupTitle: string;
    badge?: string | number;
};

function collectFromItem(item: NavItem, groupTitle: string, out: FlatPanelNavLink[]): void {
    if ("url" in item && item.url) {
        out.push({
            title: item.title,
            url: String(item.url),
            icon: item.icon,
            groupTitle,
            badge: item.badge,
        });
        return;
    }
    if (!("items" in item) || !item.items) {
        return;
    }
    for (const sub of item.items) {
        collectFromSubItem(sub, groupTitle, out);
    }
}

function collectFromSubItem(
    sub: NavLinkItem | NavSubCollapsible,
    groupTitle: string,
    out: FlatPanelNavLink[],
): void {
    if ("url" in sub && sub.url) {
        out.push({
            title: sub.title,
            url: String(sub.url),
            icon: sub.icon,
            groupTitle,
            badge: sub.badge,
        });
        return;
    }
    if ("items" in sub && sub.items) {
        for (const link of sub.items) {
            if ("url" in link && link.url) {
                out.push({
                    title: link.title,
                    url: String(link.url),
                    icon: link.icon,
                    groupTitle,
                    badge: link.badge,
                });
            }
        }
    }
}

/** Leaf sidebar links only (skips collapsible parents without a URL). */
export function flattenPanelNavLinks(groups: NavGroup[]): FlatPanelNavLink[] {
    const out: FlatPanelNavLink[] = [];
    for (const group of groups) {
        for (const item of group.items) {
            collectFromItem(item, group.title, out);
        }
    }
    return out;
}
