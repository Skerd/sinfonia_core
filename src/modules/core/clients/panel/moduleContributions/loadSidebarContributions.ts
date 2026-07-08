import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import type { NavGroup } from "@coreModule/helpers/panel/sidebarNav.types.ts";
import type {
    SidebarContribution,
    SidebarContributionContext,
} from "@coreModule/clients/panel/moduleContributions/sidebarContribution.types.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";

const raw = filterGlobByEnabledModules(
    import.meta.glob<Record<string, unknown>>(
        "@/modules/*/clients/panel/sidebarContribution.{tsx,ts}",
        { eager: true },
    ),
);

let sortedContributions: SidebarContribution[] | undefined;

function normalizeDefaultExport(mod: Record<string, unknown>, modulePath: string): SidebarContribution[] {
    const d = mod.default;
    if (d == null) {
        return [];
    }
    if (Array.isArray(d)) {
        return d.map((x, i) => {
            if (typeof x !== "object" || x == null || !("getNavGroups" in x)) {
                throw new Error(
                    `[sidebarContribution] Invalid entry at ${modulePath}[${i}]: expected SidebarContribution`,
                );
            }
            return x as SidebarContribution;
        });
    }
    if (typeof d === "object" && d !== null && "getNavGroups" in d) {
        return [d as SidebarContribution];
    }
    throw new Error(`[sidebarContribution] Invalid default export in ${modulePath}: expected SidebarContribution or array`);
}

/** Lazy-parse glob once; sort by {@link SidebarContribution.order} (asc) then id/key path. */
function getSortedContributions(): SidebarContribution[] {
    if (sortedContributions) {
        return sortedContributions;
    }
    const entries = Object.entries(raw).flatMap(([path, mod]) => normalizeDefaultExport(mod as Record<string, unknown>, path));
    sortedContributions = entries.sort((a, b) => {
        const ao = a.order ?? 100;
        const bo = b.order ?? 100;
        if (ao !== bo) {
            return ao - bo;
        }
        const idCompare = (a.id ?? "").localeCompare(b.id ?? "");
        if (idCompare !== 0) {
            return idCompare;
        }
        return 0;
    });
    return sortedContributions;
}

/** All package nav groups for the current locale, in contribution `order`. */
export function getModuleSidebarNavGroups(
    resolveLanguageKey: ResolveLanguageKey,
    context?: SidebarContributionContext,
): NavGroup[] {
    return getSortedContributions().flatMap((c) => c.getNavGroups(resolveLanguageKey, context));
}
