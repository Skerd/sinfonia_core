import {SUPPORTED_LOCALES, type SupportedLocale} from "armonia/src/modules/core/constants/index.ts";

/** `value` as one of the platform's locales, or `undefined` when it is not one. */
export function toSupportedLocale(value: unknown): SupportedLocale | undefined {
    return SUPPORTED_LOCALES.find((locale) => locale === value);
}

/** What the panel knows when deciding whether to store its language as the user's preferred language (D128). */
export type PreferredLanguageSyncState = {
    /** The panel language when this user was last seen; `null` right after sign-in. */
    previous: string | null;
    /** The panel language now. */
    current: string;
    /** The user's stored preferred language, if any. */
    stored: string | undefined;
};

/**
 * The language to store for the user, or `undefined` to store nothing: after sign-in only while none is stored (a
 * language chosen on another device is kept), afterwards whenever the user switches the panel to another language.
 */
export function preferredLanguageToStore({previous, current, stored}: PreferredLanguageSyncState): SupportedLocale | undefined {
    const locale = toSupportedLocale(current);
    if (!locale || locale === stored) return undefined;
    const switched = previous !== null && previous !== current;
    return switched || !stored ? locale : undefined;
}
