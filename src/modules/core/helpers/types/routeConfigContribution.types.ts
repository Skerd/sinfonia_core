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
};
