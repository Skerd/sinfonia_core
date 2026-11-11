import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";

/**
 * Search box wording for the site's sections: a site with one section searches its own things ("Search
 * treatments…", under `<key>By.<section>`); a site with several, or a section without its own wording, keeps the
 * general text (`<key>`).
 */
export function searchPlaceholder(resolveLanguageKey: ResolveLanguageKey, key: string, sections: readonly {section: string}[]): string {
    const own = sections.length === 1 ? resolveLanguageKey(`${key}By.${sections[0].section}`, true) : "";
    return typeof own === "string" && own ? own : String(resolveLanguageKey(key));
}
