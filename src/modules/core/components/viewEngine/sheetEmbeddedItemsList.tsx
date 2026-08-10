import { useEffect, useMemo, createElement, type ComponentType } from "react";
import { compose } from "redux";
import type { Media } from "armonia/src/modules/core/types";
import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import withLanguage, { WithLanguageType } from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import ExpandableText from "@coreModule/components/custom/expandableText.tsx";
import SmallInfoCard, {
    type SmallInfoCardLinkedSheetOuterProps,
} from "@coreModule/components/custom/smallInfoCard.tsx";
import SheetMediaFilesStrip from "./sheetMediaFilesStrip.tsx";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import { useReferencesViewModeOptional } from "./referencesViewModeContext.tsx";
import { SheetListPaginationFooter, useSheetListPagination } from "./sheetListPagination.tsx";
import { cn } from "@coreModule/components/lib/utils.ts";
import { format, isValid } from "date-fns";
import { resolveIcon, resolveWidget } from "./widgetRegistry.ts";

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
    type: "expandableText" | "text" | "mediaStrip" | "linkedRef";
    /** Extra Tailwind class applied to the rendered element. */
    className?: string;
    /** Sub-paths on `parent` (defaults to `name`) joined for display. */
    valuePath?: string[];
    /** Dot-path to the object that `valuePath` segments resolve on (defaults to `name`). */
    parent?: string;
    joinSeparator?: string;
    format?: "date" | "dateTime";
    languageKeyCategory?: string;
    /** Optional sheet language key prefixed before the value (e.g. `"Price: 5"`). */
    labelKey?: string;
    /**
     * Dot-path to a currency object on the item (`{symbol?, abbreviation?}`).
     * When set, the field value is shown as e.g. `€12.5` / `12.5 EUR`.
     */
    currencyField?: string;
    /** Linked-sheet wiring when `type` is `"linkedRef"`. */
    linkedSheetModel?: string;
    linkedSheetWidget?: string;
    linkedSheetEntityProp?: string;
    icon?: string;
};

function cardColumnsClass(columns: number | undefined): string {
    if (columns === 2) return "grid grid-cols-2 gap-2";
    if (columns === 3) return "grid grid-cols-3 gap-2";
    if (columns === 4) return "grid grid-cols-4 gap-2";
    return "flex flex-col gap-2";
}

function formatAmountWithCurrency(amountText: string, currency: unknown): string {
    const amount = amountText.trim();
    if (!amount) return "";
    if (!currency || typeof currency !== "object") return amount;
    const c = currency as {symbol?: unknown; abbreviation?: unknown};
    const symbol = typeof c.symbol === "string" ? c.symbol.trim() : "";
    const abbreviation = typeof c.abbreviation === "string" ? c.abbreviation.trim() : "";
    if (symbol) return `${symbol}${amount}`;
    if (abbreviation) return `${amount} ${abbreviation}`;
    return amount;
}

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

    if (field.languageKeyCategory && typeof raw === "boolean") {
        raw = resolveLanguageKey(`${field.languageKeyCategory}.${raw ? "true" : "false"}`);
    } else if (
        field.languageKeyCategory &&
        (typeof raw === "string" || typeof raw === "number") &&
        String(raw).trim()
    ) {
        const key = `${field.languageKeyCategory}.${String(raw).trim()}`;
        const resolved = resolveLanguageKey(key);
        if (resolved !== key) raw = resolved;
    }

    if (field.format === "date" || field.format === "dateTime") {
        return formatTemporal(raw, field.format) ?? "";
    }

    const text = String(raw ?? "").trim();
    if (field.currencyField) {
        return formatAmountWithCurrency(text, resolvePath(item, field.currencyField));
    }
    return text;
}

function resolveLinkedRefStub(item: Record<string, any>, field: EmbeddedItemFieldConfig): Record<string, any> | null {
    const raw = resolvePath(item, field.parent ?? field.name);
    if (raw == null) return null;
    if (typeof raw === "string" && raw.length > 0) return {_id: raw};
    if (typeof raw === "object" && !Array.isArray(raw)) {
        const id = (raw as {_id?: unknown})._id;
        if (typeof id === "string" && id.length > 0) return raw as Record<string, any>;
    }
    return null;
}

function fieldHasValue(item: Record<string, any>, field: EmbeddedItemFieldConfig): boolean {
    if (field.type === "mediaStrip") {
        const v = resolvePath(item, field.name);
        if (Array.isArray(v)) return v.length > 0;
        return v != null && typeof v === "object";
    }
    if (field.type === "linkedRef") {
        return resolveLinkedRefStub(item, field) != null;
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

function renderLinkedRefField(
    item: Record<string, any>,
    field: EmbeddedItemFieldConfig,
    resolveSheet: ResolveLanguageKey,
    key: string | number,
) {
    const stub = resolveLinkedRefStub(item, field);
    if (!stub) return null;
    const id = stub._id as string;
    const LinkedWidget =
        typeof field.linkedSheetWidget === "string" && field.linkedSheetWidget.startsWith("#")
            ? (resolveWidget(field.linkedSheetWidget) as ComponentType<any> | null)
            : null;
    const model = typeof field.linkedSheetModel === "string" ? field.linkedSheetModel : "";
    const entityProp =
        typeof field.linkedSheetEntityProp === "string" && field.linkedSheetEntityProp.length > 0
            ? field.linkedSheetEntityProp
            : "entity";

    const display =
        field.valuePath?.length
            ? resolveEmbeddedFieldText(item, field, resolveSheet)
            : typeof stub.name === "string"
              ? stub.name
              : typeof stub.title === "string"
                ? stub.title
                : id;

    const label =
        typeof field.labelKey === "string" && field.labelKey.length > 0
            ? resolveSheet(field.labelKey)
            : null;
    const Icon = field.icon ? resolveIcon(field.icon) : undefined;

    let linkedReferenceSheet:
        | {resourceId: string; LinkedSheet: ComponentType<SmallInfoCardLinkedSheetOuterProps>}
        | undefined;

    if (LinkedWidget && model && id) {
        const bootstrap =
            stub && typeof stub === "object" && Object.keys(stub).length > 1
                ? {...stub}
                : {_id: id, ...(display ? {title: display, name: display} : {})};
        const Bound: ComponentType<SmallInfoCardLinkedSheetOuterProps> = (sheetProps) => {
            const {onLinkedDeleted: _omit, ...rest} = sheetProps;
            const sheetPropsOut: Record<string, unknown> = {
                ...rest,
                fetchId: id,
            };
            sheetPropsOut[entityProp] = bootstrap;
            return createElement(LinkedWidget, sheetPropsOut);
        };
        linkedReferenceSheet = {resourceId: model, LinkedSheet: Bound};
    }

    return (
        <SmallInfoCard
            key={key}
            show
            title={label ? String(label) : display}
            tooltip={label ? String(label) : display}
            Icon={Icon ?? undefined}
            value={label ? display : null}
            dontRenderValue={!label}
            linkedReferenceSheet={linkedReferenceSheet}
        />
    );
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

    const fieldsLayoutClass = cardColumnsClass(cardColumns);

    const listBody =
        displayMode === "compact" ? (
            <div className="flex flex-col gap-y-1">
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
            <div className="flex flex-col gap-y-2">
                {pagination.slice.map((item, i) => {
                    const globalIndex =
                        pagination.pageSize < pagination.total
                            ? pagination.pageIndex * pagination.pageSize + i + 1
                            : i + 1;
                    return (
                    <div
                        key={itemKey(item, i)}
                        className="flex flex-col rounded-lg border border-border/60 bg-card p-3 gap-y-2"
                    >
                        <span className="text-xs font-medium text-muted-foreground">#{globalIndex}</span>
                        <div className={fieldsLayoutClass}>
                        {fields.map((f, fi) => {
                            if (f.type === "mediaStrip") {
                                const value = resolvePath(item, f.name);
                                const mediaList = Array.isArray(value)
                                    ? value
                                    : value != null && typeof value === "object"
                                      ? [value]
                                      : [];
                                if (mediaList.length === 0) return null;
                                const label =
                                    typeof f.labelKey === "string" && f.labelKey.length > 0
                                        ? resolveSheet(f.labelKey)
                                        : null;
                                return (
                                    <div
                                        key={fi}
                                        className={cn(
                                            "flex flex-col gap-1",
                                            cardColumns ? "col-span-full" : undefined,
                                        )}
                                    >
                                        {label ? (
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {label}
                                            </span>
                                        ) : null}
                                        <SheetMediaFilesStrip
                                            media={mediaList as Media[]}
                                            resolveLanguageKey={resolveSheet}
                                            canDownload
                                            canRemove={false}
                                            isBig={false}
                                            className={f.className}
                                        />
                                    </div>
                                );
                            }
                            if (f.type === "linkedRef") {
                                return (
                                    <div key={fi} className={cardColumns ? "col-span-full" : undefined}>
                                        {renderLinkedRefField(item, f, resolveSheet, fi)}
                                    </div>
                                );
                            }
                            const text = resolveEmbeddedFieldText(item, f, resolveSheet);
                            if (!text) return null;
                            const label =
                                typeof f.labelKey === "string" && f.labelKey.length > 0
                                    ? resolveSheet(f.labelKey)
                                    : null;
                            const display = label ? `${label}: ${text}` : text;
                            if (f.type === "expandableText") {
                                return (
                                    <div key={fi} className={cardColumns ? "col-span-full" : undefined}>
                                        <ExpandableText show className={f.className ?? "text-sm"}>
                                            {display}
                                        </ExpandableText>
                                    </div>
                                );
                            }
                            return (
                                <p key={fi} className={f.className ?? "text-sm"}>
                                    {display}
                                </p>
                            );
                        })}
                        </div>
                    </div>
                    );
                })}
            </div>
        );

    return (
        <div className="flex flex-col gap-y-2">
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
    withLanguage("src/modules/core/components/viewEngine/sheetEmbeddedItemsList.tsx"),
    withDebug(true, true),
)(SheetEmbeddedItemsList);
