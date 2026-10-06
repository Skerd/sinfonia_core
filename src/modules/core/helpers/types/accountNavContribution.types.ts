import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {NavItem} from "@coreModule/helpers/types/sidebarNav.types.ts";

/**
 * Optional attach file: `src/modules/<pkg>/clients/panel/accountNavContribution.ts(x)`.
 * Items are inserted into the core "My account" sidebar group.
 */
export type AccountNavContribution = {
    id?: string;
    /** Lower runs earlier; default 100. */
    order?: number;
    /** Return `null`/`undefined` to contribute nothing; a throwing hook is logged and skipped. */
    getAccountNavItems: (resolveLanguageKey: ResolveLanguageKey) => NavItem[] | null | undefined;
};
