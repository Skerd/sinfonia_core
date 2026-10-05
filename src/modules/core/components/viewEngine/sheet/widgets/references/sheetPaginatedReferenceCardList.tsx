import { compose } from "redux";
import { createElement, Suspense, useEffect, type ComponentType } from "react";
import { useReferencesViewModeOptional } from "./referencesViewModeContext.tsx";
import withLanguage, { WithLanguageType, type ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import { cn } from "@coreModule/components/lib/utils.ts";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import { ReferenceStubCompactRow } from "./referenceStubCompactRow.tsx";
import type { ReferenceCompactRowConfig } from "./referenceStubCompactRow.tsx";
import { SheetListPaginationFooter, useSheetListPagination } from "../sheetListPagination.tsx";

export type ReferenceStub = { _id: string; name?: string };

export type SheetPaginatedReferenceCardListProps = WithLanguageType & {
    Card: ComponentType<any>;
    itemDataProp: string;
    items: ReferenceStub[];
    unitId: string;
    unitName: string;
    /** Items per page; defaults to 3. */
    pageSize?: number;
    /**
     * Cards-mode only: max cards per row (1–4). Compact mode stays a single column.
     * Defaults to 3. Layout is responsive (1 → 2 → up to `columns`).
     */
    columns?: number;
    hideActions?: boolean;
    listClassName?: string;
    /** Shallow-merged into each card instance (e.g. `sheetOnly`). */
    cardProps?: Record<string, unknown>;
    /** When `compact` and `compactRow` are set, renders `#DisplayCard`-style rows instead of cards. */
    displayMode?: "compact" | "cards";
    compactRow?: ReferenceCompactRowConfig;
    /** Mirrors `#ReferencesRender` read gate for compact rows. */
    show?: boolean;
    /** Host sheet translations for compact row titles/labels; `withLanguage` on this module only supplies pagination strings. */
    sheetLanguageKey?: ResolveLanguageKey;
};

const DEFAULT_PAGE_SIZE = 3;
export const DEFAULT_REFERENCE_CARD_COLUMNS = 3;
const MAX_CARD_COLUMNS = 4;
/** Min card width before the grid drops a column (sheet-width friendly). */
const CARD_MIN_WIDTH = "12rem";

/** Cap at `columns`, but shrink to fewer when the list is narrow (phone / side sheet). */
function cardGridStyle(columns: number): {gridTemplateColumns: string} {
    const n = Math.min(MAX_CARD_COLUMNS, Math.max(1, columns));
    const gapCount = Math.max(0, n - 1);
    return {
        gridTemplateColumns: `repeat(auto-fill, minmax(max(${CARD_MIN_WIDTH}, calc((100% - ${gapCount} * 0.5rem) / ${n})), 1fr))`,
    };
}

function SheetPaginatedReferenceCardList({
    Card,
    itemDataProp,
    items,
    unitId,
    unitName,
    pageSize: pageSizeProp = DEFAULT_PAGE_SIZE,
    columns: columnsProp,
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
        return (
            <div className="p-4">
                <ValueNotSet />
            </div>
        );
    }

    const shared = {
        unitId,
        unitName,
        hideActions,
        small: true,
        ...cardProps,
    };

    const useCompact = displayMode === "compact" && compactRow != null;
    const cardColumns = Math.min(
        MAX_CARD_COLUMNS,
        Math.max(1, Math.floor(columnsProp ?? DEFAULT_REFERENCE_CARD_COLUMNS)),
    );
    const slice = pagination.slice as ReferenceStub[];

    return (
        <div className="flex flex-col gap-y-2">
            <div
                className={cn(
                    "gap-2 p-2",
                    useCompact
                        ? "flex flex-col max-h-[350px] overflow-y-auto"
                        : "grid",
                    listClassName,
                )}
                style={useCompact ? undefined : cardGridStyle(cardColumns)}
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
                    : slice.map((stub) => (
                          // Contribution cards are `lazy()` — without a local Suspense, suspension
                          // bubbles to the app-root Loader and remounts the whole panel (looks like a refresh).
                          <Suspense key={stub._id} fallback={null}>
                              {createElement(Card, {
                                  ...shared,
                                  [itemDataProp]: stub,
                                  fetchId: stub._id,
                              })}
                          </Suspense>
                      ))}
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
    withLanguage("src/modules/core/components/viewEngine/sheet/widgets/references/sheetPaginatedReferenceCardList.tsx"),
    withDebug(true, true),
)(SheetPaginatedReferenceCardList);
