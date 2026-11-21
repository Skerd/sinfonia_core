import {renderHook} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {useFadeInOnChange} from "@coreModule/helpers/hooks/useFadeInOnChange.ts";

describe("useFadeInOnChange", () => {
    const animate = vi.fn();
    let element: HTMLDivElement;

    beforeEach(() => {
        animate.mockReset();
        element = document.createElement("div");
        // A test DOM has no Web Animations or media queries.
        Object.defineProperty(element, "animate", {value: animate});
        vi.stubGlobal("matchMedia", vi.fn(() => ({matches: false})));
    });
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    const mount = (page: string, options?: Parameters<typeof useFadeInOnChange>[2]) => renderHook(
        ({current}) => useFadeInOnChange({current: element}, current, options),
        {initialProps: {current: page}},
    );

    it("fades a new page in, not the first one unless asked", () => {
        const view = mount("/a");
        expect(animate).not.toHaveBeenCalled();
        view.rerender({current: "/b"});
        expect(animate).toHaveBeenCalledTimes(1);
        expect(animate.mock.calls[0][0]).toEqual([{opacity: 0}, {opacity: 1}]);

        animate.mockReset();
        mount("/a", {first: true});
        expect(animate).toHaveBeenCalledTimes(1);
    });

    it("leaves a change the caller skips alone, and rises when asked", () => {
        const skip = (previous: string, next: string) => previous.startsWith("/account") && next.startsWith("/account");
        const view = mount("/account/profile", {skip, rise: true});
        view.rerender({current: "/account/security"});
        expect(animate).not.toHaveBeenCalled();
        view.rerender({current: "/orders"});
        expect(animate.mock.calls[0][0]).toEqual([{opacity: 0, transform: "translateY(8px)"}, {opacity: 1, transform: "none"}]);
    });

    it("moves nothing for a visitor who asked for less motion", () => {
        vi.stubGlobal("matchMedia", vi.fn(() => ({matches: true})));
        const view = mount("/a");
        view.rerender({current: "/b"});
        expect(animate).not.toHaveBeenCalled();
    });
});
