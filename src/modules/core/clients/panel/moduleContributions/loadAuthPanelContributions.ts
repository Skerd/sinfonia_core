import type {ComponentType} from "react";
import type {AuthPanelContribution} from "@coreModule/clients/panel/moduleContributions/authPanelContribution.types.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";

const raw = filterGlobByEnabledModules(
    import.meta.glob<Record<string, unknown>>(
        "@/modules/*/clients/panel/authPanelContribution.{tsx,ts}",
        {eager: true},
    ),
);

let sorted: AuthPanelContribution[] | undefined;
let panelMap: Record<string, ComponentType> | undefined;

function normalizeDefaultExport(mod: Record<string, unknown>, modulePath: string): AuthPanelContribution[] {
    const d = mod.default;
    if (d == null) {
        return [];
    }
    if (Array.isArray(d)) {
        return d.map((x, i) => {
            if (typeof x !== "object" || x == null || !("panels" in x)) {
                throw new Error(
                    `[authPanelContribution] Invalid entry at ${modulePath}[${i}]: expected AuthPanelContribution`,
                );
            }
            return x as AuthPanelContribution;
        });
    }
    if (typeof d === "object" && d !== null && "panels" in d) {
        return [d as AuthPanelContribution];
    }
    throw new Error(
        `[authPanelContribution] Invalid default export in ${modulePath}: expected AuthPanelContribution or array`,
    );
}

function getSortedContributions(): AuthPanelContribution[] {
    if (sorted) {
        return sorted;
    }
    const entries = Object.entries(raw).flatMap(([path, mod]) =>
        normalizeDefaultExport(mod as Record<string, unknown>, path),
    );
    sorted = entries.sort((a, b) => {
        const ao = a.order ?? 100;
        const bo = b.order ?? 100;
        if (ao !== bo) {
            return ao - bo;
        }
        return (a.id ?? "").localeCompare(b.id ?? "");
    });
    return sorted;
}

/** Merged panel key → component map from enabled modules. */
export function getAuthPanelComponents(): Record<string, ComponentType> {
    if (panelMap) {
        return panelMap;
    }
    panelMap = {};
    for (const c of getSortedContributions()) {
        Object.assign(panelMap, c.panels);
    }
    return panelMap;
}

export function resolveAuthPanelComponent(panel: string | undefined): ComponentType | undefined {
    if (!panel) {
        return undefined;
    }
    return getAuthPanelComponents()[panel];
}
