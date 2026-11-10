import {afterEach, describe, expect, it, vi} from "vitest";
import {createStudioRouteContributions} from "@coreModule/helpers/moduleContributions/loadStudioRouteContributions.ts";
import {resetContributionWarnings} from "@coreModule/helpers/moduleContributions/contributionRegistry.ts";
import {setCompanyModules} from "@coreModule/helpers/modules/enabledModules.ts";

const path = (pkg: string) => `/src/modules/${pkg}/clients/studio/routeConfigContribution.tsx`;
const Page = () => null;

afterEach(() => {
    resetContributionWarnings();
    setCompanyModules(null);
    vi.restoreAllMocks();
});

describe("createStudioRouteContributions", () => {
    it("lists every page in contribution order, with normalized paths", () => {
        const {pages} = createStudioRouteContributions({
            [path("b")]: {default: {id: "b", order: 2, pages: [{path: "/b/map/", title: "B map", Page}]}},
            [path("a")]: {default: {id: "a", order: 1, pages: [
                {path: "a/flows", title: "A flows", Page},
                {path: "a/map", title: "A map", Page},
            ]}},
        });

        expect(pages().map((page) => [page.path, page.title])).toEqual([
            ["a/flows", "A flows"],
            ["a/map", "A map"],
            ["b/map", "B map"],
        ]);
        expect(pages()[0]!.Page).toBe(Page);
    });

    it("keeps the same array until the contributions change", () => {
        const {pages} = createStudioRouteContributions({[path("a")]: {default: {pages: [{path: "a", title: "A", Page}]}}});
        expect(pages()).toBe(pages());
    });

    it("drops core Studio paths and repeated paths, with a warning", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const {pages} = createStudioRouteContributions({
            [path("a")]: {default: {id: "a", order: 1, pages: [
                {path: "gallery", title: "Taken", Page},
                {path: "authenticate/login", title: "Taken too", Page},
                {path: "shared", title: "First", Page},
            ]}},
            [path("b")]: {default: {id: "b", order: 2, pages: [{path: "/shared", title: "Second", Page}]}},
        });

        expect(pages().map((page) => page.title)).toEqual(["First"]);
        if (import.meta.env.DEV) {
            expect(warn).toHaveBeenCalledTimes(3);
        }
    });

    it("has no pages without contributions, or for a module that exports nothing", () => {
        expect(createStudioRouteContributions({}).pages()).toEqual([]);
        expect(createStudioRouteContributions({[path("a")]: {default: undefined}}).pages()).toEqual([]);
    });

    it("keeps pages of modules the signed-in company does not have (the Studio's installed scope)", () => {
        const {pages} = createStudioRouteContributions({[path("fixtureModule")]: {default: {pages: [{path: "x", title: "X", Page}]}}});
        setCompanyModules([]);
        expect(pages()).toHaveLength(1);
    });

    it.each([
        ["no pages", {}],
        ["an empty path", {pages: [{path: "/", title: "Root", Page}]}],
        ["a missing title", {pages: [{path: "x", Page}]}],
        ["a non-component page", {pages: [{path: "x", title: "X", Page: "nope"}]}],
    ])("rejects a contribution with %s", (_label, contribution) => {
        const {pages} = createStudioRouteContributions({[path("bad")]: {default: contribution}});
        expect(() => pages()).toThrow("[studioRouteContribution] Invalid default export");
    });
});
