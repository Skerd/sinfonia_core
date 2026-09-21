/**
 * Pure module-selection logic shared by the client (`enabledModules.ts`) and the Vite config
 * (`scripts/enabledModules.ts`). Mirrors maestro's `resolveModuleSelection`.
 * No `import.meta.env` or Node APIs here, so both sides can import it.
 */

/** Always part of the build. `core` is infrastructure, not a feature toggle. */
export const ALWAYS_ENABLED_MODULES: readonly string[] = ["core"];

/** Shape of `<repo>/scripts/modules.manifest.json` (only the fields used here). */
export type ModuleManifest = Record<string, {dependsOn?: string[]}>;

/** Splits a comma-separated module list. `null` when unset or blank, meaning "all modules". */
export function parseModuleList(raw: string | undefined): string[] | null {
    const names = (raw ?? "")
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
    return names.length ? [...new Set(names)] : null;
}

export type ModuleSelection = {
    /** Requested modules plus their `dependsOn` closure and the always-enabled ones, sorted. */
    modules: string[];
    /** Names the manifest does not know (reachable through `requested` or `dependsOn`). */
    unknown: string[];
};

/** Adds every transitive `dependsOn` entry to the requested modules. */
export function resolveModuleSelection(requested: string[], manifest: ModuleManifest): ModuleSelection {
    const resolved = new Set<string>(ALWAYS_ENABLED_MODULES);
    const unknown = new Set<string>();
    const queue = [...requested];

    for (let name = queue.shift(); name !== undefined; name = queue.shift()) {
        if (resolved.has(name) || unknown.has(name)) continue;
        const entry = manifest[name];
        if (!entry) {
            unknown.add(name);
            continue;
        }
        resolved.add(name);
        queue.push(...(entry.dependsOn ?? []));
    }

    return {modules: [...resolved].sort(), unknown: [...unknown].sort()};
}
