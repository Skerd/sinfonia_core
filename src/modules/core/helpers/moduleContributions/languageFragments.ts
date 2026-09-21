import type {LanguageDictionary} from "@coreModule/helpers/hooks/useSelectedLanguage.ts";
import mainConfig from "@coreModule/assets/languages/mainConfig.json";

/**
 * Module-owned language fragments: `src/modules/<pkg>/assets/languages/<locale>/<fileName>`,
 * merged across modules and deep-merged into core dictionaries.
 */

/** Locales tried, after the requested one, for keys a module has not translated. */
export const MODULE_LANGUAGE_FALLBACKS: readonly string[] = [mainConfig.defaults.language || "en-US", "en-US"];

export function isDictionary(value: unknown): value is LanguageDictionary {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Only `__proto__` can re-point a plain object's prototype on assignment; JSON may carry it as a key. */
const UNSAFE_KEY = "__proto__";

function cloneValue(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(cloneValue);
    }
    return isDictionary(value) ? deepMergeDictionaries({}, value) : value;
}

/**
 * Returns `target` with `source` deep-merged over it. Nested dictionaries merge; anything else
 * (arrays included) is replaced. Neither input is mutated, and values taken from `source` are
 * copied, so the result never aliases it.
 */
export function deepMergeDictionaries(target: LanguageDictionary, source: LanguageDictionary): LanguageDictionary {
    const out: LanguageDictionary = {...target};
    for (const [key, value] of Object.entries(source)) {
        if (key === UNSAFE_KEY) {
            continue;
        }
        const existing = out[key];
        out[key] = isDictionary(existing) && isDictionary(value)
            ? deepMergeDictionaries(existing, value)
            : cloneValue(value);
    }
    return out;
}

function deepFreeze<T>(value: T): T {
    if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
        Object.freeze(value);
        for (const nested of Object.values(value)) {
            deepFreeze(nested);
        }
    }
    return value;
}

const FRAGMENT_PATH = /(?:^|\/)modules\/([^/]+)\/assets\/languages\/([^/]+)\/(.+)$/;

export type LanguageFragmentMergerOptions = {
    /** File name inside `<locale>/`, e.g. `menus.json`. */
    fileName: string;
    /** `import.meta.glob(…, {eager: true, import: "default"})`: path → parsed JSON. */
    glob: Record<string, unknown>;
    fallbackLocales?: readonly string[];
};

/**
 * Returns `locale → merged fragment` over every non-core module. For each module, keys missing
 * from the requested locale come from the fallback locales, so a partially translated module
 * never shows raw keys. Within a locale, modules merge in name order (later wins); any
 * requested-locale value beats every fallback value. Results are cached and deeply frozen.
 */
export function createLanguageFragmentMerger({
    fileName,
    glob,
    fallbackLocales = MODULE_LANGUAGE_FALLBACKS,
}: LanguageFragmentMergerOptions): (locale: string) => LanguageDictionary {
    const filesByModule = new Map<string, Map<string, LanguageDictionary>>();
    for (const [path, dictionary] of Object.entries(glob)) {
        const match = FRAGMENT_PATH.exec(path.replace(/\\/g, "/"));
        if (!match || match[3] !== fileName || !isDictionary(dictionary)) {
            continue;
        }
        const [, moduleName, locale] = match;
        // Core's own copy lives in its shell dictionaries.
        if (moduleName === "core") {
            continue;
        }
        let files = filesByModule.get(moduleName);
        if (!files) {
            files = new Map();
            filesByModule.set(moduleName, files);
        }
        files.set(locale, dictionary);
    }
    const moduleNames = [...filesByModule.keys()].sort();
    const cache = new Map<string, LanguageDictionary>();

    return (locale) => {
        const cached = cache.get(locale);
        if (cached) {
            return cached;
        }
        // Lowest priority first, so the requested locale is merged last and wins over any fallback.
        const localesByPriority = [...new Set([locale, ...fallbackLocales])].reverse();
        let merged: LanguageDictionary = {};
        for (const code of localesByPriority) {
            for (const moduleName of moduleNames) {
                const dictionary = filesByModule.get(moduleName)!.get(code);
                if (dictionary) {
                    merged = deepMergeDictionaries(merged, dictionary);
                }
            }
        }
        deepFreeze(merged);
        cache.set(locale, merged);
        return merged;
    };
}
