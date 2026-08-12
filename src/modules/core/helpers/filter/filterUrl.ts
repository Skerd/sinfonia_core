import type { FilterDSL, FilterGroup, FilterRule } from "armonia/src/modules/core/database/filter";
import { generateUUID } from "@coreModule/helpers/general";

/**
 * List URL param contract (EntityListPage / CardAndTableView):
 * - `filter` — base64(JSON) FilterBuilder DSL (user-applied advanced filters)
 * - `qf_<field>` — QuickFilterBar values (merged into toolbar DSL or extraParams)
 * - `qf_<field>_label` — ObjectId quick-filter display labels (skip select hydrate)
 * - `ep_<name>` — non-DSL list body extraParams (page-local / asExtraParam)
 * - `ep_<name>_label` — ObjectId extraParam display labels
 * - `projectId` / `edificeId` / `floorId` / `*Name` — scope/default filters (extraFilters)
 * - `listView` / `listPage` / `listSort` — list chrome (useListUrlState)
 *
 * Chrome / quick-filter prefixes are duplicated as literals here to avoid a cycle
 * with `useListUrlState` (which owns the runtime chrome helpers).
 */

export const FILTER_URL_PARAM = "filter";
export const FILTER_URL_MAX_LENGTH = 2000;
/** Prefix for non-DSL list body params mirrored in the URL. */
export const EXTRA_PARAM_PREFIX = "ep_";

const LIST_VIEW_PARAM = "listView";
const LIST_PAGE_PARAM = "listPage";
const LIST_SORT_PARAM = "listSort";
const QUICK_FILTER_PARAM_PREFIX = "qf_";

export function encodeFilterToUrl(dsl: FilterDSL): string {
    return encodeURIComponent(btoa(JSON.stringify(dsl)));
}

export function decodeFilterFromUrl(encoded: string | null): FilterDSL | undefined {
    if (!encoded || encoded.length > FILTER_URL_MAX_LENGTH) return undefined;
    try {
        const decoded = atob(decodeURIComponent(encoded));
        const parsed = JSON.parse(decoded) as FilterDSL;
        if (parsed?.id && Array.isArray(parsed?.rules) && Array.isArray(parsed?.groups)) return parsed;
    } catch {
        /* ignore */
    }
    return undefined;
}

export function buildFilterGroup(rules: FilterRule[]): FilterGroup {
    return {
        id: generateUUID(),
        operator: "and",
        rules,
        groups: [],
    };
}

export function buildFilterRule(
    field: string,
    operator: FilterRule["operator"],
    value: FilterRule["value"],
): FilterRule {
    return {
        id: generateUUID(),
        field,
        operator,
        value,
    };
}

type BuildListDrillDownUrlOptions = {
    filter?: FilterDSL;
    queryParams?: Record<string, string | undefined>;
};

/** Build a list-page URL with optional `filter` DSL and extra query params. */
export function buildListDrillDownUrl(path: string, options: BuildListDrillDownUrlOptions = {}): string {
    const params = new URLSearchParams();
    const { filter, queryParams } = options;

    if (filter && (filter.rules?.length || filter.groups?.length)) {
        params.set(FILTER_URL_PARAM, encodeFilterToUrl(filter));
    }

    if (queryParams) {
        for (const [key, value] of Object.entries(queryParams)) {
            if (value !== undefined && value !== "") {
                params.set(key, value);
            }
        }
    }

    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
}

function isUserFilterParamKey(key: string): boolean {
    return (
        key === FILTER_URL_PARAM ||
        key.startsWith(QUICK_FILTER_PARAM_PREFIX) ||
        key.startsWith(EXTRA_PARAM_PREFIX)
    );
}

function isListChromeParamKey(key: string): boolean {
    return key === LIST_VIEW_PARAM || key === LIST_PAGE_PARAM || key === LIST_SORT_PARAM;
}

function applyScope(
    params: URLSearchParams,
    scope: Record<string, string | null | undefined>,
): void {
    for (const [key, value] of Object.entries(scope)) {
        if (value == null || value === "") params.delete(key);
        else params.set(key, value);
    }
}

export type ListNavigationPolicy = "scoped" | "carry";

export type BuildListNavigationUrlOptions = {
    /** Target list path (e.g. `/realEstate/edifices`). */
    path: string;
    /** Current location search (`window.location.search` or `URLSearchParams`). */
    from?: string | URLSearchParams;
    /** Scope / identity params to set (projectId, edificeId, …). */
    scope?: Record<string, string | null | undefined>;
    /**
     * - `scoped` — fresh entry for an entity scope: only `scope` (+ keep `listView` if present).
     *   Drops `filter` / `qf_*` / `ep_*` / page / sort so the target list is not polluted.
     * - `carry` — hierarchical drill-down: keep current params, merge `scope`, reset `listPage`.
     */
    policy: ListNavigationPolicy;
};

/**
 * Build a list navigation URL with a consistent preserve-vs-scope-reset policy
 * for filter-related query params.
 */
export function buildListNavigationUrl(options: BuildListNavigationUrlOptions): string {
    const { path, from, scope = {}, policy } = options;
    const source =
        typeof from === "string"
            ? new URLSearchParams(from.startsWith("?") ? from.slice(1) : from)
            : from
              ? new URLSearchParams(from)
              : new URLSearchParams();

    let params: URLSearchParams;

    if (policy === "scoped") {
        params = new URLSearchParams();
        const listView = source.get(LIST_VIEW_PARAM);
        if (listView === "card" || listView === "table") {
            params.set(LIST_VIEW_PARAM, listView);
        }
        applyScope(params, scope);
    } else {
        params = new URLSearchParams(source);
        applyScope(params, scope);
        params.delete(LIST_PAGE_PARAM);
    }

    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
}

/** Strip user filter params (`filter`, `qf_*`, `ep_*`) from a params object (mutates). */
export function stripUserFilterParams(params: URLSearchParams): void {
    for (const key of [...params.keys()]) {
        if (isUserFilterParamKey(key)) params.delete(key);
    }
}

/** Strip list chrome params except optionally `listView` (mutates). */
export function stripListChromeParams(params: URLSearchParams, keepView = false): void {
    for (const key of [...params.keys()]) {
        if (!isListChromeParamKey(key)) continue;
        if (keepView && key === LIST_VIEW_PARAM) continue;
        params.delete(key);
    }
}
