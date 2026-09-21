import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import LimitUpdater from "@coreModule/components/custom/paginator/limitUpdater.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
} from "@coreModule/components/ui/pagination.tsx";
import {ChevronLeft, ChevronRight} from "lucide-react";
import {useEffect, useState} from "react";

type PaginatorProps = WithLanguageType & {
    total: number;
    limit?: number;
    loading: boolean;
    setOffset: (offset: number) => void;
    setLimit: (limit: number) => void;
}

function Paginator({
    total,
    loading,
    limit: propLimit = 20,
    setOffset: setPropOffset,
    setLimit: setPropLimit,
    resolveLanguageKey,
}: PaginatorProps) {

    const [start, setStart] = useState(1);
    const [end, setEnd] = useState(propLimit);
    const [offset, setOffset] = useState(start - 1);
    const [limit, setLimit] = useState(end - start + 1);

    useEffect(() => {
        setPropOffset?.(offset);
    }, [offset]);
    useEffect(() => {
        setPropLimit?.(limit);
    }, [limit]);

    // `total` is fetched data (see cardAndTableView.tsx: `total={data?.total ?? 0}`), so it can shrink
    // out from under the current start/end/offset when a filter narrows the result set — without this,
    // the paginator kept requesting an out-of-range offset and showed a stale "81-100 / 5" range.
    useEffect(() => {
        if (total <= 0) return;
        if (start > total) {
            const newEnd = Math.min(limit, total);
            setStart(1);
            setEnd(newEnd);
            setOffset(0);
        } else if (end > total) {
            setEnd(total);
        }
    }, [total]);

    // This control pages by offset/limit over an editable range rather than by
    // page number, so it borrows Pagination's nav/list semantics but keeps
    // buttons: the targets change state, they are not navigable links.
    return (
        <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent className="gap-0">
                <PaginationItem className="mr-2 flex items-center gap-1 text-nowrap text-xs text-muted-foreground">
                    <LimitUpdater
                        start={start}
                        end={end}
                        total={total}
                        onRangeChange={(newStart, newEnd) => {
                            setStart(newStart);
                            setEnd(newEnd);
                            setOffset(newStart - 1);
                            setLimit(newEnd - newStart + 1);
                        }}
                    />
                    <span>{" / "}{total}</span>
                </PaginationItem>
                <PaginationItem>
                    <TooltipDisplayer tooltip={resolveLanguageKey("previousPage")}>
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            type="button"
                            aria-label={resolveLanguageKey("previousPage")}
                            onClick={() => {
                                const rawOffset = offset - limit;
                                const newOffset =
                                    rawOffset < 0
                                        ? Math.max(0, total - limit)
                                        : rawOffset;
                                setStart(Math.max(1, newOffset + 1));
                                setEnd(Math.max(1, Math.min(newOffset + limit, total)));
                                setOffset(newOffset);
                            }}
                            disabled={total === 0 || loading}
                        >
                            <ChevronLeft />
                        </Button>
                    </TooltipDisplayer>
                </PaginationItem>
                <PaginationItem>
                    <TooltipDisplayer tooltip={resolveLanguageKey("nextPage")}>
                        <Button
                            size="icon-sm"
                            type="button"
                            variant="ghost"
                            aria-label={resolveLanguageKey("nextPage")}
                            onClick={() => {
                                const rawOffset = offset + limit;
                                const newOffset =
                                    rawOffset >= total && total > 0
                                        ? 0
                                        : rawOffset;
                                setStart(Math.max(1, newOffset + 1));
                                setEnd(Math.max(1, Math.min(newOffset + limit, total)));
                                setOffset(newOffset);
                            }}
                            disabled={total === 0 || loading}
                        >
                            <ChevronRight />
                        </Button>
                    </TooltipDisplayer>
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    )
}


export default withLanguage("src/modules/core/components/custom/paginator/index.tsx")(Paginator)
