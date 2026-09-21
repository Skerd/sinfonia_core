import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {
    createContributionList,
    describeContribution,
    getOwn,
    isComponentLike,
    isOptionalRecordOf,
    isPlainObject,
    mergeRecords,
    resetContributionWarnings,
    safeInvoke,
    type ContributionBase,
} from "@coreModule/helpers/moduleContributions/contributionRegistry.ts";

type Entry = ContributionBase & {name?: string};

const path = (pkg: string, file = "x.ts") => `/src/modules/${pkg}/clients/panel/${file}`;
const listOf = (glob: Record<string, unknown>, isValid: (entry: Record<string, unknown>) => boolean = () => true) =>
    createContributionList<Entry>({kind: "testContribution", glob, isValid});
const names = (entries: readonly Entry[]) => entries.map((entry) => entry.name);

beforeEach(() => {
    resetContributionWarnings();
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
});

describe("createContributionList: default export", () => {
    it.each([undefined, null])("treats a %s default export as no contributions", (exported) => {
        expect(listOf({[path("a")]: {default: exported}})()).toEqual([]);
    });

    it("tolerates a module with no default export at all", () => {
        expect(listOf({[path("a")]: {}, [path("b")]: null})()).toEqual([]);
    });

    it("accepts a single object and an array", () => {
        const list = listOf({
            [path("a")]: {default: {name: "single"}},
            [path("b")]: {default: [{name: "first"}, {name: "second"}]},
        });
        expect(names(list())).toEqual(["single", "first", "second"]);
    });

    it("accepts an empty array", () => {
        expect(listOf({[path("a")]: {default: []}})()).toEqual([]);
    });

    it.each([
        ["a string", "nope"],
        ["a number", 42],
        ["a function", () => ({})],
        ["a class instance", new Map()],
    ])("rejects %s, naming the file", (_label, exported) => {
        expect(() => listOf({[path("bad")]: {default: exported}})()).toThrow(
            `[testContribution] Invalid default export in ${path("bad")}`,
        );
    });

    it("rejects a bad array entry, naming the file and index", () => {
        expect(() => listOf({[path("bad")]: {default: [{name: "ok"}, null]}})()).toThrow(
            `[testContribution] Invalid entry at ${path("bad")}[1]`,
        );
        expect(() => listOf({[path("bad")]: {default: [{}, [], {}]}})()).toThrow(`${path("bad")}[1]`);
    });

    it.each([
        ["a non-string id", {id: 5}],
        ["a non-number order", {order: "1"}],
        ["a NaN order", {order: Number.NaN}],
        ["an infinite order", {order: Number.POSITIVE_INFINITY}],
    ])("rejects %s", (_label, entry) => {
        expect(() => listOf({[path("bad")]: {default: entry}})()).toThrow("Invalid default export");
    });

    it("applies the kind-specific guard to single and array exports", () => {
        const isValid = (entry: Record<string, unknown>) => typeof entry.name === "string";
        expect(() => listOf({[path("a")]: {default: {}}}, isValid)()).toThrow("Invalid default export");
        expect(() => listOf({[path("a")]: {default: [{name: "x"}, {}]}}, isValid)()).toThrow("Invalid entry at");
    });

    it("does not parse until first read", () => {
        const isValid = vi.fn(() => true);
        const list = listOf({[path("a")]: {default: {}}}, isValid);
        expect(isValid).not.toHaveBeenCalled();
        list();
        expect(isValid).toHaveBeenCalledTimes(1);
    });
});

describe("createContributionList: ordering", () => {
    it("sorts by order, treating a missing order as 100", () => {
        const list = listOf({
            [path("a")]: {default: {name: "default", id: "a"}},
            [path("b")]: {default: {name: "late", order: 101}},
            [path("c")]: {default: {name: "early", order: 99}},
            [path("d")]: {default: {name: "negative", order: -5}},
            [path("e")]: {default: {name: "fraction", order: 99.5}},
        });
        expect(names(list())).toEqual(["negative", "early", "fraction", "default", "late"]);
    });

    it("breaks ties by id, with a missing id first", () => {
        const list = listOf({
            [path("a")]: {default: [{name: "zeta", id: "zeta"}, {name: "alpha", id: "alpha"}, {name: "none"}]},
        });
        expect(names(list())).toEqual(["none", "alpha", "zeta"]);
    });

    it("breaks remaining ties by file path, then array index, regardless of glob order", () => {
        const list = listOf({
            [path("zzz")]: {default: {name: "z"}},
            [path("aaa")]: {default: [{name: "a1"}, {name: "a2"}]},
        });
        expect(names(list())).toEqual(["a1", "a2", "z"]);
    });
});

describe("createContributionList: caching and diagnostics", () => {
    it("memoizes a frozen result", () => {
        const list = listOf({[path("a")]: {default: {name: "x"}}});
        const first = list();
        expect(list()).toBe(first);
        expect(Object.isFrozen(first)).toBe(true);
    });

    it("warns once per duplicate id in dev", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const glob = {
            [path("a")]: {default: {id: "same"}},
            [path("b")]: {default: {id: "same"}},
        };
        listOf(glob)();
        listOf(glob)();
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toContain(`Duplicate id "same" in ${path("a")} and ${path("b")}`);
    });

    it("does not warn outside dev", () => {
        vi.stubEnv("DEV", false);
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        listOf({[path("a")]: {default: [{id: "same"}, {id: "same"}]}})();
        expect(warn).not.toHaveBeenCalled();
    });

    it("describes an entry by id, else by source file", () => {
        // The id-less entry sorts first.
        const [anonymous, named] = listOf({
            [path("a")]: {default: {id: "named"}},
            [path("b")]: {default: {}},
        })();
        expect(describeContribution(named)).toBe("named");
        expect(describeContribution(anonymous)).toBe(path("b"));
        expect(describeContribution({})).toBe("(anonymous)");
    });
});

describe("safeInvoke", () => {
    it("returns the hook's value", () => {
        expect(safeInvoke("k", {id: "m"}, () => 7)).toBe(7);
    });

    it("logs and swallows errors", () => {
        const error = vi.spyOn(console, "error").mockImplementation(() => {});
        const boom = new Error("boom");
        expect(safeInvoke("k", {id: "m"}, () => {
            throw boom;
        })).toBeUndefined();
        expect(error).toHaveBeenCalledWith(expect.stringContaining(`[k] "m" threw`), boom);
    });
});

describe("mergeRecords", () => {
    it("merges in order, later sources winning", () => {
        const merged = mergeRecords("k", [
            {source: {id: "a"}, record: {x: 1, y: 1}},
            {source: {id: "b"}, record: undefined},
            {source: {id: "c"}, record: {}},
            {source: {id: "d"}, record: {y: 2, z: 2}},
        ]);
        expect({...merged}).toEqual({x: 1, y: 2, z: 2});
        expect(Object.isFrozen(merged)).toBe(true);
    });

    it("warns when a different source overrides a key", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        mergeRecords("k", [{source: {id: "a"}, record: {y: 1}}, {source: {id: "b"}, record: {y: 2}}]);
        expect(warn).toHaveBeenCalledWith(`[k] "b" overrides key "y" from "a".`);
    });

    it("drops reserved keys with a warning", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const merged = mergeRecords("k", [{source: {id: "a"}, record: {login: 1, other: 2}}], new Set(["login"]));
        expect({...merged}).toEqual({other: 2});
        expect(warn).toHaveBeenCalledWith(expect.stringContaining(`cannot override the core key "login"`));
    });

    it("has no prototype, so inherited names miss", () => {
        const merged = mergeRecords<number>("k", [{source: {}, record: {a: 1}}]);
        for (const key of ["constructor", "toString", "hasOwnProperty", "__proto__", "valueOf"]) {
            expect(merged[key]).toBeUndefined();
        }
    });

    it("keeps an own `__proto__` key as data without touching any prototype", () => {
        const record = JSON.parse('{"__proto__": {"polluted": true}, "a": 1}') as Record<string, unknown>;
        const merged = mergeRecords("k", [{source: {}, record}]);
        expect(Object.getPrototypeOf(merged)).toBeNull();
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
        expect(getOwn(merged, "a")).toBe(1);
    });
});

describe("guards", () => {
    it("isPlainObject accepts literals and null-prototype objects only", () => {
        expect(isPlainObject({})).toBe(true);
        expect(isPlainObject(Object.create(null))).toBe(true);
        for (const value of [null, undefined, [], "x", 1, new Date(), new Map(), () => {}]) {
            expect(isPlainObject(value)).toBe(false);
        }
    });

    it("isComponentLike accepts functions and React exotic objects", () => {
        expect(isComponentLike(() => null)).toBe(true);
        expect(isComponentLike({$$typeof: Symbol.for("react.memo")})).toBe(true);
        expect(isComponentLike({})).toBe(false);
        expect(isComponentLike("div")).toBe(false);
        expect(isComponentLike(null)).toBe(false);
    });

    it("isOptionalRecordOf checks every value", () => {
        const isNumber = (v: unknown) => typeof v === "number";
        expect(isOptionalRecordOf(undefined, isNumber)).toBe(true);
        expect(isOptionalRecordOf({}, isNumber)).toBe(true);
        expect(isOptionalRecordOf({a: 1, b: 2}, isNumber)).toBe(true);
        expect(isOptionalRecordOf({a: 1, b: "2"}, isNumber)).toBe(false);
        expect(isOptionalRecordOf(null, isNumber)).toBe(false);
        expect(isOptionalRecordOf([1], isNumber)).toBe(false);
    });

    it("getOwn ignores inherited properties", () => {
        expect(getOwn({a: 1}, "a")).toBe(1);
        expect(getOwn({a: 1}, "constructor")).toBeUndefined();
    });
});
