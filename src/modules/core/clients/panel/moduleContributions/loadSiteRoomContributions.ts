import type {SiteRoomContribution} from "@coreModule/clients/panel/moduleContributions/siteRoomContribution.types.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";

const raw = filterGlobByEnabledModules(
    import.meta.glob<Record<string, unknown>>(
        "@/modules/*/clients/panel/siteRoomContribution.{tsx,ts}",
        {eager: true},
    ),
);

let cachedSystemSettingsRooms: Record<string, string> | undefined;
let cachedPathOverrides: Record<string, string> | undefined;

function normalizeDefaultExport(mod: Record<string, unknown>, modulePath: string): SiteRoomContribution[] {
    const d = mod.default;
    if (d == null) {
        return [];
    }
    if (Array.isArray(d)) {
        return d.map((x, i) => {
            if (typeof x !== "object" || x == null) {
                throw new Error(`[siteRoomContribution] Invalid entry at ${modulePath}[${i}]`);
            }
            return x as SiteRoomContribution;
        });
    }
    if (typeof d === "object") {
        return [d as SiteRoomContribution];
    }
    throw new Error(`[siteRoomContribution] Invalid default export in ${modulePath}`);
}

function getSortedContributions(): SiteRoomContribution[] {
    const entries = Object.entries(raw).flatMap(([path, mod]) =>
        normalizeDefaultExport(mod as Record<string, unknown>, path),
    );
    return entries.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}

export function getContributedSystemSettingsRooms(): Record<string, string> {
    if (cachedSystemSettingsRooms) {
        return cachedSystemSettingsRooms;
    }
    const merged: Record<string, string> = {};
    for (const c of getSortedContributions()) {
        Object.assign(merged, c.systemSettingsRooms ?? {});
    }
    cachedSystemSettingsRooms = merged;
    return merged;
}

export function getContributedPathRoomOverrides(): Record<string, string> {
    if (cachedPathOverrides) {
        return cachedPathOverrides;
    }
    const merged: Record<string, string> = {};
    for (const c of getSortedContributions()) {
        Object.assign(merged, c.pathRoomOverrides ?? {});
    }
    cachedPathOverrides = merged;
    return merged;
}
