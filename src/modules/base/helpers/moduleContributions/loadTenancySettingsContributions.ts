import type {ResolveLanguageKey} from "@baseModule/helpers/hocs/withLanguage.tsx";
import type {NavSubCollapsible} from "@baseModule/helpers/types/sidebarNav.types.ts";
import type {TenancySettingsContribution} from "@baseModule/helpers/types/tenancySettingsContribution.types.ts";
import {filterGlobByEnabledModules} from "@baseModule/helpers/modules/enabledModules.ts";
import {
    type ContributionGlob,
    createContributionList,
    safeInvoke,
} from "@baseModule/helpers/moduleContributions/contributionRegistry.ts";

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
