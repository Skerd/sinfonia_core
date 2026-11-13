import L from "leaflet";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {settleMapAnimations} from "@coreModule/components/viewEngine/widgets/addresses/mapTeardown.ts";

/** A map whose zoom animation is in flight, started the way Leaflet starts one after a wheel zoom. */
function mapMidZoom(): L.Map {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const map = L.map(container, {center: [41.33, 19.82], zoom: 10});
    if (!("_animateZoom" in map) || typeof map._animateZoom !== "function") throw new Error("Leaflet has no _animateZoom");
    map._animateZoom(L.latLng(41.33, 19.82), 12, true);
    return map;
}

/** A wheel zoom waiting for its debounce, with the wheel's own timer. */
function mapMidWheel(): L.Map {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const map = L.map(container, {center: [41.33, 19.82], zoom: 10});
    const wheel = map.scrollWheelZoom;
    if (!("_onWheelScroll" in wheel) || typeof wheel._onWheelScroll !== "function") throw new Error("Leaflet has no _onWheelScroll");
    wheel._onWheelScroll(new WheelEvent("wheel", {deltaY: -120, clientX: 10, clientY: 10}));
    return map;
}

describe("settleMapAnimations (TD-F94)", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
        document.body.innerHTML = "";
    });

    it("a zoom animation's timer reaches a map removed without it", () => {
        const map = mapMidZoom();
        map.remove();
        expect(() => vi.advanceTimersByTime(300)).toThrow(/_leaflet_pos/);
    });

    it("finishes the zoom animation, so the removed map is never touched", () => {
        const map = mapMidZoom();
        settleMapAnimations(map);
        expect(map.getZoom()).toBe(12);
        map.remove();
        expect(() => vi.advanceTimersByTime(300)).not.toThrow();
    });

    it("a wheel zoom's debounce reaches a map removed without it", () => {
        const map = mapMidWheel();
        map.remove();
        expect(() => vi.advanceTimersByTime(300)).toThrow(/_leaflet_pos/);
    });

    it("drops a wheel zoom still waiting for its debounce", () => {
        const map = mapMidWheel();
        settleMapAnimations(map);
        map.remove();
        expect(() => vi.advanceTimersByTime(300)).not.toThrow();
    });
});
