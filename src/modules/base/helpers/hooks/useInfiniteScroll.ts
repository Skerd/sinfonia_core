import {useCallback, useEffect, useRef, useState} from "react";

/**
 * Generic shape expected from offset-based list endpoints.
 *
 * `data` should contain only the current chunk for the requested offset.
 * `total` should represent the full dataset size on the server side.
 */
export type PaginatedResponse<T> = {
    data: T[];
    total: number;
    [key: string]: any;
};

export type UseInfiniteScrollOptions<T> = {
    /** Latest response. Every response must be a new object (as `useHttpRequest` provides). */
    data: PaginatedResponse<T> | null | undefined;
    /** Loading state of the request. */
    loading: boolean;
    /** Called with `{offset, limit}` whenever a chunk is needed. */
    onFilterChange: (filter: {offset: number; limit: number; [key: string]: any}) => void;
    /** Chunk size per request. Default `10`. */
    limit?: number;
    /** When changed, refetches the current offset and merges the result into the accumulated items. */
    forceReload?: number;
    /** Stable unique id per item, used to merge chunks. Default: `_id`, else the item itself. */
    getId?: (item: T) => string | number;
    /** Whether to request and accept data. Default `true`. */
    enabled?: boolean;
};

export type UseInfiniteScrollReturn<T> = {
    /** Items accumulated across all loaded chunks. */
    accumulatedItems: T[];
    /** Offset of the latest requested chunk. */
    offset: number;
    /** `total` from the latest response. */
    total: number;
    /** More chunks exist beyond the current offset. */
    hasMoreData: boolean;
    /** `loadMore()` would request something: the current chunk has arrived, nothing is loading, more remain. */
    canLoadMore: boolean;
    /** Requests the next chunk. Does nothing unless `canLoadMore`; repeated calls before a re-render load one chunk. */
    loadMore: () => void;
    /** Clears items and refetches from offset `0`. */
    handleReset: () => void;
};

type ItemKey = (item: any) => unknown;

const defaultKey: ItemKey = (item: {_id?: string | number}) => item._id ?? item;

/** Replaces items whose key already exists (fresh content) and appends the rest, keeping order. */
function mergeByKey<T>(previous: T[], chunk: T[], keyOf: ItemKey): T[] {
    const indexByKey = new Map(previous.map((item, index) => [keyOf(item), index]));
    const next = [...previous];
    for (const item of chunk) {
        const key = keyOf(item);
        const index = indexByKey.get(key);
        if (index === undefined) {
            indexByKey.set(key, next.length);
            next.push(item);
        } else {
            next[index] = item;
        }
    }
    return next;
}

/**
 * Offset-based infinite scroll state.
 *
 * - Requests `{offset: 0, limit}` on mount (when enabled), and again on `forceReload` or `handleReset`.
 * - Merges only responses that arrive after the latest request: offset `0` replaces the list,
 *   later offsets merge by id (updating existing items, appending new ones).
 * - `loadMore()` advances by `limit`, guarded by `canLoadMore` so a visible sentinel cannot skip chunks.
 *
 * @example
 * ```tsx
 * const {accumulatedItems, hasMoreData, canLoadMore, loadMore} = useInfiniteScroll({data, loading, onFilterChange, limit: 20});
 * {hasMoreData && <LoadMoreSentinel canLoadMore={canLoadMore} onLoadMore={loadMore} />}
 * ```
 */
export function useInfiniteScroll<T extends {_id?: string | number}>(
    options: UseInfiniteScrollOptions<T>,
): UseInfiniteScrollReturn<T> {
    const {data, loading, onFilterChange, limit = 10, forceReload, getId, enabled = true} = options;

    const [offset, setOffset] = useState(0);
    const [total, setTotal] = useState(0);
    const [accumulatedItems, setAccumulatedItems] = useState<T[]>([]);
    /** Offset whose response has been merged; `null` while the current offset's response is pending. */
    const [loadedOffset, setLoadedOffset] = useState<number | null>(null);
    /** Bumped by `handleReset` so a reset refetches even when offset and `forceReload` are unchanged. */
    const [resetCount, setResetCount] = useState(0);

    const hasMoreData = offset + limit < total;
    const canLoadMore = enabled && !loading && loadedOffset === offset && hasMoreData;

    const latestRef = useRef({onFilterChange, getId, data, offset, limit, canLoadMore});
    latestRef.current = {onFilterChange, getId, data, offset, limit, canLoadMore};

    const requestKeyRef = useRef<string | null>(null);
    const requestedOffsetRef = useRef<number | null>(null);
    /** `data` as it was when the latest request was sent — never merged, it answers an older request. */
    const staleDataRef = useRef<unknown>(undefined);
    const mergedDataRef = useRef<unknown>(undefined);

    useEffect(() => {
        if (!enabled) return;
        const requestKey = `${offset}|${forceReload ?? ""}|${resetCount}`;
        if (requestKeyRef.current === requestKey) return;

        requestKeyRef.current = requestKey;
        requestedOffsetRef.current = offset;
        staleDataRef.current = latestRef.current.data;
        setLoadedOffset(null);
        latestRef.current.onFilterChange({offset, limit: latestRef.current.limit});
    }, [offset, forceReload, resetCount, enabled]);

    useEffect(() => {
        if (!enabled || !data || data === staleDataRef.current || data === mergedDataRef.current) return;
        if (requestedOffsetRef.current !== offset) return;

        mergedDataRef.current = data;
        const chunk = data.data ?? [];
        const keyOf: ItemKey = latestRef.current.getId ?? defaultKey;
        setAccumulatedItems((previous) => (offset === 0 ? chunk : mergeByKey(previous, chunk, keyOf)));
        setTotal(data.total);
        setLoadedOffset(offset);
    }, [data, offset, enabled]);

    const loadMore = useCallback(() => {
        const {offset: from, limit: step, canLoadMore: allowed} = latestRef.current;
        if (!allowed) return;
        setOffset((current) => (current === from ? from + step : current));
    }, []);

    const handleReset = useCallback(() => {
        setOffset(0);
        setAccumulatedItems([]);
        setTotal(0);
        setLoadedOffset(null);
        setResetCount((count) => count + 1);
        requestedOffsetRef.current = null;
    }, []);

    return {accumulatedItems, offset, total, hasMoreData, canLoadMore, loadMore, handleReset};
}
