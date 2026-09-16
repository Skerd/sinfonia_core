import {useCallback, useMemo, useRef, useState} from "react";
import {useSearchParams} from "react-router-dom";
import type {SortingState} from "@tanstack/react-table";
import {
    EXTRA_PARAM_PREFIX,
    LIST_PAGE_PARAM,
    LIST_SORT_PARAM,
    LIST_VIEW_PARAM,
    QUICK_FILTER_PARAM_PREFIX,
} from "@baseModule/helpers/filter/filterUrl.ts";

/**
 * Query keys for list chrome. Kept off `filter` so FilterBuilder is untouched.
 *
 * Full list URL contract (see also `filterUrl.ts`, which owns the shared key constants):
 * - `filter` — FilterBuilder DSL
 * - `qf_<field>` — QuickFilterBar values
 * - `qf_<field>_label` — display labels for ObjectId quick filters (skip select hydrate)
 * - `ep_<name>` — non-DSL extraParams
 * - `ep_<name>_label` — display labels for ObjectId extraParams
 * - `*Id` / `*Name` — scope/default filters
 * - `listView` / `listPage` / `listSort` — chrome
 */
export {EXTRA_PARAM_PREFIX, LIST_PAGE_PARAM, LIST_SORT_PARAM, LIST_VIEW_PARAM, QUICK_FILTER_PARAM_PREFIX};
/** Suffix for companion display-label params (`qf_project_label`, `ep_reservedBy_label`). */
export const FILTER_LABEL_SUFFIX = "_label";

type SetSearchParams = ReturnType<typeof useSearchParams>[1];

/**
 * Namespace list chrome params when multiple lists share a route
 * (e.g. active sessions + login history on account security).
 * `listView` → `listView_usersessions`.
 */
export function listChromeParam(base: string, scope?: string | null): string {
    if (!scope) return base;
    const safe = String(scope).replace(/[^a-zA-Z0-9_-]/g, "");
    return safe ? `${base}_${safe}` : base;
}

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

/** `name:desc` → `[{id: "name", desc: true}]`. Only a trailing `:asc`/`:desc` is a direction, so ids may contain `:`. */
function parseSort(raw: string | null): SortingState {
    if (!raw) return EMPTY_SORTING;
    const match = /^(.*):(asc|desc)$/.exec(raw);
    const id = match ? match[1] : raw;
    if (!id) return EMPTY_SORTING;
    return [{id, desc: match?.[2] === "desc"}];
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
    /**
     * When set (typically `tableConfigKey`), chrome params are namespaced
     * (`listView_usersessions`) so multiple lists on one route stay independent.
     */
    paramScope?: string | null;
};

/**
 * Shareable list chrome: view mode, 1-based page, and primary sort column.
 * Reads/writes react-router search params (replacing history) without touching FilterBuilder's `filter`.
 * All setters are stable for a given `paramScope` (`setOffset` also depends on `limit`).
 */
export function useListUrlState({fallbackView = "card", limit, paramScope}: UseListUrlStateOptions) {
    const [searchParams, setSearchParams] = useSearchParams();

    /* react-router recreates `setSearchParams` on every URL change; a ref keeps the setters below stable. */
    const setSearchParamsRef = useRef(setSearchParams);
    setSearchParamsRef.current = setSearchParams;

    const viewParam = listChromeParam(LIST_VIEW_PARAM, paramScope);
    const pageParam = listChromeParam(LIST_PAGE_PARAM, paramScope);
    const sortParamKey = listChromeParam(LIST_SORT_PARAM, paramScope);

    const urlView = parseView(searchParams.get(viewParam), fallbackView);
    const urlViewRef = useRef(urlView);
    urlViewRef.current = urlView;

    /*
     * Optimistic view so the toggle flips on the same click as the URL write. It records the URL
     * value it was chosen against and is dropped as soon as the URL moves on — to the chosen
     * value, or anywhere else (back/forward, links) — so the URL stays the source of truth.
     */
    const [pendingView, setPendingView] = useState<{mode: EntityListViewMode; from: EntityListViewMode} | null>(null);
    if (pendingView && pendingView.from !== urlView) setPendingView(null);
    const viewMode = pendingView && pendingView.from === urlView ? pendingView.mode : urlView;

    const page = parsePage(searchParams.get(pageParam));
    // Depend on the serialized sort string — not `searchParams` identity. Switching
    // card/table only patches `listView`; using the whole params object remade a new
    // `sorting` array every time and re-fired the list fetch effect.
    const sortParam = searchParams.get(sortParamKey);
    const sorting = useMemo(() => parseSort(sortParam), [sortParam]);
    const offset = (page - 1) * limit;

    const patchParams = useCallback((mutate: (next: URLSearchParams) => void) => {
        setSearchParamsRef.current(
            (prev) => {
                const next = new URLSearchParams(prev);
                mutate(next);
                return next;
            },
            {replace: true},
        );
    }, []);

    const setViewMode = useCallback(
        (mode: EntityListViewMode) => {
            const from = urlViewRef.current;
            setPendingView(mode === from ? null : {mode, from});
            // Always write an explicit value. Deleting when `mode === fallbackView`
            // raced a live localStorage fallback and left the toggle needing two clicks.
            patchParams((next) => next.set(viewParam, mode));
        },
        [patchParams, viewParam],
    );

    const setPage = useCallback(
        (nextPage: number) => {
            const normalized = Number.isFinite(nextPage) ? Math.floor(nextPage) : 1;
            patchParams((next) => {
                if (normalized <= 1) next.delete(pageParam);
                else next.set(pageParam, String(normalized));
            });
        },
        [patchParams, pageParam],
    );

    const setOffset = useCallback(
        (nextOffset: number) => {
            setPage(Math.floor(Math.max(0, nextOffset) / Math.max(1, limit)) + 1);
        },
        [limit, setPage],
    );

    const setSorting = useCallback(
        (updater: SortingState | ((prev: SortingState) => SortingState)) => {
            patchParams((params) => {
                const next = typeof updater === "function" ? updater(parseSort(params.get(sortParamKey))) : updater;
                const serialized = serializeSort(next);
                if (!serialized) params.delete(sortParamKey);
                else params.set(sortParamKey, serialized);
                // Sort change resets to first page so results stay coherent.
                params.delete(pageParam);
            });
        },
        [patchParams, sortParamKey, pageParam],
    );

    return useMemo(
        () => ({viewMode, setViewMode, page, offset, setOffset, setPage, sorting, setSorting}),
        [viewMode, setViewMode, page, offset, setOffset, setPage, sorting, setSorting],
    );
}

const valueOrNull = (raw: string | null): string | null => (raw != null && raw !== "" ? raw : null);

function readParams(
    searchParams: URLSearchParams,
    names: string[],
    keyOf: (name: string) => string,
): Record<string, string | null> {
    const out: Record<string, string | null> = {};
    for (const name of names) out[name] = valueOrNull(searchParams.get(keyOf(name)));
    return out;
}

/**
 * Sets (or, for an empty value, removes) a value param and its display-label companion, then
 * resets pagination so results stay coherent. An omitted `label` leaves an existing label as is;
 * `null` or `""` removes it.
 */
function writeValueWithLabel(
    setSearchParams: SetSearchParams,
    valueKey: string,
    labelKey: string,
    value: string | null,
    label: string | null | undefined,
    listPageParam: string,
) {
    setSearchParams(
        (prev) => {
            const next = new URLSearchParams(prev);
            if (value == null || value === "") {
                next.delete(valueKey);
                next.delete(labelKey);
            } else {
                next.set(valueKey, value);
                if (label != null && label !== "") next.set(labelKey, label);
                else if (label !== undefined) next.delete(labelKey);
            }
            next.delete(listPageParam);
            return next;
        },
        {replace: true},
    );
}

/** Removes value params and their label companions, then resets pagination. */
function clearValuesWithLabels(
    setSearchParams: SetSearchParams,
    names: string[],
    keyOf: (name: string) => string,
    labelKeyOf: (name: string) => string,
    listPageParam: string,
) {
    setSearchParams(
        (prev) => {
            const next = new URLSearchParams(prev);
            for (const name of names) {
                next.delete(keyOf(name));
                next.delete(labelKeyOf(name));
            }
            next.delete(listPageParam);
            return next;
        },
        {replace: true},
    );
}

/** Read quick-filter values from `qf_<field>` params. */
export function readQuickFiltersFromUrl(searchParams: URLSearchParams, fields: string[]): Record<string, string | null> {
    return readParams(searchParams, fields, quickFilterParamKey);
}

/** Read ObjectId display labels from `qf_<field>_label` params. */
export function readQuickFilterLabelsFromUrl(searchParams: URLSearchParams, fields: string[]): Record<string, string | null> {
    return readParams(searchParams, fields, quickFilterLabelParamKey);
}

export function writeQuickFilterParam(
    setSearchParams: SetSearchParams,
    field: string,
    value: string | null,
    label?: string | null,
    listPageParam: string = LIST_PAGE_PARAM,
) {
    writeValueWithLabel(setSearchParams, quickFilterParamKey(field), quickFilterLabelParamKey(field), value, label, listPageParam);
}

export function clearQuickFilterParams(
    setSearchParams: SetSearchParams,
    fields: string[],
    listPageParam: string = LIST_PAGE_PARAM,
) {
    clearValuesWithLabels(setSearchParams, fields, quickFilterParamKey, quickFilterLabelParamKey, listPageParam);
}

/** Read non-DSL extraParam values from `ep_<name>` params. */
export function readExtraParamsFromUrl(searchParams: URLSearchParams, keys: string[]): Record<string, string | null> {
    return readParams(searchParams, keys, extraParamKey);
}

/** Read ObjectId display labels from `ep_<name>_label` params. */
export function readExtraParamLabelsFromUrl(searchParams: URLSearchParams, keys: string[]): Record<string, string | null> {
    return readParams(searchParams, keys, extraParamLabelKey);
}

export function writeExtraParam(
    setSearchParams: SetSearchParams,
    key: string,
    value: string | null,
    label?: string | null,
    listPageParam: string = LIST_PAGE_PARAM,
) {
    writeValueWithLabel(setSearchParams, extraParamKey(key), extraParamLabelKey(key), value, label, listPageParam);
}

export function clearExtraParams(
    setSearchParams: SetSearchParams,
    keys: string[],
    listPageParam: string = LIST_PAGE_PARAM,
) {
    clearValuesWithLabels(setSearchParams, keys, extraParamKey, extraParamLabelKey, listPageParam);
}
