import { RefObject, useEffect, useRef } from "react";
import useIsInViewport from "@coreModule/helpers/hooks/useIsInViewPort.ts";

type PageIncrementerProps = {
    total: number;
    limit: number;
    page: number;
    setPage: (page: number) => void;
    scrollRoot: RefObject<HTMLElement | null>;
    ready: boolean;
};

/**
 * Sentinel that triggers loading the next page when it scrolls into view.
 * Resets guards when `page` returns to 1 (new search / reopened list) so pagination
 * is not blocked by stale refs from a previous session.
 */
function PageIncrementer({
    total,
    limit,
    page,
    setPage,
    scrollRoot,
    ready,
}: PageIncrementerProps) {
    const sentinelRef = useRef<HTMLDivElement>(null);
    const lastRequestedPageRef = useRef<number | null>(null);
    const inView = useIsInViewport(sentinelRef, scrollRoot);

    const canLoadMore = ready && page * limit < total;

    useEffect(() => {
        if (page === 1) {
            lastRequestedPageRef.current = null;
        }
    }, [page]);

    useEffect(() => {
        if (!inView || !canLoadMore) {
            if (!canLoadMore) {
                lastRequestedPageRef.current = null;
            }
            return;
        }
        if (lastRequestedPageRef.current === page) {
            return;
        }
        lastRequestedPageRef.current = page;
        setPage(page + 1);
    }, [inView, canLoadMore, page, setPage]);

    return <div ref={sentinelRef} aria-hidden style={{ minHeight: 1 }} />;
}

export default PageIncrementer;
