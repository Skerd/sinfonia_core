import type {LanguageDictionary} from "@coreModule/helpers/hooks/useSelectedLanguage.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";
import {
    createLanguageFragmentMerger,
    deepMergeDictionaries,
    isDictionary,
} from "@coreModule/helpers/moduleContributions/languageFragments.ts";

/**
 * Module-owned panel menu translations: `src/modules/<pkg>/assets/languages/<locale>/menus.json`.
 * Shape is the contents of `menus` (e.g. `{ "eCommerce": { "title": "…" } }`), deep-merged into
 * core shell language files so core never lists feature-module menu copy.
 */
export function createMenuLanguageContributions(glob: Record<string, unknown>, fallbackLocales?: readonly string[]) {
    const getMergedModuleMenus = createLanguageFragmentMerger({fileName: "menus.json", glob, fallbackLocales});

    /** Deep-merges module menus under `language.menus`; module entries win over core ones. */
    const applyModuleMenuContributions = (language: LanguageDictionary, locale: string): LanguageDictionary => {
        const moduleMenus = getMergedModuleMenus(locale);
        if (Object.keys(moduleMenus).length === 0) {
            return language;
        }
        return {
            ...language,
            // The merged fragment is frozen, so dictionaries without their own menus can share it.
            menus: isDictionary(language.menus) ? deepMergeDictionaries(language.menus, moduleMenus) : moduleMenus,
        };
    };

    return {getMergedModuleMenus, applyModuleMenuContributions};
}

const menuContributions = createMenuLanguageContributions(
    filterGlobByEnabledModules(
        import.meta.glob("@/modules/*/assets/languages/*/menus.json", {eager: true, import: "default"}),
    ),
);

/** Merged `menus.*` fragments for a locale from all enabled modules. */
export function getMergedModuleMenus(locale: string): LanguageDictionary {
    return menuContributions.getMergedModuleMenus(locale);
}

/** Deep-merge module menu contributions under `language.menus`. */
export function applyModuleMenuContributions(language: LanguageDictionary, locale: string): LanguageDictionary {
    return menuContributions.applyModuleMenuContributions(language, locale);
}
