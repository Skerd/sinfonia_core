export type UnitsByStatusCounts = {
    available?: number;
    reserved?: number;
    sold?: number;
    unavailable?: number;
    leased?: number;
};

export type EntityStatusStats = {
    sold: number;
    reserved: number;
    available: number;
    blocked: number;
    leased: number;
    totalUnits: number;
};

export function unitsByStatusToEntityStats(
    unitsByStatus: UnitsByStatusCounts | undefined,
    totalUnits?: number,
): EntityStatusStats {
    const available = unitsByStatus?.available ?? 0;
    const reserved = unitsByStatus?.reserved ?? 0;
    const sold = unitsByStatus?.sold ?? 0;
    const blocked = unitsByStatus?.unavailable ?? 0;
    const leased = unitsByStatus?.leased ?? 0;
    const total =
        totalUnits ??
        (available + reserved + sold + blocked + leased || 0);
    return {sold, reserved, available, blocked, leased, totalUnits: total};
}

export function formatCompactCurrency(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M €`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K €`;
    return `${value} €`;
}
