import {filterGlobByEnabledModules, isModuleActive} from "@coreModule/helpers/modules/enabledModules.ts";
import {MODULE_LANGUAGE_FALLBACKS} from "@coreModule/helpers/moduleContributions/languageFragments.ts";
import {translateDefaultRole} from "@coreModule/helpers/moduleContributions/loadRolesPermissionsContributions.ts";
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

/** Role names joined by {@link ROLE_SEPARATOR} in `params.role`, their slugs in `params.roleSlugs`, in the same order. */
const ROLE_SEPARATOR = ", ";

/**
 * Core's role notices (`ROLE_ASSIGNED`) carry the stored role names in `role` and their slugs in `roleSlugs`; a default
 * role's name is shown translated (D118), a custom or renamed role keeps its stored name. When the two lists do not line
 * up (a name containing the separator), the stored names are kept.
 */
function withTranslatedRoles(notification: TranslatableNotification, locale: string): TranslatableNotification {
    const params = notification.params;
    if (typeof params?.roleSlugs !== "string" || typeof params.role !== "string") return notification;
    const slugs = params.roleSlugs.split(",");
    const names = params.role.split(ROLE_SEPARATOR);
    if (slugs.length !== names.length) return notification;
    const role = names.map((name, index) => translateDefaultRole({slug: slugs[index], name}, locale).name).join(ROLE_SEPARATOR);
    return {...notification, params: {...params, role}};
}

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
    return notificationTypes.notificationMessage(withTranslatedRoles(notification, locale), locale);
}
