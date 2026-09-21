import { useEffect, useMemo } from "react";
import { compose } from "redux";
import type { ResolveLanguageKey } from "@baseModule/helpers/hocs/withLanguage.tsx";
import withLanguage, { WithLanguageType } from "@baseModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@baseModule/helpers/hocs/withDebug.tsx";
import DisplayCard from "@baseModule/components/viewEngine/widgets/display/displayCard.tsx";
import ValueNotSet from "@baseModule/components/custom/valueNotSet.tsx";
import { cn } from "@coreModule/components/lib/utils.ts";
import { resolveIcon } from "../../../widgetRegistry.ts";
import { useReferencesViewModeOptional } from "../references/referencesViewModeContext.tsx";
import { SheetListPaginationFooter, useSheetListPagination } from "../sheetListPagination.tsx";
import {
    buildCompactSummaryParts,
    itemHasVisibleContent,
    sortItems,
    type EmbeddedItemFieldConfig,
} from "./fieldText.ts";
import {
    ExternalTextLink,
    renderLinkedRefField,
    renderMediaStripField,
    renderScalarEmbeddedField,
} from "./fieldRenderers.tsx";

export type { EmbeddedItemFieldConfig } from "./fieldText.ts";

function cardColumnsClass(columns: number | undefined): string {
    if (columns === 2) return "grid grid-cols-1 sm:grid-cols-2 gap-2";
    if (columns === 3) return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2";
    if (columns === 4) return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2";
    return "flex flex-col gap-2";
}

export type SheetEmbeddedItemsListProps = WithLanguageType & {
    items: Record<string, any>[];
    fields: EmbeddedItemFieldConfig[];
    /** Single field used as the summary line in compact mode when `compactSummaryFields` is omitted. */
    compactSummaryField?: string;
    /** Multiple fields joined for compact mode (e.g. performer · action · date). */
    compactSummaryFields?: string[];
    compactSummaryJoinSeparator?: string;
    displayMode?: "cards" | "compact";
    /** Card-mode field grid columns (e.g. `3` → three fields per row). */
    cardColumns?: number;
    /** Items per page; omit to show all. */
    pageSize?: number;
    listClassName?: string;
    /** Merged onto the list root (e.g. `p-0` when the list is a `#DisplayCard` body). */
    className?: string;
    sortField?: string;
    sortDescending?: boolean;
    sheetLanguageKey?: ResolveLanguageKey;
};

function SheetEmbeddedItemsList({
    items,
    fields,
    compactSummaryField,
    compactSummaryFields,
    compactSummaryJoinSeparator = " · ",
    displayMode = "cards",
    cardColumns,
    pageSize,
    listClassName,
    className,
    sortField,
    sortDescending = true,
    resolveLanguageKey,
    sheetLanguageKey,
}: SheetEmbeddedItemsListProps) {
    const resolveSheet = sheetLanguageKey ?? resolveLanguageKey;
    const viewModeCtx = useReferencesViewModeOptional();

    const summaryFieldNames = useMemo(() => {
        if (compactSummaryFields?.length) return compactSummaryFields;
        const single = compactSummaryField ?? fields[0]?.name ?? "notes";
        return [single];
    }, [compactSummaryFields, compactSummaryField, fields]);

    const preparedItems = useMemo(
        () => sortItems(items, sortField, sortDescending),
        [items, sortField, sortDescending],
    );

    const visibleItems = useMemo(
        () => preparedItems.filter((item) => itemHasVisibleContent(item, fields, summaryFieldNames)),
        [preparedItems, fields, summaryFieldNames],
    );

    const pagination = useSheetListPagination(visibleItems, pageSize);

    useEffect(() => {
        viewModeCtx?.reportItemCount(pagination.total);
    }, [pagination.total, viewModeCtx]);

    if (!Array.isArray(items) || items.length === 0 || pagination.total === 0) {
        return (
            <div className={cn("flex flex-col gap-y-2 p-4", className)}>
                <ValueNotSet />
            </div>
        );
    }

    const itemKey = (item: Record<string, any>, index: number) =>
        typeof item._id === "string" && item._id.length > 0 ? item._id : `embedded-item-${index}`;

    const fieldsLayoutClass = cardColumnsClass(cardColumns);
    const compactLeadField = fields.find((f) => f.name === summaryFieldNames[0]);
    const compactLeadIcon = compactLeadField?.icon
        ? resolveIcon(compactLeadField.icon) ?? undefined
        : undefined;

    const listBody =
        displayMode === "compact" ? (
            <div className={cn("flex flex-col", compactLeadIcon ? "gap-y-2" : "gap-y-0.5")}>
                {pagination.slice.map((item, i) => {
                    const parts = buildCompactSummaryParts(
                        item,
                        fields,
                        summaryFieldNames,
                        resolveSheet,
                    );
                    if (parts.length === 0) return null;
                    if (compactLeadIcon) {
                        const restText = parts
                            .slice(1)
                            .map((part) => part.text)
                            .join(compactSummaryJoinSeparator);
                        const href = parts.find((part) => part.href)?.href;
                        return (
                            <DisplayCard
                                key={itemKey(item, i)}
                                show
                                title={parts[0].text}
                                tooltip={parts[0].text}
                                Icon={compactLeadIcon}
                                value={restText || null}
                                dontRenderValue={!restText}
                                externalHref={href ?? undefined}
                            />
                        );
                    }
                    return (
                        <div key={itemKey(item, i)} className="flex items-start gap-2 rounded-lg px-3 py-1">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground line-clamp-2 min-w-0">
                                {parts.map((part, pi) => (
                                    <span key={pi}>
                                        {pi > 0 ? compactSummaryJoinSeparator : null}
                                        {part.href ? (
                                            <ExternalTextLink href={part.href} className="text-primary">
                                                {part.text}
                                            </ExternalTextLink>
                                        ) : (
                                            part.text
                                        )}
                                    </span>
                                ))}
                            </p>
                        </div>
                    );
                })}
            </div>
        ) : (
            <div className="flex flex-col gap-y-3">
                {pagination.slice.map((item, i) => {
                    const globalIndex =
                        pagination.pageSize < pagination.total
                            ? pagination.pageIndex * pagination.pageSize + i + 1
                            : i + 1;
                    const groupSnapshots = pagination.total > 1;
                    const headerParts = buildCompactSummaryParts(
                        item,
                        fields,
                        summaryFieldNames,
                        resolveSheet,
                    );
                    const headerText = headerParts.map((part) => part.text).join(compactSummaryJoinSeparator);
                    return (
                    <div
                        key={itemKey(item, i)}
                        className={cn(
                            "flex flex-col gap-y-2 min-w-0",
                            groupSnapshots && "rounded-lg border border-border/60 bg-card p-3",
                        )}
                    >
                        {groupSnapshots ? (
                            <div className="flex items-baseline justify-between gap-2 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate min-w-0">
                                    {headerText || `#${globalIndex}`}
                                </p>
                                {headerText ? (
                                    <span className="text-xs font-medium text-muted-foreground shrink-0">
                                        #{globalIndex}
                                    </span>
                                ) : null}
                            </div>
                        ) : null}
                        <div className={fieldsLayoutClass}>
                        {fields.map((f, fi) => {
                            if (f.type === "mediaStrip") {
                                return renderMediaStripField(item, f, resolveSheet, fi, cardColumns);
                            }
                            if (f.type === "linkedRef") {
                                return renderLinkedRefField(item, f, resolveSheet, fi, cardColumns);
                            }
                            return renderScalarEmbeddedField(item, f, resolveSheet, fi, cardColumns);
                        })}
                        </div>
                    </div>
                    );
                })}
            </div>
        );

    return (
        <div className={cn("flex flex-col gap-y-2 p-4", className)}>
            <div className={cn("flex flex-col gap-2 gap-y-2 max-h-[350px] overflow-y-auto", listClassName)}>{listBody}</div>
            <SheetListPaginationFooter
                rangeLabel={pagination.rangeLabel}
                pageIndex={pagination.pageIndex}
                totalPages={pagination.totalPages}
                onPrevious={() => pagination.setPageIndex((p) => Math.max(0, p - 1))}
                onNext={() => pagination.setPageIndex((p) => Math.min(pagination.totalPages - 1, p + 1))}
                resolveLanguageKey={resolveLanguageKey}
            />
        </div>
    );
}

export default compose(
    withLanguage("src/modules/core/components/viewEngine/sheet/widgets/embeddedItems/sheetEmbeddedItemsList.tsx"),
    withDebug(true, true),
)(SheetEmbeddedItemsList);
