import L from "leaflet";
import {render} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import SinglePinMap from "@coreModule/components/viewEngine/widgets/addresses/mapWithPins.tsx";

/** Every map the form pin map creates, so a test can start a zoom on it the way Leaflet does. */
const maps: L.Map[] = [];
L.Map.addInitHook(function (this: L.Map) {
    maps.push(this);
});

describe("SinglePinMap teardown (TD-F99)", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        maps.length = 0;
    });
    afterEach(() => {
        vi.useRealTimers();
        document.body.innerHTML = "";
    });

    it("settles a zoom animation in flight when it unmounts, so the removed map is never touched", () => {
        const view = render(<SinglePinMap latitude={41.33} longitude={19.82} />);
        const map = maps[0];
        if (!map || !("_animateZoom" in map) || typeof map._animateZoom !== "function") throw new Error("Leaflet has no _animateZoom");
        map._animateZoom(L.latLng(41.33, 19.82), 15, true);
        view.unmount();
        expect(() => vi.advanceTimersByTime(300)).not.toThrow();
    });

    it("drops a wheel zoom still waiting for its debounce when it unmounts", () => {
        const view = render(<SinglePinMap latitude={41.33} longitude={19.82} />);
        const wheel = maps[0]?.scrollWheelZoom;
        if (!wheel || !("_onWheelScroll" in wheel) || typeof wheel._onWheelScroll !== "function") throw new Error("Leaflet has no _onWheelScroll");
        wheel._onWheelScroll(new WheelEvent("wheel", {deltaY: -120, clientX: 10, clientY: 10}));
        view.unmount();
        expect(() => vi.advanceTimersByTime(300)).not.toThrow();
    });
});
