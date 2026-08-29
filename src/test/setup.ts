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

afterEach(() => {
    cleanup();
});
