import type {
    PanelLayoutContribution,
    PanelLayoutContributionArgs,
} from "@coreModule/clients/panel/moduleContributions/panelLayoutContribution.types.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";

const raw = filterGlobByEnabledModules(
    import.meta.glob<Record<string, unknown>>(
        "@/modules/*/clients/panel/panelLayoutContribution.{tsx,ts}",
        {eager: true},
    ),
);

let sorted: PanelLayoutContribution[] | undefined;

function normalizeDefaultExport(mod: Record<string, unknown>, modulePath: string): PanelLayoutContribution[] {
    const d = mod.default;
    if (d == null) {
        return [];
    }
    if (Array.isArray(d)) {
        return d as PanelLayoutContribution[];
    }
    if (typeof d === "object") {
        return [d as PanelLayoutContribution];
    }
    throw new Error(`[panelLayoutContribution] Invalid default export in ${modulePath}`);
}

function getSorted(): PanelLayoutContribution[] {
    if (sorted) {
        return sorted;
    }
    sorted = Object.entries(raw)
        .flatMap(([path, mod]) => normalizeDefaultExport(mod as Record<string, unknown>, path))
        .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
    return sorted;
}

/** First module that returns a className wins; otherwise undefined. */
export function resolveCenterPanelClassName(args: PanelLayoutContributionArgs): string | undefined {
    for (const c of getSorted()) {
        const cls = c.getCenterPanelClassName?.(args);
        if (cls !== undefined) {
            return cls;
        }
    }
    return undefined;
}
