import type { FilterDSL, FilterGroup, FilterRule } from "armonia/src/modules/core/database/filter";
import { FILTER_OPERATORS } from "armonia/src/modules/core/database/filter/filter.types.ts";
import {generateUUID} from "@coreModule/helpers/general/uuid.ts";
import { isFilterGroupEmpty } from "./mergeFilterDsl.ts";

/**
 * List URL param contract (EntityListPage / CardAndTableView):
 * - `filter` — base64url(JSON) FilterBuilder DSL (user-applied advanced filters)
 * - `filterLabels` — base64url(JSON) ObjectId display labels for FilterBuilder chips
 * - `qf_<field>` — QuickFilterBar values (merged into toolbar DSL or extraParams)
 * - `qf_<field>_label` — ObjectId quick-filter display labels (skip select hydrate)
 * - `ep_<name>` — non-DSL list body extraParams (page-local / asExtraParam)
 * - `ep_<name>_label` — ObjectId extraParam display labels
 * - `projectId` / `edificeId` / `floorId` / `*Name` — scope/default filters (extraFilters)
 * - `listView` / `listPage` / `listSort` — list chrome (useListUrlState)
 *
 * The param-key constants live here and `useListUrlState` (which owns the runtime chrome
 * helpers) re-exports them. This module must not import `useListUrlState`, or the two would cycle.
 */

export const FILTER_URL_PARAM = "filter";
/** Companion to `filter`: fieldPath → id → display label for ObjectId rules. */
export const FILTER_LABELS_URL_PARAM = "filterLabels";
export const FILTER_URL_MAX_LENGTH = 2000;
export const FILTER_LABELS_URL_MAX_LENGTH = 4000;
/** Prefix for non-DSL list body params mirrored in the URL. */
export const EXTRA_PARAM_PREFIX = "ep_";

/** List chrome params (namespaced per list by `listChromeParam` in `useListUrlState`). */
export const LIST_VIEW_PARAM = "listView";
export const LIST_PAGE_PARAM = "listPage";
export const LIST_SORT_PARAM = "listSort";
/** Prefix for QuickFilterBar values mirrored in the URL. */
export const QUICK_FILTER_PARAM_PREFIX = "qf_";

/** Same limit the API's `filterDSLSchema` enforces; deeper URL filters would only fail server-side. */
const MAX_FILTER_DEPTH = 5;

/** fieldPath → objectId → display label */
export type FilterRefLabels = Record<string, Record<string, string>>;

// ---------------------------------------------------------------------------
// Encoding
// ---------------------------------------------------------------------------

/**
 * JSON → UTF-8 → base64url. URL-safe as is (no `%XX` inflation once `URLSearchParams`
 * serializes it) and, unlike bare `btoa`, handles any Unicode (e.g. "Zürich", "Durrës").
 */
function encodeJsonParam(value: unknown): string {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Inverse of `encodeJsonParam`. Also reads legacy links, which were
 * `encodeURIComponent(btoa(json))` with Latin-1 payloads. Returns `undefined` on any failure.
 */
function decodeJsonParam(encoded: string | null, maxLength: number): unknown {
    if (!encoded || encoded.length > maxLength) return undefined;
    try {
        const base64 = (encoded.includes("%") ? decodeURIComponent(encoded) : encoded)
            .replace(/-/g, "+")
            .replace(/_/g, "/");
        const binary = atob(base64);
        const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
        let json: string;
        try {
            json = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        } catch {
            json = binary; // legacy Latin-1 payload
        }
        return JSON.parse(json);
    } catch {
        return undefined;
    }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFilterValue(value: unknown): value is FilterRule["value"] {
    if (value === null) return true;
    const type = typeof value;
    if (type === "string" || type === "number" || type === "boolean") return true;
    if (!Array.isArray(value)) return false;
    return value.every((v) => typeof v === "string") || value.every((v) => typeof v === "number");
}

function isFilterRule(value: unknown): value is FilterRule {
    return (
        isPlainObject(value) &&
        typeof value.id === "string" &&
        typeof value.field === "string" &&
        value.field !== "" &&
        (FILTER_OPERATORS as readonly unknown[]).includes(value.operator) &&
        isFilterValue(value.value)
    );
}

/** Structural check of a whole (untrusted) DSL tree, so consumers never trip over a hand-edited URL. */
function isFilterGroup(value: unknown, depth = 1): value is FilterGroup {
    return (
        depth <= MAX_FILTER_DEPTH &&
        isPlainObject(value) &&
        typeof value.id === "string" &&
        (value.operator === "and" || value.operator === "or") &&
        Array.isArray(value.rules) &&
        value.rules.every(isFilterRule) &&
        Array.isArray(value.groups) &&
        value.groups.every((group) => isFilterGroup(group, depth + 1))
    );
}

export function encodeFilterToUrl(dsl: FilterDSL): string {
    return encodeJsonParam(dsl);
}

export function decodeFilterFromUrl(encoded: string | null): FilterDSL | undefined {
    const parsed = decodeJsonParam(encoded, FILTER_URL_MAX_LENGTH);
    return isFilterGroup(parsed) && parsed.id ? parsed : undefined;
}

export function encodeFilterLabelsToUrl(labels: FilterRefLabels): string {
    return encodeJsonParam(labels);
}

export function decodeFilterLabelsFromUrl(encoded: string | null): FilterRefLabels | undefined {
    const parsed = decodeJsonParam(encoded, FILTER_LABELS_URL_MAX_LENGTH);
    if (!isPlainObject(parsed)) return undefined;
    const out = filterLabels(parsed, (_fieldPath, _id, label) => typeof label === "string" && label !== "");
    return Object.keys(out).length > 0 ? out : undefined;
}

// ---------------------------------------------------------------------------
// Labels ↔ DSL
// ---------------------------------------------------------------------------

/**
 * Rebuild a label map keeping only entries `keep` accepts; skips malformed
 * id maps and drops field paths left empty.
 */
function filterLabels(
    labels: Record<string, unknown>,
    keep: (fieldPath: string, id: string, label: unknown) => boolean,
): FilterRefLabels {
    const out: FilterRefLabels = {};
    for (const [fieldPath, idMap] of Object.entries(labels)) {
        if (!fieldPath || !isPlainObject(idMap)) continue;
        const kept: Record<string, string> = {};
        for (const [id, label] of Object.entries(idMap)) {
            if (id && keep(fieldPath, id, label)) kept[id] = label as string;
        }
        if (Object.keys(kept).length > 0) out[fieldPath] = kept;
    }
    return out;
}

/** Collect non-empty string values used in a DSL tree (ObjectId candidates), keyed by rule field path. */
export function collectObjectIdValuesFromDsl(dsl: FilterDSL | undefined): Record<string, Set<string>> {
    const out: Record<string, Set<string>> = {};
    const add = (field: string, value: unknown) => {
        if (typeof value === "string" && value) (out[field] ??= new Set()).add(value);
    };

    const visit = (group: FilterGroup) => {
        for (const rule of group.rules ?? []) {
            if (!rule.field) continue;
            if (Array.isArray(rule.value)) rule.value.forEach((v) => add(rule.field, v));
            else add(rule.field, rule.value);
        }
        group.groups?.forEach(visit);
    };
    if (dsl) visit(dsl);
    return out;
}

/** Keep only labels for ids still referenced by the applied DSL (keeps URLs smaller). */
export function pruneFilterLabelsToDsl(labels: FilterRefLabels, dsl: FilterDSL | undefined): FilterRefLabels {
    const used = collectObjectIdValuesFromDsl(dsl);
    return filterLabels(labels, (fieldPath, id, label) => Boolean(label) && used[fieldPath]?.has(id) === true);
}

// ---------------------------------------------------------------------------
// DSL builders
// ---------------------------------------------------------------------------

export function buildFilterGroup(rules: FilterRule[]): FilterGroup {
    return { id: generateUUID(), operator: "and", rules, groups: [] };
}

export function buildFilterRule(field: string, operator: FilterRule["operator"], value: FilterRule["value"]): FilterRule {
    return { id: generateUUID(), field, operator, value };
}

// ---------------------------------------------------------------------------
// Navigation URLs
// ---------------------------------------------------------------------------

function withQuery(path: string, params: URLSearchParams): string {
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
}

type BuildListDrillDownUrlOptions = {
    filter?: FilterDSL;
    /** ObjectId chip labels for `filter` rules (encoded as `filterLabels`). */
    filterLabels?: FilterRefLabels;
    queryParams?: Record<string, string | undefined>;
};

/** Build a list-page URL with optional `filter` DSL and extra query params. */
export function buildListDrillDownUrl(path: string, { filter, filterLabels, queryParams }: BuildListDrillDownUrlOptions = {}): string {
    const params = new URLSearchParams();
    if (filter && !isFilterGroupEmpty(filter)) {
        params.set(FILTER_URL_PARAM, encodeFilterToUrl(filter));
        if (filterLabels && Object.keys(filterLabels).length > 0) {
            params.set(FILTER_LABELS_URL_PARAM, encodeFilterLabelsToUrl(pruneFilterLabelsToDsl(filterLabels, filter)));
        }
    }
    for (const [key, value] of Object.entries(queryParams ?? {})) {
        if (value) params.set(key, value);
    }
    return withQuery(path, params);
}

export type ListNavigationPolicy = "scoped" | "carry";

export type BuildListNavigationUrlOptions = {
    /** Target list path (e.g. `/realEstate/edifices`). */
    path: string;
    /** Current location search (`window.location.search` or `URLSearchParams`). */
    from?: string | URLSearchParams;
    /** Scope / identity params to set (projectId, edificeId, …); `null` / `""` removes the key. */
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
export function buildListNavigationUrl({ path, from, scope = {}, policy }: BuildListNavigationUrlOptions): string {
    // `URLSearchParams` strips a leading "?" and copies an existing instance.
    const source = new URLSearchParams(from);
    let params: URLSearchParams;

    if (policy === "scoped") {
        params = new URLSearchParams();
        const listView = source.get(LIST_VIEW_PARAM);
        if (listView === "card" || listView === "table") params.set(LIST_VIEW_PARAM, listView);
    } else {
        params = source;
        params.delete(LIST_PAGE_PARAM);
    }

    for (const [key, value] of Object.entries(scope)) {
        if (value) params.set(key, value);
        else params.delete(key);
    }
    return withQuery(path, params);
}

// ---------------------------------------------------------------------------
// Param stripping
// ---------------------------------------------------------------------------

/** `base` itself or a per-list namespaced variant (`listView_usersessions`). */
function isChromeParam(key: string, base: string): boolean {
    return key === base || key.startsWith(`${base}_`);
}

function isUserFilterParamKey(key: string): boolean {
    return (
        key === FILTER_URL_PARAM ||
        key === FILTER_LABELS_URL_PARAM ||
        key.startsWith(QUICK_FILTER_PARAM_PREFIX) ||
        key.startsWith(EXTRA_PARAM_PREFIX)
    );
}

function deleteKeysWhere(params: URLSearchParams, predicate: (key: string) => boolean): void {
    for (const key of new Set(params.keys())) {
        if (predicate(key)) params.delete(key);
    }
}

/** Strip user filter params (`filter`, `filterLabels`, `qf_*`, `ep_*`) from a params object (mutates). */
export function stripUserFilterParams(params: URLSearchParams): void {
    deleteKeysWhere(params, isUserFilterParamKey);
}

/** Strip list chrome params except optionally `listView` (mutates). */
export function stripListChromeParams(params: URLSearchParams, keepView = false): void {
    const bases = keepView ? [LIST_PAGE_PARAM, LIST_SORT_PARAM] : [LIST_VIEW_PARAM, LIST_PAGE_PARAM, LIST_SORT_PARAM];
    deleteKeysWhere(params, (key) => bases.some((base) => isChromeParam(key, base)));
}
