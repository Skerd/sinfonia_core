import {parsePath} from "react-router-dom";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {PageCrumb} from "@coreModule/helpers/context/pageHeaderContext.tsx";
import type {FlatPanelNavLink} from "@coreModule/helpers/navigation/flattenPanelNavLinks.ts";

/** Turns `costControl` into `Cost control` when no translation exists. */
function humanize(segment: string) {
    const spaced = segment.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[-_]+/g, " ");
    return spaced.charAt(0).toLocaleUpperCase() + spaced.slice(1);
}

/**
 * The paths a crumb may link to: the sidebar's leaf pages, without their query.
 *
 * Routes are resolved by code (`renderCenterPanelContent` and the module route
 * contributions), so there is no route table to ask whether `/realEstate` or
 * `/tenancy/systemSettings` is a page. The sidebar is the list of pages that
 * exist; a URL prefix that is only a menu group has no entry in it.
 */
export function navPagePaths(links: readonly FlatPanelNavLink[]): ReadonlySet<string> {
    const paths = new Set<string>();
    for (const link of links) {
        const {pathname} = parsePath(link.url);
        if (pathname) paths.add(pathname);
    }
    return paths;
}

/**
 * Builds the breadcrumb trail from the route.
 *
 * Walks every segment rather than stopping at two: the previous version
 * special-cased `tenancy/systemSettings` and truncated everything else, so
 * `/realEstate/projects/create` rendered as "Real Estate › Projects" and the
 * create and edit pages had no trail at all.
 *
 * Labels resolve against the same `menus.*` key path the sidebar uses, falling
 * back to `common.*` for the standard CRUD verbs and finally to a humanized
 * segment, so an untranslated route degrades to readable text rather than a
 * raw key.
 *
 * A crumb carries a `path` only when a page lives there (`pagePaths`). Menu
 * groups such as "Real Estate" or "System settings" are URL prefixes with no
 * page, and linking them rendered the 404 page.
 */
export function buildRouteCrumbs(
    pathname: string,
    resolveLanguageKey: ResolveLanguageKey,
    pagePaths: ReadonlySet<string>,
): PageCrumb[] {
    const translate = (key: string) => {
        const value = resolveLanguageKey(key, true);
        return typeof value === "string" && value ? value : undefined;
    };

    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0 || (segments.length === 1 && segments[0] === "home")) {
        return [{label: translate("home.title") ?? "Home", path: "/"}];
    }

    const crumbs: PageCrumb[] = [];
    let keyPath = "menus";
    let urlPath = "";

    for (const segment of segments) {
        // Object ids are not navigation: they carry no label and the crumb the
        // user wants there is the entity name, which the page publishes.
        if (/^[0-9a-f]{24}$/i.test(segment)) continue;

        keyPath += `.${segment}`;
        urlPath += `/${segment}`;
        crumbs.push({
            label:
                translate(`${keyPath}.title`) ??
                translate(`common.${segment}`) ??
                humanize(segment),
            path: pagePaths.has(urlPath) ? urlPath : undefined,
        });
    }

    return crumbs;
}
