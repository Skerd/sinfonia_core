import type {LanguageDictionary} from "@coreModule/helpers/hooks/useSelectedLanguage.ts";
import {
    createLanguageFragmentMerger,
    deepMergeDictionaries,
    isDictionary,
    MODULE_LANGUAGE_FALLBACKS,
} from "@coreModule/helpers/moduleContributions/languageFragments.ts";
import {
    createDefaultRoleLabels,
    type DefaultRoleCandidate,
    type DefaultRoleText,
} from "armonia/src/modules/core/helpers/defaultRoleLabels.ts";

/**
 * Module-owned roles/permissions labels:
 * `src/modules/<pkg>/assets/languages/<locale>/rolesPermissions.json`
 *
 * Shape: `{ "groups": { "Products": "…" }, "permissions": { "Products": { "sku": "…" } } }`,
 * deep-merged into the permissions table language so core never lists feature-module model/field
 * copy. UI chrome (`read`, `write`, filters, …) stays in core's permissionsTable.json.
 *
 * Default-role names and descriptions are not here: they live in armonia so the server translates them too (D129),
 * read by {@link translateDefaultRole}.
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

// Every package's labels, enabled or not, for the same reason as the permissions glob above: stored roles can name them.
const defaultRoleLabels = createDefaultRoleLabels({
    files: import.meta.glob("armonia/src/modules/*/helpers/static/defaultRoles/*.json", {eager: true, import: "default"}),
    fallbackLocales: MODULE_LANGUAGE_FALLBACKS,
});

/** Merged `groups` + `permissions` fragments for a locale from every module. */
export function getMergedModuleRolesPermissions(locale: string): LanguageDictionary {
    return rolesPermissionsContributions.getMergedModuleRolesPermissions(locale);
}

/** Deep-merge module roles/permissions contributions under `groups` and `permissions`. */
export function applyModuleRolesPermissionsContributions(language: LanguageDictionary, locale: string): LanguageDictionary {
    return rolesPermissionsContributions.applyModuleRolesPermissionsContributions(language, locale);
}

/**
 * Seam (D118): a role's name and description in the user's language. Default roles are translated by their
 * definition slug from armonia's `defaultRoles` files (D129); renamed default roles and custom
 * roles show their stored text, which also stays the fallback for a missing translation.
 *
 * @example const {name, description} = translateDefaultRole(role, languageCode);
 */
export function translateDefaultRole(role: DefaultRoleCandidate, locale: string): DefaultRoleText {
    return defaultRoleLabels.translateDefaultRole(role, locale);
}

/**
 * A role notice's params with each default role's name in `locale` (D118): `role` holds the stored names, `roleSlugs`
 * their slugs in the same order. The server renders SMS/Telegram notices the same way (D129).
 */
export function translateRoleParams<P extends Record<string, string | number>>(params: P | undefined, locale: string): P | undefined {
    return defaultRoleLabels.translateRoleParams(params, locale);
}
