import type { ComponentProps, ReactNode } from "react";
import type { ChartConfig, ChartTooltipContent } from "@coreModule/components/ui/chart.tsx";

type TooltipFormatter = NonNullable<ComponentProps<typeof ChartTooltipContent>["formatter"]>;

/**
 * `ChartTooltipContent` renders `value.toLocaleString()` by default, which is wrong for
 * money, percentages and compacted units. Supplying a `formatter` replaces the whole row,
 * so this rebuilds the default row (indicator, config label, value) around a custom
 * value formatter instead of every chart re-implementing that markup.
 */
export function chartTooltipValueFormatter(
    config: ChartConfig,
    formatValue: (value: number) => ReactNode,
): TooltipFormatter {
    return (value, name, item) => {
        const numeric = typeof value === "number" ? value : Number(value);
        const label = config[String(name)]?.label ?? name;
        const indicatorColor =
            (item?.payload as { fill?: string } | undefined)?.fill ?? item?.color;

        return (
            <>
                <div
                    className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: indicatorColor }}
                />
                <div className="flex flex-1 items-center justify-between gap-3 leading-none">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono font-medium text-foreground tabular-nums">
                        {Number.isFinite(numeric) ? formatValue(numeric) : String(value)}
                    </span>
                </div>
            </>
        );
    };
}
