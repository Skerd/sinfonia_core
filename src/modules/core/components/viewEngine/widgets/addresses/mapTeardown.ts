import type {Map as LeafletMap} from "leaflet";

/**
 * Settles a Leaflet map's pending motion before the map is removed (TD-F68, TD-F94). Leaflet runs a wheel zoom after a
 * short debounce timer and ends a zoom animation on a 250 ms timer, and `remove()` cancels neither, so a sheet closed
 * right after a wheel zoom let them reach the removed map (`_leaflet_pos` of undefined). Leaflet has no public call for
 * this, so its internals are read by name and each step is skipped when a Leaflet version lacks them. Call it before
 * the map is removed (a layout-effect cleanup).
 */
export function settleMapAnimations(map: LeafletMap): void {
    // A zoom animation in flight: finish it now, so its timer finds nothing left to do.
    if ("_animatingZoom" in map && map._animatingZoom === true && "_onZoomTransitionEnd" in map && typeof map._onZoomTransitionEnd === "function") {
        map._onZoomTransitionEnd();
    }
    // A wheel zoom waiting for its debounce: with no wheel movement left, it zooms by nothing and stops.
    const wheel = map.scrollWheelZoom;
    if ("_delta" in wheel) wheel._delta = 0;
    map.stop();
}
