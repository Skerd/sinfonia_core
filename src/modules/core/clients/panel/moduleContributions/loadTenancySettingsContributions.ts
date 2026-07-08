import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {NavSubCollapsible} from "@coreModule/helpers/panel/sidebarNav.types.ts";
import type {TenancySettingsContribution} from "@coreModule/clients/panel/moduleContributions/tenancySettingsContribution.types.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";

const raw = filterGlobByEnabledModules(
    import.meta.glob<Record<string, unknown>>(
        "@/modules/*/clients/panel/tenancySettingsContribution.{tsx,ts}",
        {eager: true},
    ),
);

let sorted: TenancySettingsContribution[] | undefined;

function normalizeDefaultExport(mod: Record<string, unknown>, modulePath: string): TenancySettingsContribution[] {
    const d = mod.default;
    if (d == null) {
        return [];
    }
    if (Array.isArray(d)) {
        return d.map((x, i) => {
            if (typeof x !== "object" || x == null || !("getTenancySettingsItems" in x)) {
                throw new Error(
                    `[tenancySettingsContribution] Invalid entry at ${modulePath}[${i}]: expected TenancySettingsContribution`,
                );
            }
            return x as TenancySettingsContribution;
        });
    }
    if (typeof d === "object" && d !== null && "getTenancySettingsItems" in d) {
        return [d as TenancySettingsContribution];
    }
    throw new Error(
        `[tenancySettingsContribution] Invalid default export in ${modulePath}: expected TenancySettingsContribution or array`,
    );
}

function getSortedContributions(): TenancySettingsContribution[] {
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

export function getTenancySettingsSubCollapsibles(resolveLanguageKey: ResolveLanguageKey): NavSubCollapsible[] {
    return getSortedContributions().map((c) => c.getTenancySettingsItems(resolveLanguageKey));
}
