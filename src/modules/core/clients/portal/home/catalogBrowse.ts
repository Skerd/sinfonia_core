import type {HttpRequest} from "@coreModule/helpers/types/httpRequest.types.ts";
import {
    PORTAL_SORTS,
    type PortalBrowseFilters,
    type PortalBrowseFormType,
} from "armonia/src/modules/core/api/portal/public/portal/portalBrowse.form.validator.ts";
import {CATALOG_FILTER_PREFIX} from "../shared/catalogFilters.tsx";

export const CATALOG_PAGE_SIZE = 24;

/** The home catalog's one read; the shell prefetches it for a hovered catalog link. */
export const BROWSE_REQUEST: HttpRequest = {method: "post", url: "/api/portal/browse", data: {}, cache: true};

function numberParam(params: URLSearchParams, key: string): number | undefined {
    const value = Number(params.get(key));
    return params.get(key) && Number.isFinite(value) ? value : undefined;
}

/** The browse request the URL describes. */
export function browseForm(params: URLSearchParams): PortalBrowseFormType {
    const filters: PortalBrowseFilters = {};
    params.forEach((value, key) => {
        if (key.startsWith(CATALOG_FILTER_PREFIX)) filters[key.slice(CATALOG_FILTER_PREFIX.length)] = value;
    });
    return {
        kind: params.get("kind") || undefined,
        query: params.get("q") || undefined,
        city: params.get("city") || undefined,
        priceMin: numberParam(params, "priceMin"),
        priceMax: numberParam(params, "priceMax"),
        sort: PORTAL_SORTS.find((sort) => sort === params.get("sort")),
        page: numberParam(params, "page"),
        limit: CATALOG_PAGE_SIZE,
        filters,
    };
}
