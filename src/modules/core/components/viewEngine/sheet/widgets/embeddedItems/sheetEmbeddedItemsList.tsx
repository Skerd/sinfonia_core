import {useEffect, useMemo, type ComponentType, type ReactNode} from "react";
import {compose} from "redux";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import DisplayCard from "@coreModule/components/viewEngine/widgets/display/displayCard.tsx";
import TruncatedValue from "@coreModule/components/viewEngine/widgets/display/truncatedValue.tsx";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import {EntityCardShell} from "@coreModule/components/entityPage/list/card/entityCardShell.tsx";
import {EntityCardHeader} from "@coreModule/components/entityPage/list/card/entityCardHeader.tsx";
import {CARD_INFO_ROWS_CLASS} from "@coreModule/components/entityPage/list/entityCard.constants.ts";
import {Item, ItemMedia} from "@coreModule/components/ui/item.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {resolveIcon} from "../../../widgetRegistry.ts";
import {useReferencesViewModeOptional} from "../references/referencesViewModeContext.tsx";
import {SheetListPaginationFooter, useSheetListPagination} from "../sheetListPagination.tsx";
import {
    buildCompactSummaryParts,
    hrefForText,
    itemHasVisibleContent,
    resolveEmbeddedFieldText,
    sortItems,
    type EmbeddedItemFieldConfig,
} from "./fieldText.ts";
import {
    ExternalTextLink,
    renderEntityCardLinkedRefField,
    renderLinkedRefField,
    renderMediaStripField,
    renderScalarEmbeddedField,
} from "./fieldRenderers.tsx";

export type {EmbeddedItemFieldConfig} from "./fieldText.ts";

const CARD_CONTENT_CLASS =
    "flex w-full min-w-0 flex-col gap-(--density-pad) p-(--density-pad) [&>[data-slot=gallery-carousel]]:-mx-(--density-pad) [&>[data-slot=gallery-carousel]]:-mt-(--density-pad) [&>[data-slot=gallery-carousel]]:w-[calc(100%+2*var(--density-pad))]";

const MAX_ITEM_COLUMNS = 4;
const ITEM_CARD_MIN_WIDTH = "12rem";

function cardColumnsClass(columns: number | undefined): string {
    if (columns === 2) return "grid grid-cols-1 sm:grid-cols-2 gap-2";
    if (columns === 3) return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2";
    if (columns === 4) return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2";
    return "flex flex-col gap-2";
}

/** Cap at `columns`, but shrink when the list is narrow (same idea as `#ReferencesRender`). */
function itemCardGridStyle(columns: number): {gridTemplateColumns: string} {
    const n = Math.min(MAX_ITEM_COLUMNS, Math.max(1, columns));
    const gapCount = Math.max(0, n - 1);
    return {
        gridTemplateColumns: `repeat(auto-fill, minmax(max(${ITEM_CARD_MIN_WIDTH}, calc((100% - ${gapCount} * 0.5rem) / ${n})), 1fr))`,
    };
}

/** Same visual as `EntityCardRow`, without ACL/Redux — embedded items are already sheet-gated. */
function EmbeddedItemCardRow({
    icon: Icon,
    label,
    value,
    href,
}: {
    icon?: ComponentType<{size?: number | string; className?: string}>;
    label: string;
    value: string;
    href?: string | null;
}) {
    return (
        <Item
            size="xs"
            role="listitem"
            className="w-fit max-w-full min-w-0 flex-nowrap gap-1 border-0 p-0 text-muted-foreground"
        >
            {Icon ? (
                <ItemMedia variant="icon">
                    <Icon size={18} />
                </ItemMedia>
            ) : null}
            <span className="shrink-0 text-sm font-medium">{label}:</span>
            <div className="min-w-0 hover:cursor-default text-sm text-foreground">
                <TruncatedValue text={value}>
                    {href ? (
                        <ExternalTextLink href={href} className="text-primary">
                            {value}
                        </ExternalTextLink>
                    ) : (
                        value
                    )}
                </TruncatedValue>
            </div>
        </Item>
    );
}

function renderEntityCardBodyField(
    item: Record<string, any>,
    field: EmbeddedItemFieldConfig,
    resolveSheet: ResolveLanguageKey,
    key: string | number,
): ReactNode {
    if (field.type === "mediaStrip") {
        return renderMediaStripField(item, field, resolveSheet, key, undefined);
    }
    if (field.type === "linkedRef") {
        return renderEntityCardLinkedRefField(item, field, resolveSheet, key);
    }

    const text = resolveEmbeddedFieldText(item, field, resolveSheet);
    if (!text) return null;

    const label =
        typeof field.labelKey === "string" && field.labelKey.length > 0
            ? String(resolveSheet(field.labelKey))
            : null;
    const Icon = field.icon ? resolveIcon(field.icon) ?? undefined : undefined;
    const href = hrefForText(text, field.type === "url");

    if (label) {
        return (
            <EmbeddedItemCardRow key={key} icon={Icon} label={label} value={text} href={href} />
        );
    }

    return renderScalarEmbeddedField(item, field, resolveSheet, key, undefined);
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
    /** Card-mode field grid columns (e.g. `3` → three fields per row as `#DisplayCard` tiles). */
    cardColumns?: number;
    /**
     * Opt-in StateCard-style item cards (title + icon rows in `EntityCardShell`).
     * Default stays the legacy stacked/tile cards layout.
     */
    entityCards?: boolean;
    /**
     * Cards-mode item grid columns (same auto-fill behavior as `#ReferencesRender` `columns`).
     * Only applies when `entityCards` is on.
     */
    columns?: number;
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
    entityCards = false,
    columns,
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

    const useEntityCards = displayMode === "cards" && entityCards;

    if (!Array.isArray(items) || items.length === 0 || pagination.total === 0) {
        return (
            <div className={cn("flex flex-col gap-y-2", useEntityCards ? "p-2" : "p-4", className)}>
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
    const titleFieldName = summaryFieldNames[0];
    const itemColumns =
        columns != null ? Math.min(MAX_ITEM_COLUMNS, Math.max(1, Math.floor(columns))) : undefined;

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
        ) : useEntityCards ? (
            <div
                className={cn("gap-2", itemColumns ? "grid" : "flex flex-col")}
                style={itemColumns ? itemCardGridStyle(itemColumns) : undefined}
            >
                {pagination.slice.map((item, i) => {
                    const globalIndex =
                        pagination.pageSize < pagination.total
                            ? pagination.pageIndex * pagination.pageSize + i + 1
                            : i + 1;
                    const titleParts = buildCompactSummaryParts(
                        item,
                        fields,
                        [titleFieldName],
                        resolveSheet,
                    );
                    const titleText = titleParts[0]?.text || `#${globalIndex}`;
                    const bodyFields = fields.filter((f) => f.name !== titleFieldName);
                    return (
                        <EntityCardShell key={itemKey(item, i)} disableClick>
                            <div className="flex w-full items-stretch">
                                <div className={CARD_CONTENT_CLASS}>
                                    <EntityCardHeader title={titleText} hideActions />
                                    <div className={CARD_INFO_ROWS_CLASS} role="list">
                                        {bodyFields.map((f, fi) =>
                                            renderEntityCardBodyField(item, f, resolveSheet, fi),
                                        )}
                                    </div>
                                </div>
                            </div>
                        </EntityCardShell>
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
        <div className={cn("flex flex-col gap-y-2", useEntityCards ? "p-2" : "p-4", className)}>
            <div
                className={cn(
                    "max-h-[350px] overflow-y-auto",
                    useEntityCards ? undefined : "flex flex-col gap-2 gap-y-2",
                    listClassName,
                )}
            >
                {listBody}
            </div>
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
