import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {NavGroup} from "@coreModule/helpers/panel/sidebarNav.types.ts";
import type {SidebarContributionContext} from "@coreModule/clients/panel/moduleContributions/sidebarContribution.types.ts";
import {getModuleSidebarNavGroups} from "@coreModule/clients/panel/moduleContributions/loadSidebarContributions.ts";

export type PanelNavGroupsOptions = SidebarContributionContext;

/** All panel nav groups from every package `clients/panel/sidebarContribution`, sorted by `order`. */
export function getPanelNavGroups(
    resolveLanguageKey: ResolveLanguageKey,
    options?: PanelNavGroupsOptions,
): NavGroup[] {
    return getModuleSidebarNavGroups(resolveLanguageKey, options);
}
