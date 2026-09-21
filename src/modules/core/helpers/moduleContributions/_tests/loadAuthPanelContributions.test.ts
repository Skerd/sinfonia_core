import {lazy, memo} from "react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {createAuthPanelContributions} from "@coreModule/helpers/moduleContributions/loadAuthPanelContributions.ts";
import {resetContributionWarnings} from "@coreModule/helpers/moduleContributions/contributionRegistry.ts";
import {CORE_AUTH_PANEL_KEYS} from "@coreModule/helpers/moduleContributions/coreAuthPanelKeys.ts";

const path = (pkg: string) => `/src/modules/${pkg}/clients/panel/authPanelContribution.tsx`;
const First = () => null;
const Second = () => null;
const Other = () => null;

beforeEach(() => {
    resetContributionWarnings();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("createAuthPanelContributions", () => {
    it("merges panels, the higher order winning on the same key", () => {
        const {getComponents, resolve} = createAuthPanelContributions({
            [path("b")]: {default: {id: "b", order: 50, panels: {shared: Second}}},
            [path("a")]: {default: {id: "a", order: 10, panels: {shared: First, other: Other}}},
        });
        expect(resolve("shared")).toBe(Second);
        expect(resolve("other")).toBe(Other);
        expect(Object.keys(getComponents()).sort()).toEqual(["other", "shared"]);
    });

    it("memoizes the merged map", () => {
        const {getComponents} = createAuthPanelContributions({[path("a")]: {default: {panels: {x: First}}}});
        expect(getComponents()).toBe(getComponents());
    });

    it.each([undefined, ""])("resolves %j to undefined", (panel) => {
        const {resolve} = createAuthPanelContributions({[path("a")]: {default: {panels: {"": First}}}});
        expect(resolve(panel)).toBeUndefined();
    });

    it("returns undefined for unknown keys", () => {
        expect(createAuthPanelContributions({}).resolve("missing")).toBeUndefined();
    });

    it.each(["constructor", "toString", "__proto__", "hasOwnProperty", "valueOf", "isPrototypeOf"])(
        "never resolves the inherited name %j (would crash the auth page)",
        (panel) => {
            const {resolve} = createAuthPanelContributions({[path("a")]: {default: {panels: {real: First}}}});
            expect(resolve(panel)).toBeUndefined();
        },
    );

    it("ignores module panels that reuse a core key, with a warning", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const {resolve} = createAuthPanelContributions({
            [path("a")]: {default: {id: "hijack", panels: {login: First, fine: Other}}},
        });
        expect(resolve("login")).toBeUndefined();
        expect(resolve("fine")).toBe(Other);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining(`"hijack" cannot override the core key "login"`));
    });

    it("reserves every core key by default, and accepts a custom reserved set", () => {
        vi.spyOn(console, "warn").mockImplementation(() => {});
        const panels = Object.fromEntries(CORE_AUTH_PANEL_KEYS.map((key) => [key, First]));
        expect(Object.keys(createAuthPanelContributions({[path("a")]: {default: {panels}}}).getComponents())).toEqual([]);

        const custom = createAuthPanelContributions({[path("a")]: {default: {panels: {login: First, x: Other}}}}, new Set(["x"]));
        expect(custom.resolve("login")).toBe(First);
        expect(custom.resolve("x")).toBeUndefined();
    });

    it("accepts memo and lazy components", () => {
        const Memo = memo(First);
        const Lazy = lazy(async () => ({default: First}));
        const {resolve} = createAuthPanelContributions({[path("a")]: {default: {panels: {memo: Memo, lazy: Lazy}}}});
        expect(resolve("memo")).toBe(Memo);
        expect(resolve("lazy")).toBe(Lazy);
    });

    it.each([
        ["no panels", {id: "x"}],
        ["panels as an array", {panels: [First]}],
        ["panels as null", {panels: null}],
        ["a non-component value", {panels: {x: "div"}}],
        ["a plain-object value", {panels: {x: {}}}],
    ])("rejects %s", (_label, entry) => {
        const {resolve} = createAuthPanelContributions({[path("bad")]: {default: entry}});
        expect(() => resolve("x")).toThrow(`[authPanelContribution] Invalid default export in ${path("bad")}`);
    });
});
