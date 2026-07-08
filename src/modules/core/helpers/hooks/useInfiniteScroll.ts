import {useEffect, useRef, useState, useCallback} from "react";

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

/**
 * Configuration options for useInfiniteScroll hook.
 */
export type UseInfiniteScrollOptions<T> = {
    /** Current chunk data for the latest requested offset */
    data: PaginatedResponse<T> | null | undefined;
    /** Loading state from API */
    loading: boolean;
    /**
     * Callback invoked when the hook needs more data.
     * Receives an offset-based filter: `{ offset, limit, ...rest }`.
     */
    onFilterChange: (filter: {offset: number; limit: number; [key: string]: any}) => void;
    /** Chunk size per request (defaults to 10) */
    limit?: number;
    /**
     * When changed, refetches the current offset without resetting accumulated items.
     * Useful for retry/reload flows after mutations or transient errors.
     */
    forceReload?: number;
    /** Function to extract stable unique IDs used for deduplication (default: _id) */
    getId?: (item: T) => string | number;
    /** Whether to enable infinite scroll (default: true) */
    enabled?: boolean;
};

/**
 * Public state and actions exposed by useInfiniteScroll.
 */
export type UseInfiniteScrollReturn<T> = {
    /** Accumulated items across offsets */
    accumulatedItems: T[];
    /** Current request offset */
    offset: number;
    /** Total number of items */
    total: number;
    /** Whether there's more data to load */
    hasMoreData: boolean;
    /** Whether ready to load more (not loading and has more data) */
    isReady: boolean;
    /** Moves pagination cursor to a specific absolute offset */
    handleOffsetIncrement: (newOffset: number) => void;
    /** Resets cursor and internal tracking state back to first chunk */
    handleReset: () => void;
};

/**
 * Offset-based infinite scroll state manager.
 *
 * Behavior:
 * - Starts at `offset = 0`
 * - Calls `onFilterChange({ offset, limit })` when offset changes (or forceReload changes)
 * - Replaces items at offset `0`, appends items for `offset > 0`
 * - Deduplicates appended items by `getId`
 * - Exposes `hasMoreData` based on `accumulatedItems.length < total`
 *
 * @example
 * ```tsx
 * const [forceReload, setForceReload] = useState(0);
 * const {
 *   accumulatedItems,
 *   offset,
 *   total,
 *   hasMoreData,
 *   isReady,
 *   handleOffsetIncrement,
 *   handleReset
 * } = useInfiniteScroll({
 *   data: responseData,
 *   loading,
 *   onFilterChange,
 *   limit: 10,
 *   forceReload
 * });
 *
 * // Load next chunk
 * handleOffsetIncrement(offset + 10);
 *
 * // Refetch current chunk
 * setForceReload((n) => n + 1);
 * ```
 */
export function useInfiniteScroll<T extends {_id?: string | number}>(
    options: UseInfiniteScrollOptions<T>
): UseInfiniteScrollReturn<T> {
    const {
        data,
        loading,
        onFilterChange,
        limit = 10,
        forceReload,
        getId = (item: T) => item._id ?? String(item),
        enabled = true
    } = options;

    const [offset, setOffset] = useState<number>(0);
    const [total, setTotal] = useState<number>(0);
    const [accumulatedItems, setAccumulatedItems] = useState<T[]>([]);
    
    // Refs to prevent infinite loops and track state
    const onFilterChangeRef = useRef(onFilterChange);
    const getIdRef = useRef(getId);
    const lastFetchedOffsetRef = useRef<number | null>(null);
    const lastForceReloadRef = useRef<number | undefined>(undefined);
    const previousOffsetRef = useRef<number>(0);
    const processedOffsetsRef = useRef<Set<number>>(new Set());
    const lastDataSignatureRef = useRef<string>("");

    // Keep refs updated with latest functions (but don't trigger effects)
    useEffect(() => {
        onFilterChangeRef.current = onFilterChange;
        getIdRef.current = getId;
    }, [onFilterChange, getId]);

    // Reset accumulated data when offset resets to 0
    useEffect(() => {
        if (offset === 0 && previousOffsetRef.current !== 0) {
            setAccumulatedItems([]);
            lastFetchedOffsetRef.current = null;
            processedOffsetsRef.current.clear();
            lastDataSignatureRef.current = "";
        }
        previousOffsetRef.current = offset;
    }, [offset]);

    // Fetch data when offset or forceReload changes (when enabled)
    useEffect(() => {
        if (!enabled) return;
        const offsetChanged = offset !== lastFetchedOffsetRef.current;
        const forceReloadChanged = forceReload !== lastForceReloadRef.current;

        if (offsetChanged || forceReloadChanged) {
            if (forceReloadChanged) {
                processedOffsetsRef.current.delete(offset);
                lastDataSignatureRef.current = "";
            }
            onFilterChangeRef.current({
                offset,
                limit
            });
            lastFetchedOffsetRef.current = offset;
            lastForceReloadRef.current = forceReload;
        }
    }, [offset, forceReload, limit, enabled]);

    // Accumulate data when new data arrives
    useEffect(() => {
        if (!data || !enabled) return;

        // Only process if this offset was actually fetched
        if (lastFetchedOffsetRef.current !== offset) {
            return;
        }

        // Create a signature of the data to detect if content actually changed
        // Use first item ID, last item ID, length, and total to create a unique signature
        const dataArray = data.data || [];
        const firstId = dataArray.length > 0 ? getIdRef.current(dataArray[0]) : "";
        const lastId = dataArray.length > 0 ? getIdRef.current(dataArray[dataArray.length - 1]) : "";
        const dataSignature = `${offset}-${dataArray.length}-${data.total || 0}-${firstId}-${lastId}`;

        // Only process if this is actually new data (different signature)
        if (dataSignature === lastDataSignatureRef.current && processedOffsetsRef.current.has(offset)) {
            return;
        }

        if (offset === 0) {
            // First offset: replace all data
            setAccumulatedItems(dataArray);
            processedOffsetsRef.current.clear();
            processedOffsetsRef.current.add(0);
        } else {
            // Subsequent offsets: append new data (avoid duplicates)
            setAccumulatedItems(prev => {
                const existingIds = new Set(prev.map(item => getIdRef.current(item)));
                const newItems = dataArray.filter(item => !existingIds.has(getIdRef.current(item)));
                return [...prev, ...newItems];
            });
            processedOffsetsRef.current.add(offset);
        }

        if (data.total !== undefined) {
            setTotal(data.total);
        }

        // Update signature to mark this data as processed
        lastDataSignatureRef.current = dataSignature;
    }, [data, offset, enabled]);

    // Accepts absolute offset values (not deltas)
    const handleOffsetIncrement = useCallback((newOffset: number) => {
        setOffset(newOffset);
    }, []);

    // Handle reset
    const handleReset = useCallback(() => {
        setOffset(0);
        setAccumulatedItems([]);
        lastFetchedOffsetRef.current = null;
        lastForceReloadRef.current = undefined;
        processedOffsetsRef.current.clear();
        lastDataSignatureRef.current = "";
    }, []);

    // Calculate if there's more data to load
    const hasMoreData = accumulatedItems.length < total;
    const isReady = !loading && hasMoreData;

    return {
        accumulatedItems,
        offset,
        total,
        hasMoreData,
        isReady,
        handleOffsetIncrement,
        handleReset
    };
}
