import type {ReactNode} from "react";

/** What the account-settings page can tell a contributor about the current view. */
export type AccountSettingsContext = {
    /**
     * Set when an admin is inspecting *another* user's settings from the Users
     * page, rather than their own.
     *
     * Pass it as the `specificUser` header so the section loads that user.
     */
    specificUserId?: string;
};

export type AccountSettingsSection = {
    /** Stable key for the rendered list. */
    id: string;
    render: () => ReactNode;
};

/**
 * A tab on the account-settings page, next to Account / Security / Activity.
 * `titleKey` is resolved by that page's dictionary.
 */
export type AccountSettingsPage = {
    id: string;
    titleKey: string;
    icon: JSX.Element;
    render: () => ReactNode;
};

/**
 * Optional attach file: `src/modules/<pkg>/clients/panel/accountSettingsContribution.ts(x)`.
 *
 * Sections are merged into the core account-settings "Notifications" tab. This
 * exists so a module can own a preferences surface that lives on a core page
 * without core having to import module code — the same reason the sidebar,
 * route and widget contributions exist.
 */
export type AccountSettingsContribution = {
    id?: string;
    /** Lower runs earlier; default 100. */
    order?: number;
    /** Return `null`/`undefined` to contribute nothing; a throwing hook is logged and skipped. */
    getNotificationSections?: (
        context: AccountSettingsContext,
    ) => AccountSettingsSection[] | null | undefined;
    /**
     * Extra account-settings tabs. Return `null`/`undefined` to contribute nothing.
     * A throwing hook is logged and skipped.
     */
    getPages?: (
        context: AccountSettingsContext,
    ) => AccountSettingsPage[] | null | undefined;
};
