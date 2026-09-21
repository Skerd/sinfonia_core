import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import type { NavGroup } from "@coreModule/helpers/types/sidebarNav.types.ts";
import type {
    SidebarContribution,
    SidebarContributionContext,
} from "@coreModule/helpers/types/sidebarContribution.types.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";
import {
    type ContributionGlob,
    createContributionList,
    describeContribution,
    safeInvoke,
} from "@coreModule/helpers/moduleContributions/contributionRegistry.ts";

const KIND = "sidebarContribution";

export function createSidebarContributions(glob: ContributionGlob) {
    const list = createContributionList<SidebarContribution>({
        kind: KIND,
        glob,
        isValid: (entry) => typeof entry.getNavGroups === "function",
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
            return groups;
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
