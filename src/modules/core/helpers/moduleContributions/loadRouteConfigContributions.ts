import type {ReactNode} from "react";
import type {RouteConfigArgs, RouteConfigContribution} from "@coreModule/helpers/types/routeConfigContribution.types.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";
import {
    type ContributionGlob,
    contributionModuleName,
    createContributionList,
    isOptionalFunction,
    isPlatformEntry,
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
            && (entry.platformUrls === undefined || (Array.isArray(entry.platformUrls) && entry.platformUrls.every(isString))),
        platformPages: true,
    });

    /** Whether a module kept only for its platform pages (D195, D197) owns the page at `path`. */
    const ownsPlatformListPage = (contribution: RouteConfigContribution, path: string): boolean =>
        (contribution.platformUrls ?? []).some((url) => isUnderUrl(path, url));

    /** The platform pages of a module (D195, D197), for its menu entries. */
    const platformUrlsOf = (moduleName: string): readonly string[] =>
        list().flatMap((contribution) => (contributionModuleName(contribution) === moduleName ? contribution.platformUrls ?? [] : []));

    /**
     * First contribution that returns non-`undefined` wins; `null` (or `false`) is a handled empty view.
     * Errors propagate on purpose, so a broken module route reaches the error boundary instead of
     * silently falling through to another module or core.
     */
    const run = (args: RouteConfigArgs): ReactNode | undefined => {
        const path = `/${args.segments.join("/")}`;
        for (const contribution of list()) {
            if (isPlatformEntry(contribution) && !ownsPlatformListPage(contribution, path)) continue;
            const out = contribution.contributeRoutes?.(args);
            if (out !== undefined) {
                return out;
            }
        }
        return undefined;
    };

    return {list, run, platformUrlsOf};
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

/** The platform pages of a module (D195, D197): `platformUrls` of its route contribution. */
export function platformUrlsOf(moduleName: string): readonly string[] {
    return routeConfigContributions.platformUrlsOf(moduleName);
}
