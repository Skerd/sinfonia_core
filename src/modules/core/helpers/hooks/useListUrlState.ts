import {useCallback, useEffect, useMemo, useState} from "react";
import {useSearchParams} from "react-router-dom";
import type {SortingState} from "@tanstack/react-table";

/**
 * Query keys for list chrome. Kept off `filter` so FilterBuilder is untouched.
 *
 * Full list URL contract (see also `filterUrl.ts`):
 * - `filter` — FilterBuilder DSL
 * - `qf_<field>` — QuickFilterBar values
 * - `qf_<field>_label` — display labels for ObjectId quick filters (skip select hydrate)
 * - `ep_<name>` — non-DSL extraParams
 * - `ep_<name>_label` — display labels for ObjectId extraParams
 * - `*Id` / `*Name` — scope/default filters
 * - `listView` / `listPage` / `listSort` — chrome
 */
export const LIST_VIEW_PARAM = "listView";
export const LIST_PAGE_PARAM = "listPage";
export const LIST_SORT_PARAM = "listSort";
export const QUICK_FILTER_PARAM_PREFIX = "qf_";
/** Suffix for companion display-label params (`qf_project_label`, `ep_reservedBy_label`). */
export const FILTER_LABEL_SUFFIX = "_label";
/** Prefix for non-DSL list body params mirrored in the URL (see `filterUrl.EXTRA_PARAM_PREFIX`). */
export const EXTRA_PARAM_PREFIX = "ep_";

export function quickFilterParamKey(field: string): string {
    return `${QUICK_FILTER_PARAM_PREFIX}${field}`;
}

export function quickFilterLabelParamKey(field: string): string {
    return `${QUICK_FILTER_PARAM_PREFIX}${field}${FILTER_LABEL_SUFFIX}`;
}

export function extraParamKey(name: string): string {
    return `${EXTRA_PARAM_PREFIX}${name}`;
}

export function extraParamLabelKey(name: string): string {
    return `${EXTRA_PARAM_PREFIX}${name}${FILTER_LABEL_SUFFIX}`;
}

export type EntityListViewMode = "card" | "table";

const EMPTY_SORTING: SortingState = [];

function parseView(raw: string | null, fallback: EntityListViewMode): EntityListViewMode {
    if (raw === "card" || raw === "table") return raw;
    return fallback;
}

function parsePage(raw: string | null): number {
    const n = Number(raw);
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function parseSort(raw: string | null): SortingState {
    if (!raw) return EMPTY_SORTING;
    const [id, dir] = raw.split(":");
    if (!id) return EMPTY_SORTING;
    return [{id, desc: dir === "desc"}];
}

function serializeSort(sorting: SortingState): string | null {
    if (!sorting.length) return null;
    const {id, desc} = sorting[0];
    return `${id}:${desc ? "desc" : "asc"}`;
}

type UseListUrlStateOptions = {
    /**
     * Initial/default view when the URL has no `listView` param.
     * Must stay stable for the mount (do not re-read localStorage every render) —
     * otherwise `setViewMode` races the preference write and the toggle needs two clicks.
     */
    fallbackView?: EntityListViewMode;
    limit: number;
};

/**
 * Shareable list chrome: view mode, 1-based page, and primary sort column.
 * Reads/writes react-router search params without touching FilterBuilder's `filter`.
 */
export function useListUrlState({fallbackView = "card", limit}: UseListUrlStateOptions) {
    const [searchParams, setSearchParams] = useSearchParams();

    const urlView = parseView(searchParams.get(LIST_VIEW_PARAM), fallbackView);
    // Optimistic local value so the toggle flips on the same click as the URL write.
    const [viewMode, setViewModeState] = useState<EntityListViewMode>(urlView);

    useEffect(() => {
        setViewModeState(urlView);
    }, [urlView]);

    const page = parsePage(searchParams.get(LIST_PAGE_PARAM));
    // Depend on the serialized sort string — not `searchParams` identity. Switching
    // card/table only patches `listView`; using the whole params object remade a new
    // `sorting` array every time and re-fired the list fetch effect.
    const sortParam = searchParams.get(LIST_SORT_PARAM);
    const sorting = useMemo(() => parseSort(sortParam), [sortParam]);
    const offset = (page - 1) * limit;

    const patchParams = useCallback(
        (mutate: (next: URLSearchParams) => void) => {
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    mutate(next);
                    return next;
                },
                {replace: true},
            );
        },
        [setSearchParams],
    );

    const setViewMode = useCallback(
        (mode: EntityListViewMode) => {
            setViewModeState(mode);
            patchParams((next) => {
                // Always write an explicit value. Deleting when `mode === fallbackView`
                // raced a live localStorage fallback and left the toggle needing two clicks.
                next.set(LIST_VIEW_PARAM, mode);
            });
        },
        [patchParams],
    );

    const setPage = useCallback(
        (nextPage: number) => {
            patchParams((next) => {
                if (nextPage <= 1) next.delete(LIST_PAGE_PARAM);
                else next.set(LIST_PAGE_PARAM, String(nextPage));
            });
        },
        [patchParams],
    );

    const setOffset = useCallback(
        (nextOffset: number) => {
            const nextPage = Math.floor(Math.max(0, nextOffset) / Math.max(1, limit)) + 1;
            setPage(nextPage);
        },
        [limit, setPage],
    );

    const setSorting = useCallback(
        (updater: SortingState | ((prev: SortingState) => SortingState)) => {
            const next = typeof updater === "function" ? updater(sorting) : updater;
            const serialized = serializeSort(next);
            patchParams((params) => {
                if (!serialized) params.delete(LIST_SORT_PARAM);
                else params.set(LIST_SORT_PARAM, serialized);
                // Sort change resets to first page so results stay coherent.
                params.delete(LIST_PAGE_PARAM);
            });
        },
        [patchParams, sorting],
    );

    return {
        viewMode,
        setViewMode,
        page,
        offset,
        setOffset,
        setPage,
        sorting,
        setSorting,
    };
}

/** Read quick-filter values from `qf_<field>` params. */
export function readQuickFiltersFromUrl(
    searchParams: URLSearchParams,
    fields: string[],
): Record<string, string | null> {
    const out: Record<string, string | null> = {};
    for (const field of fields) {
        const raw = searchParams.get(quickFilterParamKey(field));
        out[field] = raw != null && raw !== "" ? raw : null;
    }
    return out;
}

/** Read ObjectId display labels from `qf_<field>_label` params. */
export function readQuickFilterLabelsFromUrl(
    searchParams: URLSearchParams,
    fields: string[],
): Record<string, string | null> {
    const out: Record<string, string | null> = {};
    for (const field of fields) {
        const raw = searchParams.get(quickFilterLabelParamKey(field));
        out[field] = raw != null && raw !== "" ? raw : null;
    }
    return out;
}

export function writeQuickFilterParam(
    setSearchParams: ReturnType<typeof useSearchParams>[1],
    field: string,
    value: string | null,
    label?: string | null,
) {
    setSearchParams(
        (prev) => {
            const next = new URLSearchParams(prev);
            const key = quickFilterParamKey(field);
            const labelKey = quickFilterLabelParamKey(field);
            if (value == null || value === "") {
                next.delete(key);
                next.delete(labelKey);
            } else {
                next.set(key, value);
                if (label != null && label !== "") next.set(labelKey, label);
                else if (label === null || label === "") next.delete(labelKey);
            }
            // Filter change resets pagination so results stay coherent.
            next.delete(LIST_PAGE_PARAM);
            return next;
        },
        {replace: true},
    );
}

export function clearQuickFilterParams(
    setSearchParams: ReturnType<typeof useSearchParams>[1],
    fields: string[],
) {
    setSearchParams(
        (prev) => {
            const next = new URLSearchParams(prev);
            for (const field of fields) {
                next.delete(quickFilterParamKey(field));
                next.delete(quickFilterLabelParamKey(field));
            }
            // Filter change resets pagination so results stay coherent.
            next.delete(LIST_PAGE_PARAM);
            return next;
        },
        {replace: true},
    );
}

/** Read non-DSL extraParam values from `ep_<name>` params. */
export function readExtraParamsFromUrl(
    searchParams: URLSearchParams,
    keys: string[],
): Record<string, string | null> {
    const out: Record<string, string | null> = {};
    for (const key of keys) {
        const raw = searchParams.get(extraParamKey(key));
        out[key] = raw != null && raw !== "" ? raw : null;
    }
    return out;
}

/** Read ObjectId display labels from `ep_<name>_label` params. */
export function readExtraParamLabelsFromUrl(
    searchParams: URLSearchParams,
    keys: string[],
): Record<string, string | null> {
    const out: Record<string, string | null> = {};
    for (const key of keys) {
        const raw = searchParams.get(extraParamLabelKey(key));
        out[key] = raw != null && raw !== "" ? raw : null;
    }
    return out;
}

export function writeExtraParam(
    setSearchParams: ReturnType<typeof useSearchParams>[1],
    key: string,
    value: string | null,
    label?: string | null,
) {
    setSearchParams(
        (prev) => {
            const next = new URLSearchParams(prev);
            const paramKey = extraParamKey(key);
            const labelKey = extraParamLabelKey(key);
            if (value == null || value === "") {
                next.delete(paramKey);
                next.delete(labelKey);
            } else {
                next.set(paramKey, value);
                if (label != null && label !== "") next.set(labelKey, label);
                else if (label === null || label === "") next.delete(labelKey);
            }
            next.delete(LIST_PAGE_PARAM);
            return next;
        },
        {replace: true},
    );
}

export function clearExtraParams(
    setSearchParams: ReturnType<typeof useSearchParams>[1],
    keys: string[],
) {
    setSearchParams(
        (prev) => {
            const next = new URLSearchParams(prev);
            for (const key of keys) {
                next.delete(extraParamKey(key));
                next.delete(extraParamLabelKey(key));
            }
            next.delete(LIST_PAGE_PARAM);
            return next;
        },
        {replace: true},
    );
}
