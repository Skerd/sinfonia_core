import type { ResolveLanguageKey } from "@baseModule/helpers/hocs/withLanguage.tsx";
import type { NavGroup } from "@baseModule/helpers/types/sidebarNav.types.ts";

/** Optional context passed when building sidebar / apps launcher nav. */
export type SidebarContributionContext = {
    chatUnreadTotal?: number;
    publicChatWaitingCount?: number;
    publicChatMineUnread?: number;
};

/**
 * Optional attach file: `src/modules/<pkg>/clients/panel/sidebarContribution.ts(x)`.
 * Discovered via `getSortedSidebarContributions` in `loadSidebarContributions.ts` (import.meta.glob),
 * ordered by `order`, then `id`, then file path. A throwing `getNavGroups` is logged and skipped.
 */
export type SidebarContribution = {
    /** Stable id for debugging / ordering tie-breaks; should be unique (duplicates warn in dev). */
    id?: string;
    /** Lower runs earlier; default module block uses 100. */
    order?: number;
    /** Build nav groups for the module (same shape as inline *NavGroup helpers in the main sidebar). */
    getNavGroups: (
        resolveLanguageKey: ResolveLanguageKey,
        context?: SidebarContributionContext,
    ) => NavGroup[];
};
