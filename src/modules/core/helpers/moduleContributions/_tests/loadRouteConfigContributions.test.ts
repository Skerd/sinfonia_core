import {afterEach, describe, expect, it, vi} from "vitest";
import {setCompanyModules} from "@coreModule/helpers/modules/enabledModules.ts";
import type {RouteConfigArgs} from "@coreModule/helpers/types/routeConfigContribution.types.ts";
import {createRouteConfigContributions} from "@coreModule/helpers/moduleContributions/loadRouteConfigContributions.ts";

const path = (pkg: string) => `/src/modules/${pkg}/clients/panel/routeConfigContribution.tsx`;
const args: RouteConfigArgs = {
    menu: "shop",
    subview: "orders",
    segments: ["shop", "orders"],
    searchParams: new URLSearchParams(),
    resolveLanguageKey: ((key: string) => key) as RouteConfigArgs["resolveLanguageKey"],
};

describe("createRouteConfigContributions", () => {
    it("returns the first non-undefined view and stops there", () => {
        const deferring = vi.fn(() => undefined);
        const owner = vi.fn(() => "owner view");
        const later = vi.fn(() => "later view");
        const {run} = createRouteConfigContributions({
            [path("a")]: {default: {id: "a", order: 1, contributeRoutes: deferring}},
            [path("b")]: {default: {id: "b", order: 2, contributeRoutes: owner}},
            [path("c")]: {default: {id: "c", order: 3, contributeRoutes: later}},
        });

        expect(run(args)).toBe("owner view");
        expect(deferring).toHaveBeenCalledWith(args);
        expect(later).not.toHaveBeenCalled();
    });

    it.each([null, false, 0, ""])("treats %j as a handled route", (value) => {
        const later = vi.fn(() => "later");
        const {run} = createRouteConfigContributions({
            [path("a")]: {default: [
                {order: 1, contributeRoutes: () => value},
                {order: 2, contributeRoutes: later},
            ]},
        });
        expect(run(args)).toBe(value);
        expect(later).not.toHaveBeenCalled();
    });

    it("skips contributions without a hook", () => {
        const {run} = createRouteConfigContributions({
            [path("a")]: {default: [{id: "a", order: 1}, {id: "b", order: 2, contributeRoutes: () => "b"}]},
        });
        expect(run(args)).toBe("b");
    });

    it("returns undefined when nobody owns the route, or there are no contributions", () => {
        expect(createRouteConfigContributions({[path("a")]: {default: {contributeRoutes: () => undefined}}}).run(args)).toBeUndefined();
        expect(createRouteConfigContributions({}).run(args)).toBeUndefined();
    });

    it("lets errors propagate to the error boundary", () => {
        const {run} = createRouteConfigContributions({
            [path("a")]: {default: {contributeRoutes: () => {
                throw new Error("route boom");
            }}},
        });
        expect(() => run(args)).toThrow("route boom");
    });

    it("rejects a non-function hook", () => {
        const {run} = createRouteConfigContributions({[path("bad")]: {default: {contributeRoutes: "nope"}}});
        expect(() => run(args)).toThrow("[routeConfigContribution] Invalid default export");
    });
});

describe("createRouteConfigContributions: a module kept only for its platform lists (D195)", () => {
    const at = (...segments: string[]): RouteConfigArgs => ({...args, menu: segments[0], subview: segments[1], segments});
    const shop = vi.fn(() => "shop view");
    const contributions = () => createRouteConfigContributions({
        [path("eCommerce")]: {default: {id: "eCommerce", platformUrls: ["/tenancy/systemSettings/categories"], contributeRoutes: shop}},
    });

    afterEach(() => {
        setCompanyModules(null);
        shop.mockClear();
    });

    it("serves only its platform-list pages and what is under them", () => {
        setCompanyModules(["core"], ["eCommerce"]);
        const {run, platformUrlsOf} = contributions();
        expect(run(at("tenancy", "systemSettings", "categories"))).toBe("shop view");
        expect(run(at("tenancy", "systemSettings", "categories", "edit"))).toBe("shop view");
        expect(run(at("tenancy", "systemSettings", "categoriesx"))).toBeUndefined();
        expect(run(at("shop", "orders"))).toBeUndefined();
        expect(shop).toHaveBeenCalledTimes(2);
        expect(platformUrlsOf("eCommerce")).toEqual(["/tenancy/systemSettings/categories"]);
    });

    it("serves every page for a company that runs the module, and none for one that does not", () => {
        setCompanyModules(["eCommerce"]);
        expect(contributions().run(at("shop", "orders"))).toBe("shop view");
        setCompanyModules(["core"]);
        expect(contributions().run(at("tenancy", "systemSettings", "categories"))).toBeUndefined();
    });

    it("rejects platformUrls that are not strings", () => {
        const {run} = createRouteConfigContributions({[path("bad")]: {default: {platformUrls: [1]}}});
        expect(() => run(args)).toThrow();
    });
});
