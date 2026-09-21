import {act, renderHook} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";
import type {ReactNode} from "react";
import {MOBILE_BREAKPOINT, MobileOverrideContext, useIsMobile} from "@coreModule/helpers/hooks/useMobile.tsx";

/**
 * jsdom has no matchMedia. This fake answers `max-width` queries against a settable width and,
 * like a browser, returns a fresh list per call and notifies every list whose answer flips.
 */
function installMatchMedia(initialWidth: number) {
    let width = initialWidth;
    const lists: {query: string; listeners: Set<() => void>; last: boolean}[] = [];
    const matchesAt = (query: string) => width <= Number(/max-width:\s*(\d+)px/.exec(query)![1]);

    const matchMedia = vi.fn((query: string) => {
        const entry = {query, listeners: new Set<() => void>(), last: matchesAt(query)};
        lists.push(entry);
        return {
            media: query,
            get matches() { return matchesAt(query); },
            addEventListener: (_type: string, listener: () => void) => entry.listeners.add(listener),
            removeEventListener: (_type: string, listener: () => void) => entry.listeners.delete(listener),
        } as unknown as MediaQueryList;
    });
    vi.stubGlobal("matchMedia", matchMedia);

    return {
        matchMedia,
        resize(next: number) {
            width = next;
            act(() => {
                for (const entry of lists) {
                    const now = matchesAt(entry.query);
                    if (now === entry.last) continue;
                    entry.last = now;
                    entry.listeners.forEach((listener) => listener());
                }
            });
        },
        listenerCount: () => lists.reduce((sum, entry) => sum + entry.listeners.size, 0),
    };
}

const withOverride = (value: boolean | null) => ({children}: {children: ReactNode}) => (
    <MobileOverrideContext.Provider value={value}>{children}</MobileOverrideContext.Provider>
);

describe("useIsMobile", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("queries strictly below the breakpoint", () => {
        const {matchMedia} = installMatchMedia(1024);
        renderHook(() => useIsMobile());

        expect(MOBILE_BREAKPOINT).toBe(768);
        expect(matchMedia).toHaveBeenCalledWith("(max-width: 767px)");
    });

    it.each([
        [390, true],
        [767, true],
        [768, false],
        [1440, false],
    ])("answers from the viewport on first render (width %i → %s)", (width, expected) => {
        installMatchMedia(width);
        const {result} = renderHook(() => useIsMobile());
        expect(result.current).toBe(expected);
    });

    it("updates when the viewport crosses the breakpoint", () => {
        const media = installMatchMedia(1024);
        const {result} = renderHook(() => useIsMobile());
        expect(result.current).toBe(false);

        media.resize(500);
        expect(result.current).toBe(true);

        media.resize(900);
        expect(result.current).toBe(false);
    });

    it("stops listening on unmount", () => {
        const media = installMatchMedia(1024);
        const {unmount} = renderHook(() => useIsMobile());
        expect(media.listenerCount()).toBeGreaterThan(0);

        unmount();
        expect(media.listenerCount()).toBe(0);
    });

    it.each([true, false])("returns the override (%s) regardless of the viewport", (override) => {
        const media = installMatchMedia(override ? 1440 : 390);
        const {result} = renderHook(() => useIsMobile(), {wrapper: withOverride(override)});
        expect(result.current).toBe(override);

        media.resize(override ? 390 : 1440);
        expect(result.current).toBe(override);
    });

    it("falls back to the viewport when the override is null", () => {
        installMatchMedia(390);
        const {result} = renderHook(() => useIsMobile(), {wrapper: withOverride(null)});
        expect(result.current).toBe(true);
    });

    it("returns false without throwing when matchMedia is unavailable", () => {
        vi.stubGlobal("matchMedia", undefined);
        const {result, unmount} = renderHook(() => useIsMobile());
        expect(result.current).toBe(false);
        expect(() => unmount()).not.toThrow();
    });
});
