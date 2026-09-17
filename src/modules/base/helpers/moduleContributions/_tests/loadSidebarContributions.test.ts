import {afterEach, describe, expect, it, vi} from "vitest";
import type {NavGroup} from "@baseModule/helpers/types/sidebarNav.types.ts";
import type {ResolveLanguageKey} from "@baseModule/helpers/hocs/withLanguage.tsx";
import {createSidebarContributions} from "@baseModule/helpers/moduleContributions/loadSidebarContributions.ts";

const path = (pkg: string) => `/src/modules/${pkg}/clients/panel/sidebarContribution.tsx`;
const group = (title: string): NavGroup => ({title, items: [], permissions: [], usersPermissions: [], atLeastOnePermission: true});
const resolve = ((key: string) => `t:${key}`) as ResolveLanguageKey;
const titles = (groups: NavGroup[]) => groups.map((g) => g.title);

afterEach(() => {
    vi.restoreAllMocks();
});

describe("createSidebarContributions", () => {
    it("concatenates groups in contribution order", () => {
        const {getNavGroups} = createSidebarContributions({
            [path("late")]: {default: {id: "late", order: 90, getNavGroups: () => [group("L1"), group("L2")]}},
            [path("early")]: {default: [
                {id: "early", order: 10, getNavGroups: () => [group("E")]},
                {id: "empty", order: 50, getNavGroups: () => []},
            ]},
        });
        expect(titles(getNavGroups(resolve))).toEqual(["E", "L1", "L2"]);
    });

    it("passes the language resolver and context through, context being optional", () => {
        const hook = vi.fn((r: ResolveLanguageKey) => [group(String(r("x")))]);
        const {getNavGroups} = createSidebarContributions({[path("a")]: {default: {getNavGroups: hook}}});
        const context = {chatUnreadTotal: 3};

        expect(titles(getNavGroups(resolve, context))).toEqual(["t:x"]);
        expect(hook).toHaveBeenLastCalledWith(resolve, context);
        getNavGroups(resolve);
        expect(hook).toHaveBeenLastCalledWith(resolve, undefined);
    });

    it("calls hooks on every read (results depend on context), but parses the glob once", () => {
        const hook = vi.fn(() => [group("A")]);
        const {getNavGroups, list} = createSidebarContributions({[path("a")]: {default: {getNavGroups: hook}}});
        const first = list();
        getNavGroups(resolve);
        getNavGroups(resolve);
        expect(hook).toHaveBeenCalledTimes(2);
        expect(list()).toBe(first);
    });

    it("skips a throwing module and keeps the others", () => {
        const error = vi.spyOn(console, "error").mockImplementation(() => {});
        const {getNavGroups} = createSidebarContributions({
            [path("a")]: {default: {id: "broken", order: 1, getNavGroups: () => {
                throw new Error("boom");
            }}},
            [path("b")]: {default: {id: "fine", order: 2, getNavGroups: () => [group("B")]}},
        });
        expect(titles(getNavGroups(resolve))).toEqual(["B"]);
        expect(error).toHaveBeenCalledWith(expect.stringContaining(`"broken" threw`), expect.any(Error));
    });

    it("ignores a non-array result", () => {
        const error = vi.spyOn(console, "error").mockImplementation(() => {});
        const {getNavGroups} = createSidebarContributions({
            [path("a")]: {default: {id: "odd", getNavGroups: () => group("not an array")}},
            [path("b")]: {default: {id: "undef", getNavGroups: () => undefined}},
        });
        expect(getNavGroups(resolve)).toEqual([]);
        expect(error).toHaveBeenCalledTimes(1);
        expect(error.mock.calls[0][0]).toContain(`"odd" returned a non-array`);
    });

    it("returns nothing for an empty glob", () => {
        expect(createSidebarContributions({}).getNavGroups(resolve)).toEqual([]);
    });

    it.each([
        ["no hook", {id: "x"}],
        ["a non-function hook", {getNavGroups: []}],
    ])("rejects an entry with %s", (_label, entry) => {
        const {getNavGroups} = createSidebarContributions({[path("bad")]: {default: entry}});
        expect(() => getNavGroups(resolve)).toThrow(`[sidebarContribution] Invalid default export in ${path("bad")}`);
    });
});
