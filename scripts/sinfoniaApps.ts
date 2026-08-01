import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sinfoniaRoot = path.resolve(__dirname, "..");
const modulesDir = path.join(sinfoniaRoot, "src/modules");

export type SinfoniaAppInfo = {
    appId: string;
    moduleName: string;
    appRoot: string;
    indexHtml: string;
};

const DEFAULT_SINFONIA_APP_ID = "core";

/** Discover Vite clients at `src/modules/<module>/apps/<appId>/index.html`. */
export function discoverSinfoniaApps(): Map<string, SinfoniaAppInfo> {
    const apps = new Map<string, SinfoniaAppInfo>();
    if (!fs.existsSync(modulesDir)) {
        return apps;
    }

    for (const moduleName of fs.readdirSync(modulesDir)) {
        const appsDir = path.join(modulesDir, moduleName, "apps");
        if (!fs.statSync(path.join(modulesDir, moduleName)).isDirectory()) {
            continue;
        }
        if (!fs.existsSync(appsDir) || !fs.statSync(appsDir).isDirectory()) {
            continue;
        }
        for (const appId of fs.readdirSync(appsDir)) {
            const appRoot = path.join(appsDir, appId);
            const indexHtml = path.join(appRoot, "index.html");
            if (!fs.statSync(appRoot).isDirectory() || !fs.existsSync(indexHtml)) {
                continue;
            }
            const existing = apps.get(appId);
            if (existing) {
                throw new Error(
                    `Duplicate Sinfonia client "${appId}" in modules "${existing.moduleName}" and "${moduleName}". ` +
                        `Each app id must be unique under src/modules/*/apps/.`,
                );
            }
            apps.set(appId, {appId, moduleName, appRoot, indexHtml});
        }
    }
    return apps;
}

export function resolveSinfoniaApp(raw: string | undefined): SinfoniaAppInfo {
    const apps = discoverSinfoniaApps();
    const id = raw?.trim() || DEFAULT_SINFONIA_APP_ID;
    const info = apps.get(id);
    if (!info) {
        const known = [...apps.keys()].sort().join(", ") || "(none)";
        throw new Error(
            `Unknown Sinfonia client "${id}". Add src/modules/<module>/apps/${id}/ ` +
                `(with index.html and entry). Discovered: ${known}.`,
        );
    }
    return info;
}

export function resolveSinfoniaAppId(raw: string | undefined): string {
    return resolveSinfoniaApp(raw).appId;
}
