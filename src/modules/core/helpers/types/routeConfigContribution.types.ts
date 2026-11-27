import type { ReactNode } from "react";
import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";

/** Same inputs as {@link renderCenterPanelContent}; shared with per-module route contributions. */
export type RouteConfigArgs = {
    menu?: string;
    subview?: string;
    segments: string[];
    searchParams: URLSearchParams;
    resolveLanguageKey: ResolveLanguageKey;
};

/**
 * Optional `clients/panel/routeConfigContribution.ts(x)` per package.
 * `contributeRoutes` returns a view when it owns the route, or `undefined` to defer.
 * `null` / `false` mean "handled, render nothing". Contributions run in `order` before core routes,
 * so a module can take over a core path; errors are not caught here.
 */
export type RouteConfigContribution = {
    id?: string;
    order?: number;
    contributeRoutes?: (args: RouteConfigArgs) => ReactNode | undefined;
    /**
     * The module's platform pages (D195, D197): its platform lists (e.g. `/tenancy/systemSettings/categories`) and any other
     * page the platform company works on for every company. A company that keeps the module's platform pages without
     * running the module (the platform company) gets only these pages, with what is under them, and only their menu entries.
     */
    platformUrls?: readonly string[];
};
