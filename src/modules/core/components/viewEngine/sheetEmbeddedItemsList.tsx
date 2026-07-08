import { useEffect, useMemo } from "react";
import { compose } from "redux";
import type { Media } from "armonia/src/modules/core/types";
import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import withLanguage, { WithLanguageType } from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import ExpandableText from "@coreModule/components/custom/expandableText.tsx";
import SheetMediaFilesStrip from "./sheetMediaFilesStrip.tsx";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import { useReferencesViewModeOptional } from "./referencesViewModeContext.tsx";
import { SheetListPaginationFooter, useSheetListPagination } from "./sheetListPagination.tsx";
import { cn } from "@coreModule/components/lib/utils.ts";
import { format, isValid } from "date-fns";

function resolvePath(obj: Record<string, any>, path: string): any {
    return path.split(".").reduce<any>((acc, key) => acc?.[key], obj);
}

function formatTemporal(value: unknown, mode: "date" | "dateTime"): string | null {
    if (value == null || value === "") return null;
    const d =
        value instanceof Date
            ? value
            : typeof value === "string" || typeof value === "number"
              ? new Date(value)
              : null;
    if (!d || !isValid(d)) return String(value);
    return format(d, mode === "dateTime" ? "PPp" : "PP");
}

export type EmbeddedItemFieldConfig = {
    /** Dot-path within each item object (e.g. `"notes"`, `"media"`). */
    name: string;
    /** How to render this field's value. */
    type: "expandableText" | "text" | "mediaStrip";
    /** Extra Tailwind class applied to the rendered element. */
    className?: string;
    /** Sub-paths on `parent` (defaults to `name`) joined for display. */
    valuePath?: string[];
    /** Dot-path to the object that `valuePath` segments resolve on (defaults to `name`). */
    parent?: string;
    joinSeparator?: string;
    format?: "date" | "dateTime";
    languageKeyCategory?: string;
};

function resolveEmbeddedFieldText(
    item: Record<string, any>,
    field: EmbeddedItemFieldConfig,
    resolveLanguageKey: ResolveLanguageKey,
): string {
    let raw: unknown;

    if (field.valuePath?.length) {
        const parentPath = field.parent ?? field.name;
        const parent = resolvePath(item, parentPath);
        if (parent == null || typeof parent !== "object") return "";
        const parts = field.valuePath.map((p) => resolvePath(parent as Record<string, any>, p));
        raw = parts.filter((part) => part != null && part !== "").join(field.joinSeparator ?? " ");
    } else {
        raw = resolvePath(item, field.name);
    }

    if (field.languageKeyCategory && typeof raw === "string" && raw.trim()) {
        const key = `${field.languageKeyCategory}.${raw.trim()}`;
        const resolved = resolveLanguageKey(key);
        if (resolved !== key) raw = resolved;
    }

    if (field.format === "date" || field.format === "dateTime") {
        return formatTemporal(raw, field.format) ?? "";
    }

    return String(raw ?? "").trim();
}

function fieldHasValue(item: Record<string, any>, field: EmbeddedItemFieldConfig): boolean {
    if (field.type === "mediaStrip") {
        const v = resolvePath(item, field.name);
        return Array.isArray(v) && v.length > 0;
    }
    return resolveEmbeddedFieldText(item, field, (k) => k).length > 0;
}

function itemHasVisibleContent(
    item: Record<string, any>,
    fields: EmbeddedItemFieldConfig[],
    summaryFieldNames: string[],
): boolean {
    if (summaryFieldNames.length > 0) {
        return summaryFieldNames.some((name) => {
            const field = fields.find((f) => f.name === name);
            if (field) return fieldHasValue(item, field);
            return String(item[name] ?? "").trim().length > 0;
        });
    }
    return fields.some((f) => fieldHasValue(item, f));
}

function buildCompactSummary(
    item: Record<string, any>,
    fields: EmbeddedItemFieldConfig[],
    summaryFieldNames: string[],
    resolveLanguageKey: ResolveLanguageKey,
    joinSeparator: string,
): string {
    const parts = summaryFieldNames
        .map((name) => {
            const field = fields.find((f) => f.name === name);
            if (field) return resolveEmbeddedFieldText(item, field, resolveLanguageKey);
            return String(item[name] ?? "").trim();
        })
        .filter((part) => part.length > 0);
    return parts.join(joinSeparator);
}

function sortItems(
    items: Record<string, any>[],
    sortField?: string,
    sortDescending?: boolean,
): Record<string, any>[] {
    if (!sortField) return items;
    const sorted = [...items].sort((a, b) => {
        const av = resolvePath(a, sortField);
        const bv = resolvePath(b, sortField);
        const at = av != null ? new Date(av as string | number).getTime() : 0;
        const bt = bv != null ? new Date(bv as string | number).getTime() : 0;
        const aValid = Number.isFinite(at) ? at : 0;
        const bValid = Number.isFinite(bt) ? bt : 0;
        return sortDescending ? bValid - aValid : aValid - bValid;
    });
    return sorted;
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
    /** Items per page; omit to show all. */
    pageSize?: number;
    listClassName?: string;
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
    pageSize,
    listClassName,
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
        return <ValueNotSet />;
    }

    const itemKey = (item: Record<string, any>, index: number) =>
        typeof item._id === "string" && item._id.length > 0 ? item._id : `embedded-item-${index}`;

    const listBody =
        displayMode === "compact" ? (
            <div className="space-y-1">
                {pagination.slice.map((item, i) => {
                    const summary = buildCompactSummary(
                        item,
                        fields,
                        summaryFieldNames,
                        resolveSheet,
                        compactSummaryJoinSeparator,
                    );
                    if (!summary) return null;
                    return (
                        <div key={itemKey(item, i)} className="flex items-start gap-2 py-0.5">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground line-clamp-2 min-w-0">{summary}</p>
                        </div>
                    );
                })}
            </div>
        ) : (
            <div className="space-y-2">
                {pagination.slice.map((item, i) => {
                    const globalIndex =
                        pagination.pageSize < pagination.total
                            ? pagination.pageIndex * pagination.pageSize + i + 1
                            : i + 1;
                    return (
                    <div
                        key={itemKey(item, i)}
                        className="rounded-lg border border-border/60 bg-card p-3 space-y-2"
                    >
                        <span className="text-xs font-medium text-muted-foreground">#{globalIndex}</span>
                        {fields.map((f, fi) => {
                            if (f.type === "mediaStrip") {
                                const value = resolvePath(item, f.name);
                                if (!Array.isArray(value) || value.length === 0) return null;
                                return (
                                    <SheetMediaFilesStrip
                                        key={fi}
                                        media={value as Media[]}
                                        resolveLanguageKey={resolveSheet}
                                        canDownload
                                        canRemove={false}
                                        isBig={false}
                                        className={f.className}
                                    />
                                );
                            }
                            const text = resolveEmbeddedFieldText(item, f, resolveSheet);
                            if (!text) return null;
                            if (f.type === "expandableText") {
                                return (
                                    <ExpandableText key={fi} show className={f.className ?? "text-sm"}>
                                        {text}
                                    </ExpandableText>
                                );
                            }
                            return (
                                <p key={fi} className={f.className ?? "text-sm"}>
                                    {text}
                                </p>
                            );
                        })}
                    </div>
                    );
                })}
            </div>
        );

    return (
        <div className="space-y-2">
            <div className={cn("gap-2 space-y-2 max-h-[350px] overflow-y-auto", listClassName)}>{listBody}</div>
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
    withLanguage("src/modules/core/components/viewEngine/sheetPaginatedReferenceCardList.tsx"),
    withDebug(true, true),
)(SheetEmbeddedItemsList);
