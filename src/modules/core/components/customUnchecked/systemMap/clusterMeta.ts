import type {SystemMapCluster} from "./systemMap.types.ts";

/**
 * Categorical hues for the architecture diagram. Twelve clusters need more
 * distinct colors than the five --chart-* tokens provide, so they are defined
 * here rather than pulled from the theme.
 *
 * Lightness is held near 0.52 so no cluster reads as louder than its peers, and
 * the surface/border tints are mixed against `transparent` instead of a baked
 * pale hex. That is what lets the diagram survive dark mode: the tint composites
 * over whatever the canvas actually is, rather than forcing a light background.
 */
const CLUSTER_COLORS = {
    catalog: "oklch(0.511 0.086 186)",
    ordering: "oklch(0.555 0.146 49)",
    payments: "oklch(0.488 0.217 264)",
    marketplace: "oklch(0.508 0.105 166)",
    escrow: "oklch(0.514 0.198 17)",
    portfolio: "oklch(0.500 0.119 243)",
    sales: "oklch(0.555 0.146 49)",
    leasing: "oklch(0.511 0.086 186)",
    delivery: "oklch(0.541 0.247 293)",
    cost: "oklch(0.553 0.174 38)",
    quality: "oklch(0.514 0.198 17)",
    shared: "var(--muted-foreground)",
} as const satisfies Record<SystemMapCluster, string>;

const CLUSTER_LABELS = {
    catalog: "Catalog",
    ordering: "Ordering",
    payments: "Payments & Ops",
    marketplace: "Marketplace",
    escrow: "Escrow",
    portfolio: "Portfolio",
    sales: "Sales",
    leasing: "Leasing",
    delivery: "Delivery",
    cost: "Cost",
    quality: "Quality & HSE",
    shared: "Shared",
} as const satisfies Record<SystemMapCluster, string>;

const surfaceTint = (color: string) => `color-mix(in oklab, ${color} 12%, transparent)`;
const borderTint = (color: string) => `color-mix(in oklab, ${color} 40%, transparent)`;

export const CLUSTER_META: Record<
    SystemMapCluster,
    {label: string; color: string; bg: string; border: string}
> = Object.fromEntries(
    (Object.keys(CLUSTER_COLORS) as SystemMapCluster[]).map((key) => {
        const color = CLUSTER_COLORS[key];
        return [
            key,
            {
                label: CLUSTER_LABELS[key],
                color,
                bg: surfaceTint(color),
                border: borderTint(color),
            },
        ];
    }),
) as Record<SystemMapCluster, {label: string; color: string; bg: string; border: string}>;
