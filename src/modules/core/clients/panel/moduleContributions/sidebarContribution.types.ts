import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import type { NavGroup } from "@coreModule/helpers/panel/sidebarNav.types.ts";

/** Optional context passed when building sidebar / apps launcher nav. */
export type SidebarContributionContext = {
    chatUnreadTotal?: number;
};

/**
 * Optional attach file: `src/modules/<pkg>/clients/panel/sidebarContribution.ts(x)`.
 * Discovered via {@link getSortedSidebarContributions} (import.meta.glob).
 */
export type SidebarContribution = {
    /** Stable id for debugging / ordering tie-breaks. */
    id?: string;
    /** Lower runs earlier; default module block uses 100. */
    order?: number;
    /** Build nav groups for the module (same shape as inline *NavGroup helpers in the main sidebar). */
    getNavGroups: (
        resolveLanguageKey: ResolveLanguageKey,
        context?: SidebarContributionContext,
    ) => NavGroup[];
};
