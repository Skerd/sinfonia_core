import {useEffect} from "react";
import {useSearchParams} from "react-router-dom";
import {promoteScopeParamsToQuickFilters, type ScopeQuickFilter} from "./filterUrl.ts";

/**
 * Move legacy `*Id` / `*Name` query params into `qf_*` and drop the legacy keys.
 * The quick filter then shows the scope and the user can clear it.
 * Embedded lists pass `enabled: false` so a parent route's query string is left alone.
 *
 * `useEffect` (not layout): a replace during the route's first layout pass is ignored
 * by the data router, so the legacy keys would stay and re-apply after the filter is cleared.
 */
export function usePromoteScopeToQuickFilters(scopes: readonly ScopeQuickFilter[], enabled = true) {
    const [searchParams, setSearchParams] = useSearchParams();
    const search = searchParams.toString();
    useEffect(() => {
        if (!enabled) return;
        const next = new URLSearchParams(search);
        if (!promoteScopeParamsToQuickFilters(next, scopes)) return;
        setSearchParams(next, {replace: true});
    }, [enabled, search, scopes, setSearchParams]);
}
