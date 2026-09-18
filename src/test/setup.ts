/**
 * Vitest setup, referenced by `setupFiles` in `vitest.config.ts`.
 *
 * `@testing-library/jest-dom` extends `expect` with DOM matchers (`toBeInTheDocument`,
 * `toHaveClass`, …); `cleanup` unmounts anything a test rendered so component tests
 * cannot leak DOM into each other.
 */
import "@testing-library/jest-dom/vitest";
import {cleanup} from "@testing-library/react";
import {afterEach} from "vitest";

/**
 * jsdom has no layout, so it has no ResizeObserver. Stubbed globally (rather than
 * per test file) because it's a gap in the jsdom environment itself, not in any one
 * component under test -- any component that measures its own size (TruncatedValue,
 * DeviceFrame, …) needs this, and the set of such components only grows over time.
 */
globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
} as unknown as typeof ResizeObserver;

afterEach(() => {
    cleanup();
});
