import { compose } from "redux";
import { createElement, useEffect, type ComponentType } from "react";
import { useReferencesViewModeOptional } from "./referencesViewModeContext.tsx";
import withLanguage, { WithLanguageType, type ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import { cn } from "@coreModule/components/lib/utils.ts";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import { ReferenceStubCompactRow } from "./referenceStubCompactRow.tsx";
import type { ReferenceCompactRowConfig } from "./referenceStubCompactRow.tsx";
import { SheetListPaginationFooter, useSheetListPagination } from "./sheetListPagination.tsx";

export type ReferenceStub = { _id: string; name?: string };

export type SheetPaginatedReferenceCardListProps = WithLanguageType & {
    Card: ComponentType<any>;
    itemDataProp: string;
    items: ReferenceStub[];
    unitId: string;
    unitName: string;
    /** Items per page; defaults to 3. */
    pageSize?: number;
    hideActions?: boolean;
    listClassName?: string;
    /** Shallow-merged into each card instance (e.g. `sheetOnly`). */
    cardProps?: Record<string, unknown>;
    /** When `compact` and `compactRow` are set, renders `#SmallInfoCard`-style rows instead of cards. */
    displayMode?: "compact" | "cards";
    compactRow?: ReferenceCompactRowConfig;
    /** Mirrors `#ReferencesRender` read gate for compact rows. */
    show?: boolean;
    /** Host sheet translations for compact row titles/labels; `withLanguage` on this module only supplies pagination strings. */
    sheetLanguageKey?: ResolveLanguageKey;
};

const DEFAULT_PAGE_SIZE = 3;

function SheetPaginatedReferenceCardList({
    Card,
    itemDataProp,
    items,
    unitId,
    unitName,
    pageSize: pageSizeProp = DEFAULT_PAGE_SIZE,
    hideActions = false,
    listClassName,
    cardProps,
    displayMode = "cards",
    compactRow,
    show = true,
    resolveLanguageKey,
    sheetLanguageKey,
}: SheetPaginatedReferenceCardListProps) {
    const resolveCompactRow = sheetLanguageKey ?? resolveLanguageKey;
    const pageSize = Math.max(1, pageSizeProp);
    const total = items.length;

    const viewModeCtx = useReferencesViewModeOptional();
    useEffect(() => {
        viewModeCtx?.reportItemCount(total);
    }, [total, viewModeCtx]);

    const pagination = useSheetListPagination(items, pageSize);

    if (!total) {
        return <ValueNotSet />;
    }

    const shared = {
        unitId,
        unitName,
        hideActions,
        small: true,
        ...cardProps,
    };

    const useCompact = displayMode === "compact" && compactRow != null;
    const slice = pagination.slice as ReferenceStub[];

    return (
        <div className="space-y-2">
            <div
                className={cn(
                    "gap-2 space-y-2 max-h-[350px] overflow-y-auto",
                    listClassName,
                )}
            >
                {useCompact
                    ? slice.map((stub) => (
                          <ReferenceStubCompactRow
                              key={stub._id}
                              stub={stub as Record<string, any>}
                              config={compactRow!}
                              unitId={unitId}
                              unitName={unitName}
                              resolveLanguageKey={resolveCompactRow}
                              show={show}
                          />
                      ))
                    : slice.map((stub) =>
                          createElement(Card, {
                              key: stub._id,
                              ...shared,
                              [itemDataProp]: stub,
                              fetchId: stub._id,
                          }),
                      )}
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
    withLanguage("src/modules/core/components/viewEngine/sheetPaginatedReferenceCardList.tsx"),
    withDebug(true, true),
)(SheetPaginatedReferenceCardList);
