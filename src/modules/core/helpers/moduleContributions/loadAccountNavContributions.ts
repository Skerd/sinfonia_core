import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {NavItem} from "@coreModule/helpers/types/sidebarNav.types.ts";
import type {AccountNavContribution} from "@coreModule/helpers/types/accountNavContribution.types.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";
import {
    type ContributionGlob,
    createContributionList,
    safeInvoke,
} from "@coreModule/helpers/moduleContributions/contributionRegistry.ts";

const KIND = "accountNavContribution";

export function createAccountNavContributions(glob: ContributionGlob) {
    const list = createContributionList<AccountNavContribution>({
        kind: KIND,
        glob,
        isValid: (entry) => typeof entry.getAccountNavItems === "function",
    });

    /** Links from every module, in contribution order; throwing modules are skipped. */
    const getItems = (resolveLanguageKey: ResolveLanguageKey): NavItem[] =>
        list().flatMap((contribution) => {
            const items = safeInvoke(KIND, contribution, () => contribution.getAccountNavItems(resolveLanguageKey));
            return Array.isArray(items) ? items.filter(Boolean) : [];
        });

    return {list, getItems};
}

const accountNavContributions = createAccountNavContributions(
    filterGlobByEnabledModules(
        import.meta.glob<Record<string, unknown>>(
            "@/modules/*/clients/panel/accountNavContribution.{tsx,ts}",
            {eager: true},
        ),
    ),
);

export function getAccountNavItems(resolveLanguageKey: ResolveLanguageKey): NavItem[] {
    return accountNavContributions.getItems(resolveLanguageKey);
}
