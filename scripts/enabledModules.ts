import fs from "node:fs";
import path from "node:path";
// Relative path: Node loads this while evaluating `vite.config.ts`, before Vite aliases exist.
import {
    type ModuleManifest,
    parseModuleList,
    resolveModuleSelection,
} from "../src/modules/core/helpers/modules/moduleSelection.ts";

/** Same places maestro looks: deploy layout (`<deploy>/scripts`) and monorepo layout (`<repo>/scripts`). */
function findModuleManifest(sinfoniaRoot: string): string | undefined {
    return [
        path.resolve(sinfoniaRoot, "scripts/modules.manifest.json"),
        path.resolve(sinfoniaRoot, "../scripts/modules.manifest.json"),
    ].find((candidate) => fs.existsSync(candidate));
}

/**
 * Resolves `VITE_ENABLED_MODULES` for the build: adds `dependsOn` modules from the shared
 * manifest (so e.g. `propertyDevelopment` keeps `propertyManagement`, as maestro does) and
 * fails on unknown names instead of silently stubbing a typo'd module.
 *
 * Returns `null` when the variable is unset (every module enabled).
 */
export function resolveEnabledModules(raw: string | undefined, sinfoniaRoot: string): string[] | null {
    const requested = parseModuleList(raw);
    if (!requested) {
        return null;
    }

    const manifestPath = findModuleManifest(sinfoniaRoot);
    const presentModules = fs
        .readdirSync(path.join(sinfoniaRoot, "src/modules"), {withFileTypes: true})
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

    // Without a manifest there are no dependencies to add; only the folder names can be checked.
    const manifest: ModuleManifest = manifestPath
        ? JSON.parse(fs.readFileSync(manifestPath, "utf-8"))
        : Object.fromEntries(presentModules.map((name) => [name, {}]));
    if (!manifestPath) {
        console.warn("[enabledModules] modules.manifest.json not found; module dependencies are not resolved.");
    }

    const {modules, unknown} = resolveModuleSelection(requested, manifest);
    if (unknown.length) {
        throw new Error(
            `VITE_ENABLED_MODULES: unknown module(s) ${unknown.join(", ")}. Known modules: ${Object.keys(manifest).join(", ")}`,
        );
    }

    const missing = modules.filter((name) => !presentModules.includes(name));
    if (missing.length) {
        console.warn(`[enabledModules] enabled but not present under src/modules: ${missing.join(", ")}`);
    }
    return modules;
}
