import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {NavSubCollapsible} from "@coreModule/helpers/types/sidebarNav.types.ts";
import type {TenancySettingsContribution} from "@coreModule/helpers/types/tenancySettingsContribution.types.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";
import {
    type ContributionGlob,
    createContributionList,
    safeInvoke,
} from "@coreModule/helpers/moduleContributions/contributionRegistry.ts";

const KIND = "tenancySettingsContribution";

export function createTenancySettingsContributions(glob: ContributionGlob) {
    const list = createContributionList<TenancySettingsContribution>({
        kind: KIND,
        glob,
        isValid: (entry) => typeof entry.getTenancySettingsItems === "function",
    });

    /** One collapsible per contribution, in order; `null`/`undefined` results and throwing modules are skipped. */
    const getSubCollapsibles = (resolveLanguageKey: ResolveLanguageKey): NavSubCollapsible[] =>
        list().flatMap((contribution) => {
            const item = safeInvoke(KIND, contribution, () => contribution.getTenancySettingsItems(resolveLanguageKey));
            return item && typeof item === "object" ? [item] : [];
        });

    return {list, getSubCollapsibles};
}

const tenancySettingsContributions = createTenancySettingsContributions(
    filterGlobByEnabledModules(
        import.meta.glob<Record<string, unknown>>(
            "@/modules/*/clients/panel/tenancySettingsContribution.{tsx,ts}",
            {eager: true},
        ),
    ),
);

export function getTenancySettingsSubCollapsibles(resolveLanguageKey: ResolveLanguageKey): NavSubCollapsible[] {
    return tenancySettingsContributions.getSubCollapsibles(resolveLanguageKey);
}
