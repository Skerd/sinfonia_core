import {act, renderHook} from "@testing-library/react";
import {beforeEach, describe, expect, it} from "vitest";
import {usePersistedIdSet} from "./usePersistedIdSet.ts";

const KEY = "studio:test:set";

describe("usePersistedIdSet", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("starts empty and remembers what was toggled on", () => {
        const {result} = renderHook(() => usePersistedIdSet(KEY));
        expect(result.current.has("units")).toBe(false);

        act(() => result.current.toggle("units"));

        expect(result.current.has("units")).toBe(true);
        expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(["units"]);
    });

    it("restores the stored set on the next mount", () => {
        localStorage.setItem(KEY, JSON.stringify(["units", "projects"]));

        const {result} = renderHook(() => usePersistedIdSet(KEY));

        expect(result.current.has("units")).toBe(true);
        expect(result.current.has("projects")).toBe(true);
        expect(result.current.has("countries")).toBe(false);
    });

    it("toggles back off and drops the id from storage", () => {
        localStorage.setItem(KEY, JSON.stringify(["units"]));
        const {result} = renderHook(() => usePersistedIdSet(KEY));

        act(() => result.current.toggle("units"));

        expect(result.current.has("units")).toBe(false);
        expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual([]);
    });

    it("keeps `add` idempotent, so re-selecting the same model writes nothing", () => {
        const {result} = renderHook(() => usePersistedIdSet(KEY));
        act(() => result.current.add("units"));
        const first = result.current;

        act(() => result.current.add("units"));

        expect(result.current.has("units")).toBe(true);
        expect(result.current).toBe(first);
    });

    it("ignores a corrupt or non-array entry rather than throwing", () => {
        localStorage.setItem(KEY, "{not json");
        expect(renderHook(() => usePersistedIdSet(KEY)).result.current.has("units")).toBe(false);

        localStorage.setItem(KEY, JSON.stringify({units: true}));
        expect(renderHook(() => usePersistedIdSet(KEY)).result.current.has("units")).toBe(false);
    });
});
