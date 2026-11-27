import type {ReactNode} from "react";
import type {RouteConfigArgs, RouteConfigContribution} from "@coreModule/helpers/types/routeConfigContribution.types.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";
import {
    type ContributionGlob,
    contributionModuleName,
    createContributionList,
    isOptionalFunction,
    isPlatformListEntry,
    isString,
} from "@coreModule/helpers/moduleContributions/contributionRegistry.ts";

/** `url` itself or a page under it. */
export function isUnderUrl(path: string, url: string): boolean {
    return path === url || path.startsWith(`${url}/`);
}

export function createRouteConfigContributions(glob: ContributionGlob) {
    const list = createContributionList<RouteConfigContribution>({
        kind: "routeConfigContribution",
        glob,
        isValid: (entry) => isOptionalFunction(entry.contributeRoutes)
            && (entry.platformListUrls === undefined || (Array.isArray(entry.platformListUrls) && entry.platformListUrls.every(isString))),
        platformLists: true,
    });

    /** Whether a module kept only for its platform lists (D195) owns the page at `path`. */
    const ownsPlatformListPage = (contribution: RouteConfigContribution, path: string): boolean =>
        (contribution.platformListUrls ?? []).some((url) => isUnderUrl(path, url));

    /** The platform-list pages of a module (D195), for its menu entries. */
    const platformListUrlsOf = (moduleName: string): readonly string[] =>
        list().flatMap((contribution) => (contributionModuleName(contribution) === moduleName ? contribution.platformListUrls ?? [] : []));

    /**
     * First contribution that returns non-`undefined` wins; `null` (or `false`) is a handled empty view.
     * Errors propagate on purpose, so a broken module route reaches the error boundary instead of
     * silently falling through to another module or core.
     */
    const run = (args: RouteConfigArgs): ReactNode | undefined => {
        const path = `/${args.segments.join("/")}`;
        for (const contribution of list()) {
            if (isPlatformListEntry(contribution) && !ownsPlatformListPage(contribution, path)) continue;
            const out = contribution.contributeRoutes?.(args);
            if (out !== undefined) {
                return out;
            }
        }
        return undefined;
    };

    return {list, run, platformListUrlsOf};
}

const routeConfigContributions = createRouteConfigContributions(
    filterGlobByEnabledModules(
        import.meta.glob<Record<string, unknown>>("@/modules/*/clients/panel/routeConfigContribution.{tsx,ts}", {eager: true}),
    ),
);

/**
 * First contribution that returns non-`undefined` wins. `null` is treated as a handled empty view.
 */
export function runRouteConfigContributions(args: RouteConfigArgs): ReactNode | undefined {
    return routeConfigContributions.run(args);
}

/** The platform-list pages of a module (D195): `platformListUrls` of its route contribution. */
export function platformListUrlsOf(moduleName: string): readonly string[] {
    return routeConfigContributions.platformListUrlsOf(moduleName);
}
