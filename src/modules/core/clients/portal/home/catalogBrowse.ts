import type {HttpRequest} from "@coreModule/helpers/types/httpRequest.types.ts";
import type {PortalSection} from "@coreModule/helpers/types/portalContribution.types.ts";
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

/**
 * Whether the visitor narrowed the catalog: words, a city, a price or a kind's filter. An empty catalog they did not
 * narrow has nothing listed yet, such as a new shop's site, rather than nothing that matches (TD-F158).
 */
export function isNarrowedSearch(params: URLSearchParams): boolean {
    const {query, city, priceMin, priceMax, filters} = browseForm(params);
    return Boolean(query || city || priceMin != null || priceMax != null || Object.keys(filters ?? {}).length > 0);
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

/**
 * The search a city landing page's catalog shows (D181): its address names neither the city nor, until the visitor
 * picks another of the section's kinds, the kind; both are added here.
 */
export function landingSearch(params: URLSearchParams, section: Pick<PortalSection, "catalogs">, city: string): URLSearchParams {
    const search = new URLSearchParams(params);
    const kinds = (section.catalogs ?? []).map(({kind}) => kind);
    const [first] = kinds;
    if (first && !kinds.includes(search.get("kind") ?? "")) search.set("kind", first);
    search.set("city", city);
    return search;
}
