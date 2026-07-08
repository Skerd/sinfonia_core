import type {RouteConfigArgs, RouteConfigContribution} from "@coreModule/clients/panel/moduleContributions/routeConfigContribution.types.ts";

const raw = import.meta.glob<Record<string, unknown>>(
    "@/modules/*/clients/panel/routeConfigContribution.{tsx,ts}",
    { eager: true },
);

let sorted: RouteConfigContribution[] | undefined;

function normalizeDefaultExport(mod: Record<string, unknown>, modulePath: string): RouteConfigContribution[] {
    const d = mod.default;
    if (d == null) {
        return [];
    }
    if (Array.isArray(d)) {
        return d.map((x, i) => {
            if (typeof x !== "object" || x == null || !("contributeRoutes" in x)) {
                throw new Error(
                    `[routeConfigContribution] Invalid entry at ${modulePath}[${i}]: expected RouteConfigContribution`,
                );
            }
            return x as RouteConfigContribution;
        });
    }
    if (typeof d === "object" && d !== null && "contributeRoutes" in d) {
        return [d as RouteConfigContribution];
    }
    throw new Error(
        `[routeConfigContribution] Invalid default export in ${modulePath}: expected RouteConfigContribution or array`,
    );
}

function getSortedRouteConfigContributions(): RouteConfigContribution[] {
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

/**
 * First contribution that returns non-`undefined` wins. `null` is treated as a handled empty view.
 */
export function runRouteConfigContributions(args: RouteConfigArgs) {
    for (const c of getSortedRouteConfigContributions()) {
        const out = c.contributeRoutes?.(args);
        if (out !== undefined) {
            return out;
        }
    }
    return undefined;
}
