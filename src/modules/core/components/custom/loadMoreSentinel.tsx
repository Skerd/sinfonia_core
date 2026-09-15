import {type RefObject, useEffect, useRef} from "react";
import useIsInViewport from "@baseModule/helpers/hooks/useIsInViewport.ts";

type LoadMoreSentinelProps = {
    /** Whether a request may start now (not loading, more remain, current chunk arrived). */
    canLoadMore: boolean;
    /** Requests the next chunk/page. The latest function is always used. */
    onLoadMore: () => void;
    /** Scrollable container the sentinel lives in. Defaults to the viewport. */
    scrollRoot?: RefObject<HTMLElement | null>;
    /** Triggers before the sentinel is actually visible, e.g. `"200px"`. Default `"0px"`. */
    rootMargin?: string;
};

/**
 * Invisible marker placed after a list's last item: calls `onLoadMore` when it is in view and
 * `canLoadMore` is true. It fires once per transition into that state, so a sentinel that stays
 * visible keeps filling the list as each load finishes, without firing twice for one load.
 */
export default function LoadMoreSentinel({canLoadMore, onLoadMore, scrollRoot, rootMargin = "0px"}: LoadMoreSentinelProps) {
    const sentinelRef = useRef<HTMLDivElement>(null);
    const inView = useIsInViewport(sentinelRef, scrollRoot, {rootMargin});
    const onLoadMoreRef = useRef(onLoadMore);
    onLoadMoreRef.current = onLoadMore;

    useEffect(() => {
        if (inView && canLoadMore) onLoadMoreRef.current();
    }, [inView, canLoadMore]);

    return <div ref={sentinelRef} aria-hidden style={{minHeight: 1}}/>;
}
