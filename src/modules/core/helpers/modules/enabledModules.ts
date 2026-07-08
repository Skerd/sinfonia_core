/**
 * Client-side module selection (mirrors maestro `ENABLED_MODULES`).
 *
 * - `VITE_ENABLED_MODULES` (comma-separated) limits which `src/modules/*` packages
 *   register contributions at runtime / in the Vite graph.
 * - When unset, every present module package is enabled.
 * - `core` is always included.
 */

function parseEnabledModuleList(raw: string | undefined): string[] | null {
    const trimmed = raw?.trim();
    if (!trimmed) {
        return null;
    }
    const requested = trimmed
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    return [...new Set(["core", ...requested.filter((name) => name !== "core")])].sort();
}

/** `null` means all modules are enabled. */
export function getEnabledModuleNames(): string[] | null {
    return parseEnabledModuleList(import.meta.env.VITE_ENABLED_MODULES as string | undefined);
}

export function isModuleEnabled(moduleName: string): boolean {
    const enabled = getEnabledModuleNames();
    return enabled == null || enabled.includes(moduleName);
}

/** First segment after `…/modules/` in a Vite glob key or absolute path. */
export function moduleNameFromModulePath(filePath: string): string | undefined {
    const normalized = filePath.replace(/\\/g, "/");
    const match = /(?:^|\/)modules\/([^/]+)\//.exec(normalized);
    return match?.[1];
}

export function isModuleFileEnabled(filePath: string): boolean {
    const name = moduleNameFromModulePath(filePath);
    if (!name) {
        return true;
    }
    return isModuleEnabled(name);
}

export function filterGlobByEnabledModules<T>(
    raw: Record<string, T>,
): Record<string, T> {
    const enabled = getEnabledModuleNames();
    if (enabled == null) {
        return raw;
    }
    return Object.fromEntries(
        Object.entries(raw).filter(([filePath]) => isModuleFileEnabled(filePath)),
    );
}
