import type {
    AccountSettingsContext,
    AccountSettingsContribution,
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
        isValid: (entry) => typeof entry.getNotificationSections === "function",
    });

    /** Sections from every module, in contribution order; throwing modules are skipped. */
    const getNotificationSections = (context: AccountSettingsContext): AccountSettingsSection[] =>
        list().flatMap((contribution) => {
            const sections = safeInvoke(KIND, contribution, () =>
                contribution.getNotificationSections(context),
            );
            return Array.isArray(sections) ? sections.filter(Boolean) : [];
        });

    return {list, getNotificationSections};
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
