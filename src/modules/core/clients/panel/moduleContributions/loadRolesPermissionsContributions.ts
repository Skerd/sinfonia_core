import type {LanguageDictionary} from "@coreModule/helpers/hooks/useSelectedLanguage.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";

/**
 * Module-owned roles/permissions labels:
 * `src/modules/<pkg>/assets/languages/<locale>/rolesPermissions.json`
 *
 * Shape: `{ "groups": { … }, "permissions": { … } }`, deep-merged into the core
 * permissions table language so core never lists feature-module permission copy.
 */
const rawRolesPermissionsGlob = filterGlobByEnabledModules(
    import.meta.glob("@/modules/*/assets/languages/*/rolesPermissions.json", {
        eager: true,
        import: "default",
    }) as Record<string, LanguageDictionary>,
);

function deepMergeDict(target: LanguageDictionary, source: LanguageDictionary): LanguageDictionary {
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
            out[key] = deepMergeDict(existing as LanguageDictionary, value as LanguageDictionary);
        } else {
            out[key] = value;
        }
    }
    return out;
}

const mergedByLocale = new Map<string, LanguageDictionary>();

/** Merged `groups` + `permissions` fragments for a locale from all enabled modules. */
export function getMergedModuleRolesPermissions(locale: string): LanguageDictionary {
    const cached = mergedByLocale.get(locale);
    if (cached) {
        return cached;
    }

    let merged: LanguageDictionary = {};
    const suffix = `/assets/languages/${locale}/rolesPermissions.json`;
    for (const [path, mod] of Object.entries(rawRolesPermissionsGlob)) {
        const normalized = path.replace(/\\/g, "/");
        if (!normalized.endsWith(suffix)) {
            continue;
        }
        // Skip core — core groups/permissions live in permissionsTable JSON
        if (normalized.includes("/modules/core/")) {
            continue;
        }
        if (mod && typeof mod === "object") {
            merged = deepMergeDict(merged, mod);
        }
    }
    mergedByLocale.set(locale, merged);
    return merged;
}

/** Deep-merge module roles/permissions contributions under `groups` and `permissions`.
 * Only applied when the loaded dictionary already has those sections (permissions table).
 */
export function applyModuleRolesPermissionsContributions(
    language: LanguageDictionary,
    locale: string,
): LanguageDictionary {
    const hasGroups = language.groups && typeof language.groups === "object";
    const hasPermissions = language.permissions && typeof language.permissions === "object";
    if (!hasGroups && !hasPermissions) {
        return language;
    }

    const moduleFrag = getMergedModuleRolesPermissions(locale);
    if (!moduleFrag || Object.keys(moduleFrag).length === 0) {
        return language;
    }

    const next: LanguageDictionary = {...language};
    for (const section of ["groups", "permissions"] as const) {
        const contrib = moduleFrag[section];
        if (!contrib || typeof contrib !== "object" || Array.isArray(contrib)) {
            continue;
        }
        const existing =
            next[section] && typeof next[section] === "object" && !Array.isArray(next[section])
                ? (next[section] as LanguageDictionary)
                : {};
        next[section] = deepMergeDict(existing, contrib as LanguageDictionary);
    }
    return next;
}
