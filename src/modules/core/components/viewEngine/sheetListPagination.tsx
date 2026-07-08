import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@coreModule/components/ui/button.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";

export type SheetListPaginationState = {
    slice: Record<string, any>[];
    rangeLabel: string;
    pageIndex: number;
    setPageIndex: (updater: (prev: number) => number) => void;
    totalPages: number;
    total: number;
    pageSize: number;
};

export function useSheetListPagination<T extends Record<string, any>>(
    items: T[],
    pageSizeProp?: number,
): SheetListPaginationState {
    const pageSize =
        pageSizeProp != null && Number.isFinite(pageSizeProp) && pageSizeProp >= 1
            ? Math.floor(pageSizeProp)
            : items.length;
    const total = items.length;
    const totalPages = total === 0 ? 0 : pageSize >= total ? 1 : Math.ceil(total / pageSize);

    const [pageIndex, setPageIndex] = useState(0);

    useEffect(() => {
        if (totalPages === 0) {
            setPageIndex(0);
            return;
        }
        if (pageIndex > totalPages - 1) {
            setPageIndex(totalPages - 1);
        }
    }, [totalPages, pageIndex]);

    const { slice, rangeLabel } = useMemo(() => {
        if (total === 0) {
            return { slice: [] as T[], rangeLabel: "" };
        }
        if (pageSize >= total) {
            return { slice: items, rangeLabel: total === 1 ? "1 / 1" : `1–${total} / ${total}` };
        }
        const start = pageIndex * pageSize;
        const end = Math.min(start + pageSize, total);
        return {
            slice: items.slice(start, end),
            rangeLabel: `${start + 1}–${end} / ${total}`,
        };
    }, [items, pageIndex, pageSize, total]);

    return {
        slice,
        rangeLabel,
        pageIndex,
        setPageIndex,
        totalPages,
        total,
        pageSize,
    };
}

export function SheetListPaginationFooter({
    rangeLabel,
    pageIndex,
    totalPages,
    onPrevious,
    onNext,
    resolveLanguageKey,
}: {
    rangeLabel: string;
    pageIndex: number;
    totalPages: number;
    onPrevious: () => void;
    onNext: () => void;
    resolveLanguageKey: ResolveLanguageKey;
}) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between gap-2 pt-1">
            <p className="text-xs text-muted-foreground tabular-nums">{rangeLabel}</p>
            <div className="flex items-center gap-0.5">
                <TooltipDisplayer tooltip={resolveLanguageKey("previousPage")}>
                    <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={String(resolveLanguageKey("previousPage"))}
                        disabled={pageIndex <= 0}
                        onClick={onPrevious}
                    >
                        <ChevronLeft />
                    </Button>
                </TooltipDisplayer>
                <TooltipDisplayer tooltip={resolveLanguageKey("nextPage")}>
                    <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={String(resolveLanguageKey("nextPage"))}
                        disabled={pageIndex >= totalPages - 1}
                        onClick={onNext}
                    >
                        <ChevronRight />
                    </Button>
                </TooltipDisplayer>
            </div>
        </div>
    );
}
