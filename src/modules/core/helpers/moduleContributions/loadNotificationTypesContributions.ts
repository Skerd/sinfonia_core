import type {LanguageDictionary} from "@coreModule/helpers/hooks/useSelectedLanguage.ts";
import {filterGlobByEnabledModules, isModuleActive} from "@coreModule/helpers/modules/enabledModules.ts";
import {createLanguageFragmentMerger, isDictionary} from "@coreModule/helpers/moduleContributions/languageFragments.ts";
import {fillTemplate} from "@coreModule/helpers/general/template.ts";

/**
 * Module-owned notification types (D117): `src/modules/<pkg>/assets/languages/<locale>/notificationTypes.json`.
 *
 * Shape: `{ "<module>": { "title": "…", "codes": { "<CODE>": { "title": "…", "message": "… {param} …",
 * "variants": { "<variant>": "…" } } } } }`, keyed by the module's folder name. The server stores a notification's
 * `code` and `params`; the panel shows the code's `message` (or `variants[params.variant]`) filled with the params,
 * and lists every type under its module's title so a user can turn it off. A code without a `title` (a security notice,
 * which cannot be turned off) is translated but not listed. Core's own codes are in core's file; core never names a
 * module's codes.
 */

/** One notification a user can turn off. */
export type NotificationTypeEntry = {code: string; title: string};

/** A module's notification types, under the module's title. */
export type NotificationTypeGroup = {id: string; title: string; types: NotificationTypeEntry[]};

/** What a stored notification needs to be shown in the reader's language. */
export type TranslatableNotification = {code: string; params?: Record<string, string | number>};

type CodeEntry = {title?: unknown; message?: unknown; variants?: unknown};

const PLACEHOLDER = /\{\w+\}/;

function codesOf(group: unknown): Record<string, CodeEntry> {
    if (!isDictionary(group) || !isDictionary(group.codes)) return {};
    return group.codes as Record<string, CodeEntry>;
}

function findCode(fragment: LanguageDictionary, code: string): CodeEntry | undefined {
    for (const group of Object.values(fragment)) {
        const entry = codesOf(group)[code];
        if (isDictionary(entry)) return entry;
    }
    return undefined;
}

export function createNotificationTypesContributions(
    glob: Record<string, unknown>,
    fallbackLocales?: readonly string[],
    isGroupActive: (moduleName: string) => boolean = () => true,
) {
    // Core's own notices (sign-ins, mentions, invitations) have no shell dictionary, so core's file is merged too.
    const merged = createLanguageFragmentMerger({fileName: "notificationTypes.json", glob, fallbackLocales, includeCore: true});

    /** Every active module's notification types, modules in name order, codes as the module lists them. */
    const getNotificationTypeGroups = (locale: string): NotificationTypeGroup[] =>
        Object.entries(merged(locale))
            .filter(([id, group]) => isGroupActive(id) && isDictionary(group))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([id, group]) => ({
                id,
                title: typeof (group as LanguageDictionary).title === "string" ? String((group as LanguageDictionary).title) : id,
                types: Object.entries(codesOf(group))
                    .filter(([, entry]) => isDictionary(entry) && typeof entry.title === "string")
                    .map(([code, entry]) => ({code, title: String(entry.title)})),
            }))
            .filter((group) => group.types.length > 0);

    /** The code's title (what kind of notice it is), or `null` when no module declares it. */
    const notificationTitle = (code: string, locale: string): string | null => {
        const title = findCode(merged(locale), code)?.title;
        return typeof title === "string" ? title : null;
    };

    /**
     * The notification's text in `locale`: the variant `params.variant` names, else the code's message, filled with the
     * params. `null` when no module declares the code, or when the message needs values a notice stored before it
     * carried params does not have; the caller then shows the stored English `description`.
     */
    const notificationMessage = (notification: TranslatableNotification, locale: string): string | null => {
        const entry = findCode(merged(locale), notification.code);
        if (!entry) return null;
        if (!notification.params && typeof entry.message === "string" && PLACEHOLDER.test(entry.message)) return null;
        const params = notification.params ?? {};
        const variant = params.variant == null ? undefined : String(params.variant);
        const variants = isDictionary(entry.variants) ? entry.variants : {};
        const template = variant !== undefined && typeof variants[variant] === "string" ? variants[variant] : entry.message;
        return typeof template === "string" ? fillTemplate(template, params) : null;
    };

    return {getNotificationTypeGroups, notificationTitle, notificationMessage};
}

const notificationTypes = createNotificationTypesContributions(
    filterGlobByEnabledModules(
        import.meta.glob("@/modules/*/assets/languages/*/notificationTypes.json", {eager: true, import: "default"}),
    ),
    undefined,
    isModuleActive,
);

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
    return notificationTypes.notificationMessage(notification, locale);
}
