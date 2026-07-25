import type {LanguageDictionary} from "@coreModule/helpers/hooks/useSelectedLanguage.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";

/**
 * Module-owned panel menu translations: `src/modules/<pkg>/assets/languages/<locale>/menus.json`.
 * Shape is the contents of `menus` (e.g. `{ "eCommerce": { "title": "…" } }`), deep-merged into
 * core shell language files so core never lists feature-module menu copy.
 */
const rawMenuGlob = filterGlobByEnabledModules(
    import.meta.glob("@/modules/*/assets/languages/*/menus.json", {
        eager: true,
        import: "default",
    }) as Record<string, LanguageDictionary>,
);

function deepMergeMenus(target: LanguageDictionary, source: LanguageDictionary): LanguageDictionary {
    const out: LanguageDictionary = {...target};
    for (const [key, value] of Object.entries(source)) {
        const existing = out[key];
        if (
            existing &&
            typeof existing === "object" &&
            !Array.isArray(existing) &&
            value &&
            typeof value === "object" &&
            !Array.isArray(value)
        ) {
            out[key] = deepMergeMenus(existing as LanguageDictionary, value as LanguageDictionary);
        } else {
            out[key] = value;
        }
    }
    return out;
}

const mergedByLocale = new Map<string, LanguageDictionary>();

/** Merged `menus.*` fragments for a locale from all enabled modules. */
export function getMergedModuleMenus(locale: string): LanguageDictionary {
    const cached = mergedByLocale.get(locale);
    if (cached) {
        return cached;
    }

    let merged: LanguageDictionary = {};
    const suffix = `/assets/languages/${locale}/menus.json`;
    for (const [path, mod] of Object.entries(rawMenuGlob)) {
        const normalized = path.replace(/\\/g, "/");
        if (!normalized.endsWith(suffix)) {
            continue;
        }
        // Skip core — core menus live in sidebar/entryPoint JSON
        if (normalized.includes("/modules/core/")) {
            continue;
        }
        if (mod && typeof mod === "object") {
            merged = deepMergeMenus(merged, mod);
        }
    }
    mergedByLocale.set(locale, merged);
    return merged;
}

/** Deep-merge module menu contributions under `language.menus`. */
export function applyModuleMenuContributions(
    language: LanguageDictionary,
    locale: string,
): LanguageDictionary {
    const moduleMenus = getMergedModuleMenus(locale);
    if (!moduleMenus || Object.keys(moduleMenus).length === 0) {
        return language;
    }
    const existingMenus =
        language.menus && typeof language.menus === "object" && !Array.isArray(language.menus)
            ? (language.menus as LanguageDictionary)
            : {};
    return {
        ...language,
        menus: deepMergeMenus(existingMenus, moduleMenus),
    };
}
