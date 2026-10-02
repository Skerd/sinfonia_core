import type {LanguageDictionary} from "@coreModule/helpers/hooks/useSelectedLanguage.ts";
import {
    createLanguageFragmentMerger,
    deepMergeDictionaries,
    isDictionary,
} from "@coreModule/helpers/moduleContributions/languageFragments.ts";

/**
 * Module-owned roles/permissions labels:
 * `src/modules/<pkg>/assets/languages/<locale>/rolesPermissions.json`
 *
 * Shape: `{ "groups": { "Products": "…" }, "permissions": { "Products": { "sku": "…" } } }`,
 * deep-merged into the permissions table language so core never lists feature-module model/field
 * copy. UI chrome (`read`, `write`, filters, …) stays in core's permissionsTable.json.
 *
 * This glob is not filtered by `VITE_ENABLED_MODULES`. The roles API returns the whole permission
 * catalog from the database, including models from modules that are not enabled in this build.
 * Dropping those files makes the roles screen show raw keys for permissions that are already stored.
 */
const SECTIONS = ["groups", "permissions"] as const;

export function createRolesPermissionsContributions(glob: Record<string, unknown>, fallbackLocales?: readonly string[]) {
    const getMergedModuleRolesPermissions = createLanguageFragmentMerger({
        fileName: "rolesPermissions.json",
        glob,
        fallbackLocales,
    });

    /**
     * Deep-merges module labels under `groups` and `permissions`. Only dictionaries that already
     * have one of those sections (the permissions table) are touched; others come back unchanged.
     */
    const applyModuleRolesPermissionsContributions = (
        language: LanguageDictionary,
        locale: string,
    ): LanguageDictionary => {
        if (!SECTIONS.some((section) => isDictionary(language[section]))) {
            return language;
        }
        const fragment = getMergedModuleRolesPermissions(locale);
        let next: LanguageDictionary | undefined;
        for (const section of SECTIONS) {
            const contributed = fragment[section];
            if (!isDictionary(contributed)) {
                continue;
            }
            const existing = language[section];
            next ??= {...language};
            next[section] = isDictionary(existing) ? deepMergeDictionaries(existing, contributed) : contributed;
        }
        return next ?? language;
    };

    return {getMergedModuleRolesPermissions, applyModuleRolesPermissionsContributions};
}

const rolesPermissionsContributions = createRolesPermissionsContributions(
    import.meta.glob("@/modules/*/assets/languages/*/rolesPermissions.json", {eager: true, import: "default"}),
);

/** Merged `groups` + `permissions` fragments for a locale from every module. */
export function getMergedModuleRolesPermissions(locale: string): LanguageDictionary {
    return rolesPermissionsContributions.getMergedModuleRolesPermissions(locale);
}

/** Deep-merge module roles/permissions contributions under `groups` and `permissions`. */
export function applyModuleRolesPermissionsContributions(language: LanguageDictionary, locale: string): LanguageDictionary {
    return rolesPermissionsContributions.applyModuleRolesPermissionsContributions(language, locale);
}
