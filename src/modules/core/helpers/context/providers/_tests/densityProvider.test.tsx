import {act, renderHook} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import type {ReactNode} from "react";
import {DENSITY_STORAGE_KEY, DensityProvider, isDensity, useDensity, type Density} from "@coreModule/helpers/context/providers/density-provider.tsx";
import {resetLocalStorageMemoryFallback} from "@coreModule/helpers/context/localStorage/localStorageProvider.ts";
import {writeFromAnotherTab} from "./storageUtils.ts";

const root = () => document.documentElement;

function renderDensity(defaultDensity?: Density) {
    const wrapper = ({children}: {children: ReactNode}) => <DensityProvider defaultDensity={defaultDensity}>{children}</DensityProvider>;
    return renderHook(() => useDensity(), {wrapper});
}

beforeEach(() => {
    localStorage.clear();
    resetLocalStorageMemoryFallback();
    root().removeAttribute("data-density");
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("isDensity", () => {
    it("accepts only known densities", () => {
        expect(isDensity("comfortable")).toBe(true);
        expect(isDensity("compact")).toBe(true);
        expect(isDensity("cosy")).toBe(false);
        expect(isDensity(null)).toBe(false);
        expect(isDensity(1)).toBe(false);
    });
});

describe("DensityProvider", () => {
    it("defaults to comfortable, expressed as no attribute", () => {
        const {result} = renderDensity();

        expect(result.current.density).toBe("comfortable");
        expect(root()).not.toHaveAttribute("data-density");
    });

    it("honours a custom default", () => {
        const {result} = renderDensity("compact");

        expect(result.current.density).toBe("compact");
        expect(root()).toHaveAttribute("data-density", "compact");
    });

    it("restores the persisted density on first render", () => {
        localStorage.setItem(DENSITY_STORAGE_KEY, "compact");

        const {result} = renderDensity();

        expect(result.current.density).toBe("compact");
        expect(root()).toHaveAttribute("data-density", "compact");
    });

    it("ignores an invalid persisted value", () => {
        localStorage.setItem(DENSITY_STORAGE_KEY, "tiny");

        const {result} = renderDensity();

        expect(result.current.density).toBe("comfortable");
    });

    it("persists and applies changes, removing the attribute for comfortable", () => {
        const {result} = renderDensity();

        act(() => result.current.setDensity("compact"));
        expect(result.current.density).toBe("compact");
        expect(localStorage.getItem(DENSITY_STORAGE_KEY)).toBe("compact");
        expect(root()).toHaveAttribute("data-density", "compact");

        act(() => result.current.setDensity("comfortable"));
        expect(localStorage.getItem(DENSITY_STORAGE_KEY)).toBe("comfortable");
        expect(root()).not.toHaveAttribute("data-density");
    });

    it("keeps a stable context value across unrelated re-renders", () => {
        const {result, rerender} = renderDensity();
        const first = result.current;

        rerender();

        expect(result.current).toBe(first);
    });

    it("follows changes made in another tab", () => {
        const {result} = renderDensity();

        writeFromAnotherTab(DENSITY_STORAGE_KEY, "compact");
        expect(result.current.density).toBe("compact");
        expect(root()).toHaveAttribute("data-density", "compact");

        writeFromAnotherTab(DENSITY_STORAGE_KEY, "bogus");
        expect(result.current.density).toBe("comfortable");

        writeFromAnotherTab(DENSITY_STORAGE_KEY, "compact");
        writeFromAnotherTab(null, null);
        expect(result.current.density).toBe("comfortable");
    });

    it("ignores storage events for other keys and other storage areas", () => {
        const {result} = renderDensity();

        writeFromAnotherTab("some-other-key", "compact");
        act(() => {
            window.dispatchEvent(new StorageEvent("storage", {key: DENSITY_STORAGE_KEY, newValue: "compact", storageArea: sessionStorage}));
        });

        expect(result.current.density).toBe("comfortable");
    });

    it("still works when storage is unavailable", () => {
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new DOMException("blocked", "SecurityError");
        });
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new DOMException("full", "QuotaExceededError");
        });

        const {result} = renderDensity();
        expect(result.current.density).toBe("comfortable");

        act(() => result.current.setDensity("compact"));
        expect(result.current.density).toBe("compact");
    });

    it("throws a helpful error outside the provider", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});

        expect(() => renderHook(() => useDensity())).toThrow("useDensity must be used within a DensityProvider");
    });
});
