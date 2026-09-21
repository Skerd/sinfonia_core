import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import {handleError, isAbortError} from "@coreModule/helpers/general/errors.ts";

export type SelectOption = {
    label: string;
    value: string;
    photo?: string;
};

const EMPTY_SEARCH_KEY = "__empty__";
const CACHE_MAX_KEYS = 20;

type CacheEntry = {options: SelectOption[]; hasMore: boolean; total: number};

/** Align `fetchedPages` with how many list pages are already merged into cached `options` (fixes stuck pagination after cache restore). */
function syncFetchedPagesForCachedOptions(fetchedPages: Set<number>, optionsLen: number, pageSize: number): void {
    fetchedPages.clear();
    if (optionsLen <= 0 || pageSize <= 0) return;
    const pagesRepresented = Math.max(1, Math.ceil(optionsLen / pageSize));
    for (let p = 1; p <= pagesRepresented; p++) fetchedPages.add(p);
}

function evictCacheIfNeeded(cache: Map<string, CacheEntry>, newKey: string): void {
    if (!cache.has(newKey) && cache.size >= CACHE_MAX_KEYS) {
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) cache.delete(firstKey);
    }
}

type ApiSelectListItem = {
    _id?: string;
    value?: string;
    id?: string;
    name?: string;
    label?: string;
    photo?: string;
};

type ApiListResponse = {data?: ApiSelectListItem[]; total?: number};

function parseListResponse(raw: unknown): {data: ApiSelectListItem[]; total: number} {
    const r = raw as ApiListResponse | null | undefined;
    return {
        data: Array.isArray(r?.data) ? r.data : [],
        total: typeof r?.total === "number" ? r.total : 0,
    };
}

function toSelectOption(item: ApiSelectListItem): SelectOption {
    return {
        value: item._id ?? item.value ?? item.id ?? "",
        label: item.name ?? item.label ?? "",
        photo: item.photo,
    };
}

export type UseApiSelectOptionsArgs = {
    apiUrl: string;
    disabled: boolean;
    pageSize: number;
    postBody: unknown;
    searchDebounceMs: number;
    forceLoad?: number;
    open: boolean;
    searchText: string;
    value?: string | string[];
    multiple: boolean;
    defaultOptions: SelectOption[];
};

/**
 * Owns everything ApiSelect needs to turn a paginated list endpoint into options:
 * per-search caching, page accumulation, request cancellation, search debouncing, and
 * hydrating a value that arrived before its label was fetched.
 *
 * This used to be ~300 lines inline in the component, tangled with twelve pieces of render
 * state. Pulling it out makes the fetch rules testable on their own — see
 * `useApiSelectOptions.test.ts`, which pins the cancellation behaviour described below.
 */
export function useApiSelectOptions({
    apiUrl,
    disabled,
    pageSize,
    postBody,
    searchDebounceMs,
    forceLoad,
    open,
    searchText,
    value,
    multiple,
    defaultOptions,
}: UseApiSelectOptionsArgs) {
    const [options, setOptions] = useState<SelectOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
    const fetchedPagesRef = useRef<Set<number>>(new Set());
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const optionsRef = useRef<SelectOption[]>([]);
    const lastForceLoadRef = useRef<number | undefined>(undefined);
    const abortControllerRef = useRef<AbortController | null>(null);
    const fetchPageRef = useRef<((pageNum: number, search: string) => Promise<void>) | null>(null);

    const postBodyRef = useRef(postBody);
    const openRef = useRef(open);
    const searchTextRef = useRef(searchText);
    useEffect(() => {
        postBodyRef.current = postBody;
        openRef.current = open;
        searchTextRef.current = searchText;
    }, [postBody, open, searchText]);

    const applyOptions = useCallback((next: SelectOption[]) => {
        optionsRef.current = next;
        setOptions(next);
    }, []);

    const fetchPage = useCallback(
        async (pageNum: number, search: string) => {
            if (!apiUrl || disabled || fetchedPagesRef.current.has(pageNum)) return;

            const isFirstPage = pageNum === 1;
            // A new first-page request (a fresh search) supersedes whatever is in flight, so cancel it.
            // A load-more must not cancel the list it is appending to, so it yields instead.
            if (isFirstPage) abortControllerRef.current?.abort();
            else if (abortControllerRef.current) return;

            const controller = new AbortController();
            abortControllerRef.current = controller;
            const isCurrent = () => abortControllerRef.current === controller;

            if (isFirstPage) setLoading(true);
            else setLoadingMore(true);

            const body = {...(postBodyRef.current as object), name: search, page: pageNum, limit: pageSize};
            try {
                const response = await apiClient.post(apiUrl, body, {signal: controller.signal});
                if (controller.signal.aborted || !isCurrent()) return;

                const listSearchKey = search || EMPTY_SEARCH_KEY;
                if (openRef.current && listSearchKey !== (searchTextRef.current || EMPTY_SEARCH_KEY)) return;

                // Reserve this page only once we know the response matches the current list search.
                fetchedPagesRef.current.add(pageNum);

                const {data: responseData, total: responseTotal} = parseListResponse(response.data);
                const newOptions: SelectOption[] = responseData.map(toSelectOption);
                const cacheKey = search || EMPTY_SEARCH_KEY;

                if (isFirstPage) {
                    const effectiveTotal = responseTotal > 0 ? responseTotal : newOptions.length;
                    const hasMoreData =
                        responseTotal > 0 ? newOptions.length < responseTotal : newOptions.length === pageSize;
                    applyOptions(newOptions);
                    setTotal(effectiveTotal);
                    setHasMore(hasMoreData);
                    evictCacheIfNeeded(cacheRef.current, cacheKey);
                    cacheRef.current.set(cacheKey, {options: newOptions, hasMore: hasMoreData, total: effectiveTotal});
                    return;
                }

                const existing = new Set(optionsRef.current.map((o) => o.value));
                const updated = [...optionsRef.current, ...newOptions.filter((o) => !existing.has(o.value))];
                const serverTotal = responseTotal > 0 ? responseTotal : 0;
                const hasMoreData =
                    serverTotal > 0 ? updated.length < serverTotal : newOptions.length === pageSize;
                const finalTotal = serverTotal > 0 ? serverTotal : updated.length;

                applyOptions(updated);
                setHasMore(hasMoreData);
                setTotal(finalTotal);
                evictCacheIfNeeded(cacheRef.current, cacheKey);
                cacheRef.current.set(cacheKey, {options: updated, hasMore: hasMoreData, total: finalTotal});
            } catch (err: unknown) {
                if (isAbortError(err, controller.signal)) return;
                handleError(err, {context: "ApiSelect"});
                fetchedPagesRef.current.delete(pageNum);
                if (isFirstPage && isCurrent()) {
                    applyOptions([]);
                    setTotal(0);
                    setHasMore(false);
                }
            } finally {
                // Only the request that still owns the slot may clear the shared flags; a superseded
                // one must not switch the spinner off underneath its replacement.
                if (isCurrent()) {
                    setLoading(false);
                    setLoadingMore(false);
                    abortControllerRef.current = null;
                } else if (controller.signal.aborted) {
                    fetchedPagesRef.current.delete(pageNum);
                }
            }
        },
        [apiUrl, disabled, pageSize, applyOptions],
    );

    useEffect(() => {
        fetchPageRef.current = fetchPage;
    }, [fetchPage]);

    const restoreFromCache = useCallback(
        (entry: CacheEntry) => {
            applyOptions(entry.options);
            setHasMore(entry.hasMore);
            setTotal(entry.total);
            syncFetchedPagesForCachedOptions(fetchedPagesRef.current, entry.options.length, pageSize);
        },
        [applyOptions, pageSize],
    );

    // `forceLoad` bumps to mean "throw everything away and refetch".
    useEffect(() => {
        if (forceLoad === undefined || forceLoad === lastForceLoadRef.current) return;
        lastForceLoadRef.current = forceLoad;
        cacheRef.current.clear();
        fetchedPagesRef.current.clear();
        setPage(1);
        applyOptions([]);
        setHasMore(true);
        setTotal(0);
        if (open && !disabled) fetchPageRef.current?.(1, "");
    }, [forceLoad, open, disabled, applyOptions]);

    const valuesToHydrate: string[] = useMemo(
        () =>
            multiple && Array.isArray(value)
                ? value.filter((v): v is string => v != null && v !== "")
                : value != null && !Array.isArray(value) && value !== ""
                  ? [value as string]
                  : [],
        [value, multiple],
    );

    // A value may arrive before the page holding its label: restore the cache, else fetch page 1.
    useEffect(() => {
        if (disabled || valuesToHydrate.length === 0) return;

        const isKnown = (v: string) =>
            optionsRef.current.some((opt) => opt.value === v) || defaultOptions.some((opt) => opt.value === v);
        if (valuesToHydrate.every(isKnown)) return;

        const cached = cacheRef.current.get(EMPTY_SEARCH_KEY);
        if (cached) {
            restoreFromCache(cached);
            if (valuesToHydrate.every(isKnown)) return;
        }
        if (!fetchedPagesRef.current.has(1)) fetchPageRef.current?.(1, "");
    }, [valuesToHydrate, disabled, defaultOptions, restoreFromCache]);

    /**
     * The single selected value whose label has not been loaded yet, so the trigger can show the
     * raw id rather than an empty box. Derived rather than stored: as state it needed a second
     * effect to clear it once the options arrived, which is exactly the kind of lag that shows up
     * as a flash of the id after the list has loaded.
     */
    const pendingValue = useMemo(() => {
        if (disabled || multiple || valuesToHydrate.length === 0) return undefined;
        return valuesToHydrate.find(
            (v) => !options.some((opt) => opt.value === v) && !defaultOptions.some((opt) => opt.value === v),
        );
    }, [disabled, multiple, valuesToHydrate, options, defaultOptions]);

    // Opening (or typing) serves from cache when possible, else debounces a fresh first page.
    useEffect(() => {
        if (!open || disabled) return;

        const cached = cacheRef.current.get(searchText || EMPTY_SEARCH_KEY);
        if (cached && cached.options.length > 0) {
            setPage(1);
            restoreFromCache(cached);
            return;
        }

        setPage(1);
        applyOptions([]);
        setHasMore(true);
        fetchedPagesRef.current.clear();

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(
            () => fetchPageRef.current?.(1, searchText),
            searchText ? searchDebounceMs : 0,
        );
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [open, searchText, disabled, searchDebounceMs, applyOptions, restoreFromCache]);

    useEffect(() => {
        if (!open || page === 1 || disabled || !hasMore) return;
        if (fetchedPagesRef.current.has(page)) return;
        fetchPageRef.current?.(page, searchText || "");
    }, [page, open, disabled, hasMore, searchText]);

    // Abandon any in-flight request when the select goes away.
    useEffect(() => () => abortControllerRef.current?.abort(), []);

    /** Put a just-created option at the top of the list and of the cache entry it belongs to. */
    const prependCreatedOption = useCallback(
        (option: SelectOption) => {
            const merged = [option, ...optionsRef.current.filter((o) => o.value !== option.value)];
            applyOptions(merged);
            const cacheKey = searchTextRef.current || EMPTY_SEARCH_KEY;
            const cached = cacheRef.current.get(cacheKey);
            if (cached) {
                cacheRef.current.set(cacheKey, {
                    ...cached,
                    options: [option, ...cached.options.filter((o) => o.value !== option.value)],
                });
            }
        },
        [applyOptions],
    );

    const loadMore = useCallback(() => setPage((current) => current + 1), []);

    return {options, loading, loadingMore, page, total, hasMore, pendingValue, loadMore, prependCreatedOption};
}
