import {Badge} from "@coreModule/components/ui/badge.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import type {EntityStatusStats, UnitsByStatusCounts} from "./entityStatus.types.ts";
import {formatCompactCurrency, unitsByStatusToEntityStats} from "./entityStatus.types.ts";

type ResolveLabel = (key: string) => string;

/** Compact badge row for list entity cards. */
export function EntityStatusBadgeRow({
    unitsByStatus,
    resolveLanguageKey,
}: {
    unitsByStatus: UnitsByStatusCounts | undefined;
    resolveLanguageKey: ResolveLabel;
}) {
    if (!unitsByStatus || !Object.values(unitsByStatus).some((v) => (v ?? 0) > 0)) {
        return null;
    }

    const items: {
        key: keyof UnitsByStatusCounts;
        labelKey: string;
        descKey: string;
        className: string;
    }[] = [
        {
            key: "available",
            labelKey: "statistics.available",
            descKey: "statistics.availableDesc",
            className: "border-status-available/30 bg-status-available/10 text-status-available",
        },
        {
            key: "reserved",
            labelKey: "statistics.reserved",
            descKey: "statistics.reservedDesc",
            className: "border-status-reserved/30 bg-status-reserved/10 text-status-reserved",
        },
        {
            key: "sold",
            labelKey: "statistics.sold",
            descKey: "statistics.soldDesc",
            className: "border-status-sold/30 bg-status-sold/10 text-status-sold",
        },
        {
            key: "leased",
            labelKey: "statistics.leased",
            descKey: "statistics.leasedDesc",
            className: "border-primary/30 bg-primary/10 text-primary",
        },
        {
            key: "unavailable",
            labelKey: "statistics.unavailable",
            descKey: "statistics.unavailableDesc",
            className: "border-status-blocked/30 bg-status-blocked/10 text-status-blocked",
        },
    ];

    return (
        <div className="flex flex-wrap gap-1 pt-0.5">
            {items.map(({key, labelKey, descKey, className}) => {
                const count = unitsByStatus[key] ?? 0;
                if (count <= 0) return null;
                return (
                    <TooltipDisplayer key={key} tooltip={resolveLanguageKey(descKey)}>
                        <Badge variant="outline" className={cn("text-xs font-medium", className)}>
                            {count} {resolveLanguageKey(labelKey)}
                        </Badge>
                    </TooltipDisplayer>
                );
            })}
        </div>
    );
}

/** Full dashboard breakdown: progress bar, grid, optional footer metrics. */
export function EntityStatusBreakdown({
    stats: statsInput,
    unitsByStatus,
    totalUnits: totalUnitsOverride,
    resolveLanguageKey,
    soldLabelKey = "sold",
    reservedLabelKey = "reservedShort",
    availableLabelKey = "availableShort",
    blockedLabelKey = "blockedShort",
    leasedLabelKey = "leasedShort",
    showSoldPercentage = true,
    totalValue,
    collectedAmount,
    valueLabelKey = "value",
    collectedLabelKey = "collected",
    footer,
    className,
}: {
    stats?: EntityStatusStats;
    unitsByStatus?: UnitsByStatusCounts;
    totalUnits?: number;
    resolveLanguageKey: ResolveLabel;
    soldLabelKey?: string;
    reservedLabelKey?: string;
    availableLabelKey?: string;
    blockedLabelKey?: string;
    leasedLabelKey?: string;
    showSoldPercentage?: boolean;
    totalValue?: number;
    collectedAmount?: number;
    valueLabelKey?: string;
    collectedLabelKey?: string;
    footer?: React.ReactNode;
    className?: string;
}) {
    const stats = statsInput ?? unitsByStatusToEntityStats(unitsByStatus, totalUnitsOverride);
    const totalUnits = stats.totalUnits || 1;
    const soldPercentage = Math.round((stats.sold / totalUnits) * 100);

    return (
        <div className={cn("relative z-10", className)}>
            {showSoldPercentage && (
                <div className="flex items-start justify-end mb-4 -mt-1">
                    <div className="text-right">
                        <p className="text-xl font-display font-bold text-foreground">{soldPercentage}%</p>
                        <p className="text-3xs text-muted-foreground">{resolveLanguageKey(soldLabelKey)}</p>
                    </div>
                </div>
            )}

            <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-4">
                <div className="h-full flex">
                    <div
                        className="bg-status-sold transition-all duration-500"
                        style={{width: `${(stats.sold / totalUnits) * 100}%`}}
                    />
                    <div
                        className="bg-status-reserved transition-all duration-500"
                        style={{width: `${(stats.reserved / totalUnits) * 100}%`}}
                    />
                    <div
                        className="bg-primary transition-all duration-500"
                        style={{width: `${(stats.leased / totalUnits) * 100}%`}}
                    />
                    <div
                        className="bg-status-blocked transition-all duration-500"
                        style={{width: `${(stats.blocked / totalUnits) * 100}%`}}
                    />
                </div>
            </div>

            {/* Five fixed columns squeezed the labels below ~400px; fall back to three. */}
            <div className="grid grid-cols-3 gap-1.5 mb-4 sm:grid-cols-5">
                {(
                    [
                        ["sold", stats.sold, "bg-status-sold/10 text-status-sold", soldLabelKey],
                        ["reserved", stats.reserved, "bg-status-reserved/10 text-status-reserved", reservedLabelKey],
                        ["available", stats.available, "bg-status-available/10 text-status-available", availableLabelKey],
                        ["leased", stats.leased, "bg-primary/10 text-primary", leasedLabelKey],
                        ["blocked", stats.blocked, "bg-status-blocked/10 text-status-blocked", blockedLabelKey],
                    ] as const
                ).map(([id, value, tone, labelKey]) => (
                    <div key={id} className={cn("text-center py-1.5 px-1 rounded-md", tone.split(" ")[0])}>
                        <p className={cn("text-sm font-bold", tone.split(" ").slice(1).join(" "))}>{value}</p>
                        <p className="text-3xs text-muted-foreground uppercase tracking-wide">
                            {resolveLanguageKey(labelKey)}
                        </p>
                    </div>
                ))}
            </div>

            {(totalValue != null || collectedAmount != null) && (
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    {totalValue != null && (
                        <div>
                            <p className="text-3xs text-muted-foreground">{resolveLanguageKey(valueLabelKey)}</p>
                            <p className="font-semibold text-sm text-foreground">{formatCompactCurrency(totalValue)}</p>
                        </div>
                    )}
                    {collectedAmount != null && (
                        <div className="text-right">
                            <p className="text-3xs text-muted-foreground">{resolveLanguageKey(collectedLabelKey)}</p>
                            <p className="font-semibold text-sm text-status-sold">
                                {formatCompactCurrency(collectedAmount)}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {footer}
        </div>
    );
}
