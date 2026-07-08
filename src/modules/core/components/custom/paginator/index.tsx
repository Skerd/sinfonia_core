import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import LimitUpdater from "@coreModule/components/custom/paginator/limitUpdater.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
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

    return (
        <div className="flex items-center">
            <p className="text-xs text-muted-foreground mr-2 flex items-center gap-1 text-nowrap">
                <div>
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
                </div>
               {" / "}{total}
                {/*({offset})({limit})*/}
            </p>
            <TooltipDisplayer tooltip={resolveLanguageKey("previousPage")}>
                <Button
                    size="icon-sm"
                    variant="ghost"
                    type="button"
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
            <TooltipDisplayer tooltip={resolveLanguageKey("nextPage")}>
                <Button
                    size="icon-sm"
                    type="button"
                    variant="ghost"
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
        </div>
    )
}


export default compose(
    withLanguage("src/modules/core/components/custom/paginator/index.tsx")
)(Paginator)