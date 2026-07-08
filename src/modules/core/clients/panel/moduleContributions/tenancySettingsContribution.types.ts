import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {NavSubCollapsible} from "@coreModule/helpers/panel/sidebarNav.types.ts";

/**
 * Optional attach file: `src/modules/<pkg>/clients/panel/tenancySettingsContribution.ts(x)`.
 * Items are merged under Tenancy → Configurations in the core sidebar.
 */
export type TenancySettingsContribution = {
    id?: string;
    /** Lower runs earlier; default 100. */
    order?: number;
    getTenancySettingsItems: (resolveLanguageKey: ResolveLanguageKey) => NavSubCollapsible;
};
