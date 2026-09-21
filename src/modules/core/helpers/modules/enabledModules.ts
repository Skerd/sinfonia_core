/**
 * Client-side module selection (mirrors maestro `ENABLED_MODULES`).
 *
 * - `VITE_ENABLED_MODULES` (comma-separated) limits which `src/modules/*` packages
 *   register contributions at runtime / in the Vite graph.
 * - When unset, every present module package is enabled.
 * - `core` and `base` are always included.
 * - The Vite config (`scripts/enabledModules.ts`) validates the list and rewrites it to include
 *   `dependsOn` modules before the build, so the value read here is already complete.
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
