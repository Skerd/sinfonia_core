import type {ComponentType} from "react";

/**
 * One internal page a module serves in the Studio (architecture maps, process diagrams): a developer view that has no
 * place in the customer panel (D122, D124).
 */
export type StudioPage = {
    /** Path from the Studio root, e.g. `propertyDevelopment/systemMap`; a leading `/` is ignored. Core keeps `gallery` and `authenticate`. */
    path: string;
    /** Menu and header title. The Studio is English only. */
    title: string;
    /** Rendered below the Studio's page header, behind the Studio's sign-in guard. */
    Page: ComponentType;
};

/**
 * Optional `clients/studio/routeConfigContribution.ts(x)` per module, discovered like the panel's
 * `clients/panel/routeConfigContribution.tsx`. The Studio mounts every page at `/<path>` and lists it in its
 * header "Pages" menu and its command palette. Pages follow the modules built into the Studio (`installed`
 * scope), not the signed-in company's modules.
 */
export type StudioRouteContribution = {
    id?: string;
    /** Lower runs earlier; default 100. Also the menu order. */
    order?: number;
    pages: readonly StudioPage[];
};
