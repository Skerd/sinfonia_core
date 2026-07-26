import type {SystemMapCluster} from "./systemMap.types.ts";

export const CLUSTER_META: Record<
    SystemMapCluster,
    {label: string; color: string; bg: string; border: string}
> = {
    catalog: {
        label: "Catalog",
        color: "#0f766e",
        bg: "#f0fdfa",
        border: "#5eead4",
    },
    ordering: {
        label: "Ordering",
        color: "#b45309",
        bg: "#fffbeb",
        border: "#fcd34d",
    },
    payments: {
        label: "Payments & Ops",
        color: "#1d4ed8",
        bg: "#eff6ff",
        border: "#93c5fd",
    },
    marketplace: {
        label: "Marketplace",
        color: "#047857",
        bg: "#ecfdf5",
        border: "#6ee7b7",
    },
    escrow: {
        label: "Escrow",
        color: "#be123c",
        bg: "#fff1f2",
        border: "#fda4af",
    },
    portfolio: {
        label: "Portfolio",
        color: "#0369a1",
        bg: "#f0f9ff",
        border: "#7dd3fc",
    },
    sales: {
        label: "Sales",
        color: "#b45309",
        bg: "#fffbeb",
        border: "#fcd34d",
    },
    leasing: {
        label: "Leasing",
        color: "#0f766e",
        bg: "#f0fdfa",
        border: "#5eead4",
    },
    delivery: {
        label: "Delivery",
        color: "#7c3aed",
        bg: "#f5f3ff",
        border: "#c4b5fd",
    },
    cost: {
        label: "Cost",
        color: "#c2410c",
        bg: "#fff7ed",
        border: "#fdba74",
    },
    quality: {
        label: "Quality & HSE",
        color: "#be123c",
        bg: "#fff1f2",
        border: "#fda4af",
    },
    shared: {
        label: "Shared",
        color: "#475569",
        bg: "#f8fafc",
        border: "#cbd5e1",
    },
};
