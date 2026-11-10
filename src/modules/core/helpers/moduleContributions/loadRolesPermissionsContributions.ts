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
 * A third section, `roles: { "<definition slug>": { "name": "…", "description": "…" } }`, labels the
 * default roles each package registers (maestro `*.role.defaults.ts`); core's own default roles are in
 * core's file. It is read by {@link translateDefaultRole}, not merged into any dictionary (D118).
 *
 * This glob is not filtered by `VITE_ENABLED_MODULES`. The roles API returns the whole permission
 * catalog from the database, including models from modules that are not enabled in this build.
 * Dropping those files makes the roles screen show raw keys for permissions that are already stored.
 */
const SECTIONS = ["groups", "permissions"] as const;

/** The locale whose `roles` text equals what maestro stores (en-US is the reference, FE-08). */
const REFERENCE_LOCALE = "en-US";

/**
 * Same rule as maestro `DEFAULT_ROLE_SLUG_PATTERN`: a default role's slug is
 * `<company name>:reserved|default:<definition slug>`; custom roles are `<company>:<name>`.
 */
const DEFAULT_ROLE_SLUG = /:(?:reserved|default):([^:]+)$/;

/** The role fields the panel shows; `slug` tells a default role from a custom one. */
export type DefaultRoleCandidate = {
    slug?: string;
    name: string;
    description?: string;
};

export type DefaultRoleText = {
    name: string;
    description?: string;
};

/** The definition slug of a default role (`acme:default:re_sales_agent` → `re_sales_agent`), else `null`. */
export function defaultRoleBaseSlug(slug: string | undefined): string | null {
    return slug ? DEFAULT_ROLE_SLUG.exec(slug)?.[1] ?? null : null;
}

function roleLabel(fragment: LanguageDictionary, slug: string, field: keyof DefaultRoleText): string | null {
    const roles = fragment.roles;
    const entry = isDictionary(roles) ? roles[slug] : undefined;
    const value = isDictionary(entry) ? entry[field] : undefined;
    return typeof value === "string" && value !== "" ? value : null;
}

export function createRolesPermissionsContributions(glob: Record<string, unknown>, fallbackLocales?: readonly string[]) {
    const getMergedModuleRolesPermissions = createLanguageFragmentMerger({
        fileName: "rolesPermissions.json",
        glob,
        fallbackLocales,
    });
    // Default-role labels include core's own roles (SysAdmin, General Administrator, Web Client).
    const getMergedRoleLabels = createLanguageFragmentMerger({
        fileName: "rolesPermissions.json",
        glob,
        fallbackLocales,
        includeCore: true,
    });

    /**
     * A role's name and description in `locale`. Only a default role (slug suffix `:reserved:` / `:default:`)
     * is translated, and each field only while it still holds the text maestro stored from the definition: a
     * default role an administrator renamed, and every custom role, keeps its stored text. A field with no
     * translation keeps its stored text too.
     */
    const translateDefaultRole = (role: DefaultRoleCandidate, locale: string): DefaultRoleText => {
        const slug = defaultRoleBaseSlug(role.slug);
        if (!slug) {
            return {name: role.name, description: role.description};
        }
        const reference = getMergedRoleLabels(REFERENCE_LOCALE);
        const translated = getMergedRoleLabels(locale);
        const pick = (field: keyof DefaultRoleText, stored: string | undefined): string | undefined =>
            stored && stored === roleLabel(reference, slug, field)
                ? roleLabel(translated, slug, field) ?? stored
                : stored;
        return {name: pick("name", role.name) ?? role.name, description: pick("description", role.description)};
    };

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

    return {getMergedModuleRolesPermissions, applyModuleRolesPermissionsContributions, translateDefaultRole};
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

/**
 * Seam (D118): a role's name and description in the user's language. Default roles are translated by their
 * definition slug from each package's `rolesPermissions.json` `roles` section; renamed default roles and custom
 * roles show their stored text, which also stays the fallback for a missing translation.
 *
 * @example const {name, description} = translateDefaultRole(role, languageCode);
 */
export function translateDefaultRole(role: DefaultRoleCandidate, locale: string): DefaultRoleText {
    return rolesPermissionsContributions.translateDefaultRole(role, locale);
}
