import type {WidgetContribution} from "@coreModule/clients/panel/moduleContributions/widgetContribution.types.ts";

const raw = import.meta.glob<Record<string, unknown>>(
    "@/modules/*/clients/panel/widgetContribution.{tsx,ts}",
    {eager: true},
);

let sorted: WidgetContribution[] | undefined;

function normalizeDefaultExport(mod: Record<string, unknown>, modulePath: string): WidgetContribution[] {
    const d = mod.default;
    if (d == null) {
        return [];
    }
    if (Array.isArray(d)) {
        return d.map((x, i) => {
            if (typeof x !== "object" || x == null) {
                throw new Error(
                    `[widgetContribution] Invalid entry at ${modulePath}[${i}]: expected WidgetContribution`,
                );
            }
            return x as WidgetContribution;
        });
    }
    if (typeof d === "object" && d !== null) {
        return [d as WidgetContribution];
    }
    throw new Error(
        `[widgetContribution] Invalid default export in ${modulePath}: expected WidgetContribution or array`,
    );
}

/**
 * All package `widgetContribution` entries, sorted by `order` then `id`.
 * Does not import `widgetRegistry` (avoids circular init with eager globs).
 */
export function getSortedWidgetContributions(): WidgetContribution[] {
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
