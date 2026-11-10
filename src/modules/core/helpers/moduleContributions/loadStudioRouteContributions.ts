import type {StudioPage, StudioRouteContribution} from "@coreModule/helpers/types/studioRouteContribution.types.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";
import {
    type ContributionGlob,
    createContributionList,
    describeContribution,
    isComponentLike,
    isPlainObject,
    isString,
    memoizeOnList,
    warnContribution,
} from "@coreModule/helpers/moduleContributions/contributionRegistry.ts";

const KIND = "studioRouteContribution";

/** Paths the Studio itself serves; a module page there would be unreachable. */
export const CORE_STUDIO_PATHS: ReadonlySet<string> = new Set(["gallery", "authenticate"]);

const normalizePath = (path: string) => path.replace(/^\/+/, "").replace(/\/+$/, "");

const isPage = (value: unknown) => isPlainObject(value)
    && isString(value.path) && normalizePath(value.path) !== ""
    && isString(value.title)
    && isComponentLike(value.Page);

/** A Studio page with its path normalized (no leading or trailing `/`). */
export type ResolvedStudioPage = StudioPage & {path: string};

export function createStudioRouteContributions(glob: ContributionGlob) {
    const list = createContributionList<StudioRouteContribution>({
        kind: KIND,
        glob,
        isValid: (entry) => Array.isArray(entry.pages) && entry.pages.every(isPage),
        // The Studio edits every installed module's config (`scope="installed"`), so its pages do too.
        companyScoped: false,
    });

    /**
     * Every contributed page in contribution order. A path core serves, or one an earlier contribution took, is
     * dropped with a dev warning, so routing never depends on which `<Route>` React Router prefers.
     */
    const pages = memoizeOnList(list, (contributions): readonly ResolvedStudioPage[] => {
        const owners = new Map<string, string>();
        const resolved: ResolvedStudioPage[] = [];
        for (const contribution of contributions) {
            const owner = describeContribution(contribution);
            for (const page of contribution.pages) {
                const path = normalizePath(page.path);
                const top = path.split("/")[0]!;
                if (CORE_STUDIO_PATHS.has(top)) {
                    warnContribution(`[${KIND}] "${owner}" cannot serve the core Studio path "${path}"; ignored.`);
                    continue;
                }
                const previous = owners.get(path);
                if (previous !== undefined) {
                    warnContribution(`[${KIND}] "${owner}" repeats the Studio path "${path}" of "${previous}"; ignored.`);
                    continue;
                }
                owners.set(path, owner);
                resolved.push({...page, path});
            }
        }
        return Object.freeze(resolved);
    });

    return {list, pages};
}

const studioRouteContributions = createStudioRouteContributions(
    filterGlobByEnabledModules(
        import.meta.glob<Record<string, unknown>>("@/modules/*/clients/studio/routeConfigContribution.{tsx,ts}", {eager: true}),
    ),
);

/** The modules' Studio pages (D124), mounted by `studioApp.tsx` and listed in the Studio header and command palette. */
export function getStudioPages(): readonly ResolvedStudioPage[] {
    return studioRouteContributions.pages();
}
