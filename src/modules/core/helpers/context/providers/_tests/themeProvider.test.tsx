import {act, renderHook} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import type {ReactNode} from "react";
import {isTheme, THEME_STORAGE_KEY, ThemeProvider, useTheme, useThemeOptional, type Theme} from "@coreModule/helpers/context/providers/theme-provider.tsx";
import {resetLocalStorageMemoryFallback} from "@coreModule/helpers/context/localStorage/localStorageProvider.ts";
import {writeFromAnotherTab} from "./storageUtils.ts";

const root = () => document.documentElement;

/** A controllable `prefers-color-scheme: dark` media query. */
function mockSystemScheme(initiallyDark: boolean) {
    let matches = initiallyDark;
    const listeners = new Set<() => void>();
    const mediaQuery = {
        get matches() { return matches; },
        media: "(prefers-color-scheme: dark)",
        addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
        removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
    };
    vi.stubGlobal("matchMedia", vi.fn(() => mediaQuery));

    return {
        setDark(next: boolean) {
            act(() => {
                matches = next;
                listeners.forEach((listener) => listener());
            });
        },
        listenerCount: () => listeners.size,
    };
}

function renderTheme(defaultTheme?: Theme) {
    const wrapper = ({children}: {children: ReactNode}) => <ThemeProvider defaultTheme={defaultTheme}>{children}</ThemeProvider>;
    return renderHook(() => useTheme(), {wrapper});
}

beforeEach(() => {
    localStorage.clear();
    resetLocalStorageMemoryFallback();
    root().className = "";
    root().style.colorScheme = "";
    document.head.innerHTML = "";
    mockSystemScheme(false);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe("isTheme", () => {
    it("accepts only known themes", () => {
        expect(["dark", "light", "system"].every(isTheme)).toBe(true);
        expect(isTheme("sepia")).toBe(false);
        expect(isTheme(undefined)).toBe(false);
    });
});

describe("ThemeProvider", () => {
    it("defaults to system and resolves it from the OS", () => {
        mockSystemScheme(true);

        const {result} = renderTheme();

        expect(result.current.theme).toBe("system");
        expect(result.current.defaultTheme).toBe("system");
        expect(result.current.resolvedTheme).toBe("dark");
        expect(root()).toHaveClass("dark");
        expect(root()).not.toHaveClass("light");
        expect(root().style.colorScheme).toBe("dark");
    });

    it("restores a persisted theme and ignores invalid ones", () => {
        localStorage.setItem(THEME_STORAGE_KEY, "dark");
        expect(renderTheme("light").result.current.theme).toBe("dark");

        localStorage.setItem(THEME_STORAGE_KEY, "sepia");
        expect(renderTheme("light").result.current.theme).toBe("light");
    });

    it("persists explicit choices and swaps the root class", () => {
        const {result} = renderTheme();

        act(() => result.current.setTheme("dark"));

        expect(result.current.theme).toBe("dark");
        expect(result.current.resolvedTheme).toBe("dark");
        expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
        expect(root()).toHaveClass("dark");
        expect(root()).not.toHaveClass("light");

        act(() => result.current.setTheme("light"));

        expect(root()).toHaveClass("light");
        expect(root()).not.toHaveClass("dark");
        expect(root().style.colorScheme).toBe("light");
    });

    it("updates resolvedTheme when the OS scheme flips while following the system", () => {
        const system = mockSystemScheme(false);
        const {result} = renderTheme();
        expect(result.current.resolvedTheme).toBe("light");

        system.setDark(true);

        expect(result.current.theme).toBe("system");
        expect(result.current.resolvedTheme).toBe("dark");
        expect(root()).toHaveClass("dark");
    });

    it("ignores OS flips while an explicit theme is chosen", () => {
        const system = mockSystemScheme(false);
        const {result} = renderTheme();
        act(() => result.current.setTheme("light"));

        system.setDark(true);

        expect(result.current.resolvedTheme).toBe("light");
        expect(root()).toHaveClass("light");
    });

    it("unsubscribes from the media query on unmount", () => {
        const system = mockSystemScheme(false);
        const {unmount} = renderTheme();
        expect(system.listenerCount()).toBeGreaterThan(0);

        unmount();

        expect(system.listenerCount()).toBe(0);
    });

    it("resetTheme clears storage and returns to the default", () => {
        const {result} = renderTheme("light");
        act(() => result.current.setTheme("dark"));

        act(() => result.current.resetTheme());

        expect(result.current.theme).toBe("light");
        expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
        expect(root()).toHaveClass("light");
    });

    it("syncs the theme-color meta tag with the resolved background", () => {
        document.head.innerHTML = `<meta name="theme-color" content="initial">`;
        document.body.style.backgroundColor = "rgb(1, 2, 3)";

        renderTheme("dark");

        expect(document.querySelector("meta[name='theme-color']")).toHaveAttribute("content", "rgb(1, 2, 3)");
        document.body.style.backgroundColor = "";
    });

    it("falls back to light when matchMedia is unavailable", () => {
        vi.stubGlobal("matchMedia", undefined);

        const {result} = renderTheme();

        expect(result.current.resolvedTheme).toBe("light");
    });

    it("follows theme changes made in another tab", () => {
        const {result} = renderTheme();

        writeFromAnotherTab(THEME_STORAGE_KEY, "dark");

        expect(result.current.theme).toBe("dark");
        expect(root()).toHaveClass("dark");
    });

    it("keeps a stable context value across unrelated re-renders", () => {
        const {result, rerender} = renderTheme();
        const first = result.current;

        rerender();

        expect(result.current).toBe(first);
    });
});

describe("useTheme / useThemeOptional", () => {
    it("useTheme throws outside the provider", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});

        expect(() => renderHook(() => useTheme())).toThrow("useTheme must be used within a ThemeProvider");
    });

    it("useThemeOptional returns undefined outside the provider", () => {
        expect(renderHook(() => useThemeOptional()).result.current).toBeUndefined();
    });
});
