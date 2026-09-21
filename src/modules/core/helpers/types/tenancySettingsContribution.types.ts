import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {NavSubCollapsible} from "@coreModule/helpers/types/sidebarNav.types.ts";

/**
 * Optional attach file: `src/modules/<pkg>/clients/panel/tenancySettingsContribution.ts(x)`.
 * Items are merged under Tenancy → Configurations in the core sidebar.
 */
export type TenancySettingsContribution = {
    id?: string;
    /** Lower runs earlier; default 100. */
    order?: number;
    /** Return `null`/`undefined` to contribute nothing; a throwing hook is logged and skipped. */
    getTenancySettingsItems: (resolveLanguageKey: ResolveLanguageKey) => NavSubCollapsible | null | undefined;
};
