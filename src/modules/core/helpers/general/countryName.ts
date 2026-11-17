import sqCountryNames from "./countryNames.sq-AL.json";

/**
 * Names for a language browsers may ship without (Chrome has no Albanian region names), generated once from Node's
 * full ICU data for the seeded countries, as dates take dayjs's names for it (GLB-09).
 */
const NAMES_WITHOUT_BROWSER_DATA: Record<string, Record<string, string>> = {"sq-AL": sqCountryNames};

/** One formatter per language: country names render in every card and table cell. */
const regionNames = new Map<string, Intl.DisplayNames | null>();

function namesFor(languageCode: string): Intl.DisplayNames | null {
    if (!regionNames.has(languageCode)) {
        let names: Intl.DisplayNames | null = null;
        try {
            // A browser without data for the language (Chrome without Albanian) would answer in English: keep the stored name.
            names = Intl.DisplayNames.supportedLocalesOf([languageCode]).length > 0
                ? new Intl.DisplayNames([languageCode], {type: "region", fallback: "none"})
                : null;
        } catch {
            names = null;
        }
        regionNames.set(languageCode, names);
    }
    return regionNames.get(languageCode) ?? null;
}

/** The language the user picked in the app (the language provider writes it to `<html lang>`). */
function appLanguage(): string | undefined {
    return (typeof document !== "undefined" && document.documentElement.lang) || undefined;
}

/**
 * A country's name in the app's language, from its ISO code (`Intl.DisplayNames`), else the stored (English) name
 * (TD-F122: in Shqip the lists read "United Kingdom", "Switzerland").
 */
export function countryDisplayName(code: string | undefined | null, storedName: string, languageCode: string | undefined = appLanguage()): string {
    if (!code || !languageCode || !/^[A-Za-z]{2}$/.test(code)) return storedName;
    const iso = code.toUpperCase();
    try {
        const names = namesFor(languageCode);
        if (names) return names.of(iso) ?? storedName;
    } catch {
        return storedName;
    }
    return NAMES_WITHOUT_BROWSER_DATA[languageCode]?.[iso] ?? storedName;
}
