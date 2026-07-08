import type { FilterDSL, FilterGroup, FilterRule } from "armonia/src/modules/core/database/filter";
import { generateUUID } from "@coreModule/helpers/general";

export const FILTER_URL_PARAM = "filter";
export const FILTER_URL_MAX_LENGTH = 2000;

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
