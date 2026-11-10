import {filterGlobByEnabledModules, isModuleActive} from "@coreModule/helpers/modules/enabledModules.ts";
import {MODULE_LANGUAGE_FALLBACKS} from "@coreModule/helpers/moduleContributions/languageFragments.ts";
import {translateRoleParams} from "@coreModule/helpers/moduleContributions/loadRolesPermissionsContributions.ts";
import {
    createNotificationTypes,
    type NotificationTypeGroup,
    type TranslatableNotification,
} from "armonia/src/modules/core/helpers/notificationTypes.ts";

/**
 * Module-owned notification types (D117), read from armonia so the panel and the server share one source (D128):
 * `armonia/src/modules/<module>/helpers/static/notificationTypes/<xx_YY>.json`. The shape and the lookups are in
 * armonia's `createNotificationTypes`; this file feeds it the bundle's enabled modules and lists only the signed-in
 * company's modules.
 */

export type {NotificationTypeEntry, NotificationTypeGroup, TranslatableNotification} from "armonia/src/modules/core/helpers/notificationTypes.ts";

const notificationTypes = createNotificationTypes({
    files: filterGlobByEnabledModules(
        import.meta.glob("armonia/src/modules/*/helpers/static/notificationTypes/*.json", {eager: true, import: "default"}),
    ),
    fallbackLocales: MODULE_LANGUAGE_FALLBACKS,
    isGroupActive: isModuleActive,
});

/** The notification types of the company's modules, for the per-type preferences (D117). */
export function getNotificationTypeGroups(locale: string): NotificationTypeGroup[] {
    return notificationTypes.getNotificationTypeGroups(locale);
}

/** A notification code's translated title, or `null` when no module declares it (D117). */
export function notificationTitle(code: string, locale: string): string | null {
    return notificationTypes.notificationTitle(code, locale);
}

/** A stored notification's translated text, or `null` when no module declares its code (D117). */
export function notificationMessage(notification: TranslatableNotification, locale: string): string | null {
    // A role notice names its roles by their stored text; a default role's name is shown translated (D118).
    return notificationTypes.notificationMessage({...notification, params: translateRoleParams(notification.params, locale)}, locale);
}
