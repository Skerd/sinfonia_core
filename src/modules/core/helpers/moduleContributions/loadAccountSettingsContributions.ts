import type {
    AccountSettingsContext,
    AccountSettingsContribution,
    AccountSettingsPage,
    AccountSettingsSection,
} from "@coreModule/helpers/types/accountSettingsContribution.types.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";
import {
    type ContributionGlob,
    createContributionList,
    safeInvoke,
} from "@coreModule/helpers/moduleContributions/contributionRegistry.ts";

const KIND = "accountSettingsContribution";

export function createAccountSettingsContributions(glob: ContributionGlob) {
    const list = createContributionList<AccountSettingsContribution>({
        kind: KIND,
        glob,
        isValid: (entry) =>
            typeof entry.getNotificationSections === "function" || typeof entry.getPages === "function",
    });

    /** Sections from every module, in contribution order; throwing modules are skipped. */
    const getNotificationSections = (context: AccountSettingsContext): AccountSettingsSection[] =>
        list().flatMap((contribution) => {
            const readSections = contribution.getNotificationSections;
            if (typeof readSections !== "function") return [];
            const sections = safeInvoke(KIND, contribution, () => readSections(context));
            return Array.isArray(sections) ? sections.filter(Boolean) : [];
        });

    /** Tabs from every module, in contribution order; throwing modules are skipped. */
    const getPages = (context: AccountSettingsContext): AccountSettingsPage[] =>
        list().flatMap((contribution) => {
            const readPages = contribution.getPages;
            if (typeof readPages !== "function") return [];
            const pages = safeInvoke(KIND, contribution, () => readPages(context));
            return Array.isArray(pages) ? pages.filter(Boolean) : [];
        });

    return {list, getNotificationSections, getPages};
}

const accountSettingsContributions = createAccountSettingsContributions(
    filterGlobByEnabledModules(
        import.meta.glob<Record<string, unknown>>(
            "@/modules/*/clients/panel/accountSettingsContribution.{tsx,ts}",
            {eager: true},
        ),
    ),
);

export function getAccountSettingsNotificationSections(
    context: AccountSettingsContext,
): AccountSettingsSection[] {
    return accountSettingsContributions.getNotificationSections(context);
}

export function getAccountSettingsPages(
    context: AccountSettingsContext,
): AccountSettingsPage[] {
    return accountSettingsContributions.getPages(context);
}
