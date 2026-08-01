import type {LanguageDictionary} from "@coreModule/helpers/hooks/useSelectedLanguage.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";

/**
 * Module-owned roles permission labels:
 * `src/modules/<pkg>/assets/languages/<locale>/rolesPermissions.json`.
 *
 * Shape: `{ "groups": { "Products": "…" }, "permissions": { "Products": { "sku": "…" } } }`.
 * Deep-merged into the permissions table language dict so core never lists feature-module
 * model/field copy. UI chrome (`read`, `write`, filters, …) stays in core's permissionsTable.json.
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
        // Skip core — core labels live in permissionsTable.json
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

function pickDict(value: unknown): LanguageDictionary {
    return value && typeof value === "object" && !Array.isArray(value)
        ? (value as LanguageDictionary)
        : {};
}

/** Deep-merge module roles permission contributions under `language.groups` / `language.permissions`. */
export function applyModuleRolesPermissionsContributions(
    language: LanguageDictionary,
    locale: string,
): LanguageDictionary {
    const moduleRoles = getMergedModuleRolesPermissions(locale);
    if (!moduleRoles || Object.keys(moduleRoles).length === 0) {
        return language;
    }

    const moduleGroups = pickDict(moduleRoles.groups);
    const modulePermissions = pickDict(moduleRoles.permissions);
    if (Object.keys(moduleGroups).length === 0 && Object.keys(modulePermissions).length === 0) {
        return language;
    }

    return {
        ...language,
        groups: deepMergeDict(pickDict(language.groups), moduleGroups),
        permissions: deepMergeDict(pickDict(language.permissions), modulePermissions),
    };
}
