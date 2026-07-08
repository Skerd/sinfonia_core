import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import ExpandableText from "@coreModule/components/custom/expandableText.tsx";
import { cn } from "@coreModule/components/lib/utils.ts";
import type { Media } from "armonia/src/modules/core/types";
import SheetMediaFilesStrip from "@coreModule/components/viewEngine/sheetMediaFilesStrip.tsx";

export type SheetModificationLineItem = {
    item?: string;
    quantity?: number;
    unit?: string;
    /** Enum key for measure unit (expenditureItems variant). */
    measureUnitKey?: string;
    /** Expenditure category enum key (expenditureItems variant). */
    categoryKey?: string;
    notes?: string;
    cost?: number;
    source?: string;
    /** Line-level evidence (expenditureItems variant). */
    media?: Media[];
};

export type SheetModificationLineItemsProps = {
    items: SheetModificationLineItem[];
    variant: "materialsPlan" | "costBreakdown" | "expenditureItems";
    resolveLanguageKey: ResolveLanguageKey;
    className?: string;
    /** Prepended to numeric cost / line totals (e.g. currency symbol). */
    currencyPrefix?: string;
    /** Grand total row below the list (sheet expenditure / cost breakdown). */
    footerTotalLabel?: string;
    /** Pre-formatted amount including currency prefix (e.g. `€ 1,234.56`). */
    footerTotalFormatted?: string;
};

function formatCost(n: number): string {
    return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const cardClass =
    "text-sm p-2 rounded-md bg-muted/50 border border-border/30 space-y-1";
const highlightClass = "text-emerald-600 dark:text-emerald-400 shrink-0 font-medium";

export default function SheetModificationLineItems({
    items,
    variant,
    resolveLanguageKey,
    className,
    currencyPrefix = "",
    footerTotalLabel,
    footerTotalFormatted,
}: SheetModificationLineItemsProps) {
    if (!items.length) return null;

    const qtyLabel = String(resolveLanguageKey("quantity"));
    const unitLabel = String(resolveLanguageKey("units"));
    const costLabel = String(resolveLanguageKey("cost"));
    const costPerUnitLabel = String(resolveLanguageKey("costPerUnit"));
    const notesLabel = String(resolveLanguageKey("notesLabel"));

    return (
        <div className={cn("space-y-2 w-full", className)}>
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {items.map((row, index) => {
                const isCost = variant === "costBreakdown" || variant === "expenditureItems";
                const lineTotal =
                    isCost && row.cost !== undefined && row.quantity !== undefined
                        ? `${currencyPrefix}${formatCost(row.cost * row.quantity)}`
                        : null;
                const showMaterialsHighlight =
                    !isCost &&
                    (row.quantity !== undefined ||
                        (row.unit != null && String(row.unit).trim() !== ""));
                const materialsHighlightText = showMaterialsHighlight
                    ? `${row.quantity ?? 1}${row.unit != null && row.unit !== "" ? ` ${row.unit}` : ""}`
                    : null;

                return (
                    <div key={index} className={cardClass}>
                        <div className="flex justify-between items-start gap-2">
                            {row.item != null && row.item !== "" && (
                                <p className="font-medium text-foreground">{row.item}</p>
                            )}
                            {lineTotal != null ? (
                                <p className={highlightClass}>{lineTotal}</p>
                            ) : materialsHighlightText != null ? (
                                <p className={highlightClass}>{materialsHighlightText}</p>
                            ) : null}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            {isCost ? (
                                <>
                                    {variant === "expenditureItems" && row.categoryKey != null && row.categoryKey !== "" && (
                                        <span>
                                            {String(resolveLanguageKey("category"))}:{" "}
                                            {String(resolveLanguageKey(`expenditureCategory.${row.categoryKey}`))}
                                        </span>
                                    )}
                                    {row.quantity !== undefined && (
                                        <span>
                                            {qtyLabel}: {Number(row.quantity)}
                                        </span>
                                    )}
                                    {(variant === "expenditureItems"
                                        ? row.measureUnitKey != null && row.measureUnitKey !== ""
                                        : row.unit != null && String(row.unit).trim() !== "") && (
                                        <span>
                                            {unitLabel}:{" "}
                                            {variant === "expenditureItems" && row.measureUnitKey
                                                ? String(resolveLanguageKey(`measureUnit.${row.measureUnitKey}`))
                                                : row.unit}
                                        </span>
                                    )}
                                    {row.cost !== undefined && (
                                        <span>
                                            {row.quantity !== undefined ? costPerUnitLabel : costLabel}:{" "}
                                            {currencyPrefix}
                                            {formatCost(row.cost)}
                                        </span>
                                    )}
                                    {variant !== "expenditureItems" && row.source != null && row.source !== "" && (
                                        <span className="capitalize">{row.source.replace(/_/g, " ")}</span>
                                    )}
                                </>
                            ) : (
                                <>
                                    {row.quantity !== undefined && (
                                        <span>
                                            {qtyLabel}: {Number(row.quantity)}
                                        </span>
                                    )}
                                    {row.unit != null && row.unit !== "" && (
                                        <span>
                                            {unitLabel}: {row.unit}
                                        </span>
                                    )}
                                    {row.notes != null && row.notes !== "" && (
                                        <div className="basis-full w-full min-w-0 pt-1 mt-0.5 border-t border-border/20">
                                            <p className="text-xs font-medium text-foreground/80 mb-0.5">{notesLabel}</p>
                                            <ExpandableText
                                                resolveLanguageKey={resolveLanguageKey}
                                                className="text-xs text-muted-foreground"
                                                maxLength={250}
                                            >
                                                {row.notes}
                                            </ExpandableText>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        {variant === "expenditureItems" && row.media != null && row.media.length > 0 ? (
                            <SheetMediaFilesStrip
                                media={row.media}
                                resolveLanguageKey={resolveLanguageKey}
                                className="pt-2 border-t border-border/20 mt-1"
                                canDownload={true}
                                canRemove={false}
                            />
                        ) : null}
                    </div>
                );
            })}
            </div>
            {(variant === "expenditureItems" || variant === "costBreakdown") &&
            footerTotalLabel != null &&
            footerTotalLabel !== "" &&
            footerTotalFormatted != null &&
            footerTotalFormatted !== "" ? (
                <div className="flex justify-end items-baseline gap-2 pt-2 mt-1 border-t border-border/40 shrink-0">
                    <span className="text-sm font-medium text-muted-foreground">{footerTotalLabel}</span>
                    <span className={`text-sm ${highlightClass} font-semibold`}>{footerTotalFormatted}</span>
                </div>
            ) : null}
        </div>
    );
}
