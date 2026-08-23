import type { FilterDSL, FilterGroup, FilterRule } from "armonia/src/modules/core/database/filter";
import { generateUUID } from "@coreModule/helpers/general";

/**
 * List URL param contract (EntityListPage / CardAndTableView):
 * - `filter` — base64(JSON) FilterBuilder DSL (user-applied advanced filters)
 * - `filterLabels` — base64(JSON) ObjectId display labels for FilterBuilder chips
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
/** Companion to `filter`: fieldPath → id → display label for ObjectId rules. */
export const FILTER_LABELS_URL_PARAM = "filterLabels";
export const FILTER_URL_MAX_LENGTH = 2000;
export const FILTER_LABELS_URL_MAX_LENGTH = 4000;
/** Prefix for non-DSL list body params mirrored in the URL. */
export const EXTRA_PARAM_PREFIX = "ep_";

const LIST_VIEW_PARAM = "listView";
const LIST_PAGE_PARAM = "listPage";
const LIST_SORT_PARAM = "listSort";
const QUICK_FILTER_PARAM_PREFIX = "qf_";

/** fieldPath → objectId → display label */
export type FilterRefLabels = Record<string, Record<string, string>>;

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

export function encodeFilterLabelsToUrl(labels: FilterRefLabels): string {
    return encodeURIComponent(btoa(JSON.stringify(labels)));
}

export function decodeFilterLabelsFromUrl(encoded: string | null): FilterRefLabels | undefined {
    if (!encoded || encoded.length > FILTER_LABELS_URL_MAX_LENGTH) return undefined;
    try {
        const decoded = atob(decodeURIComponent(encoded));
        const parsed = JSON.parse(decoded) as FilterRefLabels;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
        const out: FilterRefLabels = {};
        for (const [fieldPath, idMap] of Object.entries(parsed)) {
            if (!fieldPath || !idMap || typeof idMap !== "object" || Array.isArray(idMap)) continue;
            const cleaned: Record<string, string> = {};
            for (const [id, label] of Object.entries(idMap)) {
                if (typeof id === "string" && id && typeof label === "string" && label) {
                    cleaned[id] = label;
                }
            }
            if (Object.keys(cleaned).length > 0) out[fieldPath] = cleaned;
        }
        return Object.keys(out).length > 0 ? out : undefined;
    } catch {
        /* ignore */
    }
    return undefined;
}

/** Collect ObjectId string values used in a DSL tree, keyed by rule field path. */
export function collectObjectIdValuesFromDsl(dsl: FilterDSL | undefined): Record<string, Set<string>> {
    const out: Record<string, Set<string>> = {};
    if (!dsl) return out;

    const visit = (group: FilterGroup) => {
        for (const rule of group.rules ?? []) {
            if (!rule.field || rule.value == null) continue;
            const set = out[rule.field] ?? (out[rule.field] = new Set());
            if (typeof rule.value === "string" && rule.value) set.add(rule.value);
            else if (Array.isArray(rule.value)) {
                for (const v of rule.value) {
                    if (typeof v === "string" && v) set.add(v);
                }
            }
        }
        for (const child of group.groups ?? []) visit(child);
    };
    visit(dsl);
    return out;
}

/** Keep only labels for ids still referenced by the applied DSL (keeps URLs smaller). */
export function pruneFilterLabelsToDsl(
    labels: FilterRefLabels,
    dsl: FilterDSL | undefined,
): FilterRefLabels {
    const used = collectObjectIdValuesFromDsl(dsl);
    const out: FilterRefLabels = {};
    for (const [fieldPath, idMap] of Object.entries(labels)) {
        const usedIds = used[fieldPath];
        if (!usedIds || usedIds.size === 0) continue;
        const cleaned: Record<string, string> = {};
        for (const [id, label] of Object.entries(idMap)) {
            if (usedIds.has(id) && label) cleaned[id] = label;
        }
        if (Object.keys(cleaned).length > 0) out[fieldPath] = cleaned;
    }
    return out;
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
        key === FILTER_LABELS_URL_PARAM ||
        key.startsWith(QUICK_FILTER_PARAM_PREFIX) ||
        key.startsWith(EXTRA_PARAM_PREFIX)
    );
}

function isListChromeParamKey(key: string): boolean {
    return (
        key === LIST_VIEW_PARAM ||
        key === LIST_PAGE_PARAM ||
        key === LIST_SORT_PARAM ||
        key.startsWith(LIST_VIEW_PARAM + "_") ||
        key.startsWith(LIST_PAGE_PARAM + "_") ||
        key.startsWith(LIST_SORT_PARAM + "_")
    );
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

/** Strip user filter params (`filter`, `filterLabels`, `qf_*`, `ep_*`) from a params object (mutates). */
export function stripUserFilterParams(params: URLSearchParams): void {
    for (const key of [...params.keys()]) {
        if (isUserFilterParamKey(key)) params.delete(key);
    }
}

/** Strip list chrome params except optionally `listView` (mutates). */
export function stripListChromeParams(params: URLSearchParams, keepView = false): void {
    for (const key of [...params.keys()]) {
        if (!isListChromeParamKey(key)) continue;
        if (keepView && (key === LIST_VIEW_PARAM || key.startsWith(LIST_VIEW_PARAM + "_"))) continue;
        params.delete(key);
    }
}
