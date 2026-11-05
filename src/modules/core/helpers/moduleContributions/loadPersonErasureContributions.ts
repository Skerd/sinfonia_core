import {createLanguageFragmentMerger, isDictionary} from "@coreModule/helpers/moduleContributions/languageFragments.ts";

/**
 * Module-owned text for "Erase a person's data" (D57):
 * `src/modules/<pkg>/assets/languages/<locale>/personErasure.json`, shape `{"modules": {"<pkg>": "what it erases"}}`.
 * The section lists the sentences of the company's own modules, so core never describes a module's data itself.
 */
const getMergedPersonErasure = createLanguageFragmentMerger({
    fileName: "personErasure.json",
    glob: import.meta.glob("@/modules/*/assets/languages/*/personErasure.json", {eager: true, import: "default"}),
});

/** What each module erases, by module name, in `locale`. */
export function getModulePersonErasureTexts(locale: string): Record<string, string> {
    const modules = getMergedPersonErasure(locale)["modules"];
    if (!isDictionary(modules)) return {};
    return Object.fromEntries(Object.entries(modules).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}
