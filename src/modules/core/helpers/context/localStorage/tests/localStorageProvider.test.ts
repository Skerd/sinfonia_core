import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {
    getLocalStorage,
    getLocalStorageJson,
    getLocalStorageValue,
    removeLocalStorageValue,
    resetLocalStorageMemoryFallback,
    setLocalStorageJson,
    setLocalStorageValue,
} from "@coreModule/helpers/context/localStorage/localStorageProvider.ts";

const blocked = () => new DOMException("blocked", "SecurityError");
const isNumberList = (value: unknown): value is number[] => Array.isArray(value) && value.every((item) => typeof item === "number");

beforeEach(() => {
    localStorage.clear();
    resetLocalStorageMemoryFallback();
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe("with working storage", () => {
    it("reads, writes and removes values", () => {
        expect(getLocalStorageValue("k")).toBeNull();

        expect(setLocalStorageValue("k", "v")).toBe(true);
        expect(localStorage.getItem("k")).toBe("v");
        expect(getLocalStorageValue("k")).toBe("v");

        removeLocalStorageValue("k");
        expect(getLocalStorageValue("k")).toBeNull();
    });

    it("returns the window's storage", () => {
        expect(getLocalStorage()).toBe(localStorage);
    });

    it("round-trips JSON", () => {
        expect(setLocalStorageJson("list", [1, 2])).toBe(true);
        expect(localStorage.getItem("list")).toBe("[1,2]");
        expect(getLocalStorageJson("list", isNumberList)).toEqual([1, 2]);
    });

    it("returns null for missing or invalid JSON values but keeps parsable ones", () => {
        expect(getLocalStorageJson("list", isNumberList)).toBeNull();

        localStorage.setItem("list", `["a"]`);
        expect(getLocalStorageJson("list", isNumberList)).toBeNull();
        expect(localStorage.getItem("list")).toBe(`["a"]`);
    });

    it("removes unparsable JSON so it stops failing", () => {
        localStorage.setItem("list", "{not json");

        expect(getLocalStorageJson("list", isNumberList)).toBeNull();
        expect(localStorage.getItem("list")).toBeNull();
    });
});

describe("when storage is blocked", () => {
    beforeEach(() => {
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw blocked(); });
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw blocked(); });
        vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw blocked(); });
    });

    it("never throws and keeps values in memory for the page's life", () => {
        expect(getLocalStorageValue("k")).toBeNull();

        expect(setLocalStorageValue("k", "v")).toBe(false);
        expect(getLocalStorageValue("k")).toBe("v");

        expect(() => removeLocalStorageValue("k")).not.toThrow();
        expect(getLocalStorageValue("k")).toBeNull();
    });

    it("handles JSON through the same fallback", () => {
        expect(setLocalStorageJson("list", [3])).toBe(false);
        expect(getLocalStorageJson("list", isNumberList)).toEqual([3]);
    });
});

describe("when the window's storage getter throws", () => {
    it("reports no storage and falls back to memory", () => {
        vi.spyOn(window, "localStorage", "get").mockImplementation(() => { throw blocked(); });

        expect(getLocalStorage()).toBeNull();
        expect(setLocalStorageValue("k", "v")).toBe(false);
        expect(getLocalStorageValue("k")).toBe("v");
    });
});

describe("when the quota is exceeded", () => {
    it("serves the newer in-memory value over the stale stored one and drops the stale copy", () => {
        localStorage.setItem("k", "old");
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new DOMException("full", "QuotaExceededError");
        });

        expect(setLocalStorageValue("k", "new")).toBe(false);

        expect(getLocalStorageValue("k")).toBe("new");
        expect(localStorage.getItem("k")).toBeNull();
    });

    it("prefers storage again once a later write succeeds", () => {
        const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
            throw new DOMException("full", "QuotaExceededError");
        });
        setLocalStorageValue("k", "memory");

        expect(setLocalStorageValue("k", "stored")).toBe(true);
        expect(setItem).toHaveBeenCalledTimes(2);

        localStorage.setItem("k", "changed elsewhere");
        expect(getLocalStorageValue("k")).toBe("changed elsewhere");
    });
});
