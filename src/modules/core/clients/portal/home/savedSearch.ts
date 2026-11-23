import type {PortalSavedSearch} from "armonia/src/modules/core/api/portal/private/saved/portalSaved.dto.ts";
import {CATALOG_FILTER_PREFIX} from "../shared/catalogFilters.tsx";
import {browseForm} from "./catalogBrowse.ts";

/** A saved search without its own fields: the home catalog's browse query (D178, P23.7). */
export type SavedSearchQuery = Pick<PortalSavedSearch, "kind" | "query" | "city" | "priceMin" | "priceMax"> & {filters: PortalSavedSearch["filters"]};

/** The search the home catalog shows, as a saved search keeps it: no page, no sort. */
export function savedSearchQuery(params: URLSearchParams): SavedSearchQuery {
    const {kind, query, city, priceMin, priceMax, filters} = browseForm(params);
    return {kind, query: query?.trim() || undefined, city: city?.trim() || undefined, priceMin, priceMax, filters: filters ?? {}};
}

/** Something to save: a kind, words or a city (the whole catalog is not a search). */
export function isSavableSearch(search: SavedSearchQuery): boolean {
    return Boolean(search.kind || search.query || search.city);
}

/** The home catalog showing a saved search, newest first. */
export function savedSearchHref(search: SavedSearchQuery): string {
    const params = new URLSearchParams();
    if (search.kind) params.set("kind", search.kind);
    if (search.query) params.set("q", search.query);
    if (search.city) params.set("city", search.city);
    if (search.priceMin != null) params.set("priceMin", String(search.priceMin));
    if (search.priceMax != null) params.set("priceMax", String(search.priceMax));
    for (const [name, value] of Object.entries(search.filters)) {
        for (const one of Array.isArray(value) ? value : [value]) params.append(`${CATALOG_FILTER_PREFIX}${name}`, one);
    }
    params.set("sort", "newest");
    return `/?${params}`;
}

/** The words a saved search reads as, in the visitor's language: "Cars · “bmw” · Tirana · up to 100 · 2 filters". */
export function savedSearchLabel(
    search: SavedSearchQuery,
    words: {kindName?: string; resolveLanguageKey: (key: string) => string},
): string {
    const {resolveLanguageKey} = words;
    const filterCount = Object.keys(search.filters).length;
    const price = search.priceMin != null && search.priceMax != null
        ? `${search.priceMin}–${search.priceMax}`
        : search.priceMin != null
            ? resolveLanguageKey("labelPriceFrom").replace("{min}", String(search.priceMin))
            : search.priceMax != null
                ? resolveLanguageKey("labelPriceUpTo").replace("{max}", String(search.priceMax))
                : undefined;
    return [
        words.kindName ?? resolveLanguageKey("all"),
        search.query ? `“${search.query}”` : undefined,
        search.city,
        price,
        filterCount === 0 ? undefined : resolveLanguageKey(filterCount === 1 ? "labelFilterOne" : "labelFilters").replace("{count}", String(filterCount)),
    ].filter(Boolean).join(" · ").slice(0, 160);
}
