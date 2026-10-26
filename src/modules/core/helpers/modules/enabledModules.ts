/**
 * Client-side module selection (mirrors maestro `ENABLED_MODULES`).
 *
 * - `VITE_ENABLED_MODULES` (comma-separated) limits which `src/modules/*` packages
 *   register contributions at runtime / in the Vite graph.
 * - When unset, every present module package is enabled.
 * - `core` and `base` are always included.
 * - The Vite config (`scripts/enabledModules.ts`) validates the list and rewrites it to include
 *   `dependsOn` modules before the build, so the value read here is already complete.
 * - That build list is a ceiling: once signed in, only the company's own modules (granted by the
 *   platform owner, from validateToken) are active — see `isModuleActive`.
 */
import {ALWAYS_ENABLED_MODULES, parseModuleList} from "@coreModule/helpers/modules/moduleSelection.ts";

/** Parsed once: the env value is fixed at build time. `null` means every module is enabled. */
const enabledModules: ReadonlySet<string> | null = (() => {
    const requested = parseModuleList(import.meta.env.VITE_ENABLED_MODULES);
    return requested ? new Set([...ALWAYS_ENABLED_MODULES, ...requested]) : null;
})();

export function isModuleEnabled(moduleName: string): boolean {
    return enabledModules === null || enabledModules.has(moduleName);
}

/** The signed-in company's modules; `null` before sign-in (every built module is active). */
let companyModules: ReadonlySet<string> | null = null;
let companyModulesVersion = 0;

export function setCompanyModules(modules: readonly string[] | null): void {
    companyModules = modules ? new Set([...ALWAYS_ENABLED_MODULES, ...modules]) : null;
    companyModulesVersion += 1;
}

/** Bumped on every `setCompanyModules`, so memoized module-filtered values can tell they are stale. */
export function getCompanyModulesVersion(): number {
    return companyModulesVersion;
}

/** Built into this bundle and enabled for the signed-in company. */
export function isModuleActive(moduleName: string): boolean {
    return isModuleEnabled(moduleName) && (companyModules === null || companyModules.has(moduleName));
}

/** First segment after `…/modules/` in a Vite glob key or absolute path. */
export function moduleNameFromModulePath(filePath: string): string | undefined {
    return /(?:^|\/)modules\/([^/]+)\//.exec(filePath.replace(/\\/g, "/"))?.[1];
}

/** Files outside `src/modules/*` are always kept. */
export function isModuleFileEnabled(filePath: string): boolean {
    const name = moduleNameFromModulePath(filePath);
    return name === undefined || isModuleEnabled(name);
}

/** Drops `import.meta.glob` entries that belong to disabled modules. */
export function filterGlobByEnabledModules<T>(raw: Record<string, T>): Record<string, T> {
    if (enabledModules === null) {
        return raw;
    }
    return Object.fromEntries(
        Object.entries(raw).filter(([filePath]) => isModuleFileEnabled(filePath)),
    );
}
