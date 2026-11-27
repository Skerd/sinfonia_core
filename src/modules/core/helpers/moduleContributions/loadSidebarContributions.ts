import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import type { NavGroup } from "@coreModule/helpers/types/sidebarNav.types.ts";
import type {
    SidebarContribution,
    SidebarContributionContext,
} from "@coreModule/helpers/types/sidebarContribution.types.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";
import {
    type ContributionGlob,
    contributionModuleName,
    createContributionList,
    describeContribution,
    isPlatformEntry,
    safeInvoke,
} from "@coreModule/helpers/moduleContributions/contributionRegistry.ts";
import {platformUrlsOf} from "@coreModule/helpers/moduleContributions/loadRouteConfigContributions.ts";
import {keepPlatformItems} from "@coreModule/helpers/moduleContributions/loadTenancySettingsContributions.ts";

const KIND = "sidebarContribution";

/**
 * A module kept only for its platform pages (D195, D197) shows only the links to those pages (its route contribution's
 * `platformUrls`), and only the groups still holding one: the platform company's daily work of a module it does not run.
 */
function narrowToPlatformPages(groups: NavGroup[], urls: readonly string[]): NavGroup[] {
    return groups.flatMap((group) => {
        const items = keepPlatformItems(group.items, urls);
        return items.length ? [{...group, items}] : [];
    });
}

export function createSidebarContributions(
    glob: ContributionGlob,
    urlsOf: (moduleName: string) => readonly string[] = platformUrlsOf,
) {
    const list = createContributionList<SidebarContribution>({
        kind: KIND,
        glob,
        isValid: (entry) => typeof entry.getNavGroups === "function",
        platformPages: true,
    });

    /** Every contribution's groups, in contribution order. A throwing module contributes nothing. */
    const getNavGroups = (resolveLanguageKey: ResolveLanguageKey, context?: SidebarContributionContext): NavGroup[] =>
        list().flatMap((contribution) => {
            const groups = safeInvoke(KIND, contribution, () => contribution.getNavGroups(resolveLanguageKey, context));
            if (groups === undefined) {
                return [];
            }
            if (!Array.isArray(groups)) {
                console.error(`[${KIND}] "${describeContribution(contribution)}" returned a non-array; ignored.`);
                return [];
            }
            if (!isPlatformEntry(contribution)) return groups;
            const moduleName = contributionModuleName(contribution);
            return narrowToPlatformPages(groups, moduleName ? urlsOf(moduleName) : []);
        });

    return {list, getNavGroups};
}

const sidebarContributions = createSidebarContributions(
    filterGlobByEnabledModules(
        import.meta.glob<Record<string, unknown>>("@/modules/*/clients/panel/sidebarContribution.{tsx,ts}", {eager: true}),
    ),
);

/** All package sidebar contributions, sorted by `order`, then `id`, then file path. */
export function getSortedSidebarContributions(): readonly SidebarContribution[] {
    return sidebarContributions.list();
}

/** All package nav groups for the current locale, in contribution `order`. */
export function getModuleSidebarNavGroups(
    resolveLanguageKey: ResolveLanguageKey,
    context?: SidebarContributionContext,
): NavGroup[] {
    return sidebarContributions.getNavGroups(resolveLanguageKey, context);
}
