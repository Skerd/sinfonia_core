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
 */
export type RouteConfigContribution = {
    id?: string;
    order?: number;
    contributeRoutes?: (args: RouteConfigArgs) => ReactNode | undefined;
};
