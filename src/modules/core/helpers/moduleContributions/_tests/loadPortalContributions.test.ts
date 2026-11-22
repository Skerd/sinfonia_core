import {afterEach, describe, expect, it} from "vitest";
import {
    createPortalContributions,
    isPortalSection,
    portalBusinessTypesOf,
    portalHostPagesOf,
} from "@coreModule/helpers/moduleContributions/loadPortalContributions.ts";
import {setCompanyModules} from "@coreModule/helpers/modules/enabledModules.ts";

const Site = () => null;
const path = (pkg: string) => `/src/modules/${pkg}/clients/portal/portalContribution.tsx`;

describe("createPortalContributions", () => {
    afterEach(() => {
        setCompanyModules(null);
    });

    it("keeps every section for a portal account, whose own company has only core", () => {
        const list = createPortalContributions({
            [path("carRental")]: {default: {section: "carRental", path: "car-rental", order: 20, CompanySite: Site}},
            [path("eCommerce")]: {default: {section: "shop", path: "shop", order: 10, SectionSite: Site}},
        });
        setCompanyModules([]);
        expect(list().map((entry) => entry.section)).toEqual(["shop", "carRental"]);
    });

    it("accepts the shell slots and the home catalogs", () => {
        const list = createPortalContributions({
            [path("eCommerce")]: {default: {
                section: "shop", path: "shop", SectionSite: Site, Home: Site, Provider: Site, NavAction: Site,
                catalogs: [{kind: "product", Filters: Site}, {kind: "service"}],
            }},
        });
        expect(list().filter(isPortalSection)[0].catalogs?.map((catalog) => catalog.kind)).toEqual(["product", "service"]);
    });

    it("accepts a section's prefetch and rejects one that is not a function", () => {
        const prefetch = () => undefined;
        const list = createPortalContributions({[path("eCommerce")]: {default: {section: "shop", path: "shop", SectionSite: Site, prefetch}}});
        expect(list().filter(isPortalSection)[0].prefetch).toBe(prefetch);
        const broken = createPortalContributions({[path("x")]: {default: {section: "x", path: "x", prefetch: "soon"}}});
        expect(() => broken()).toThrow(/portalContribution/);
    });

    it("rejects a catalog without a kind", () => {
        const list = createPortalContributions({[path("x")]: {default: {section: "x", path: "x", catalogs: [{Filters: Site}]}}});
        expect(() => list()).toThrow(/portalContribution/);
    });

    it("rejects an entry without a section path", () => {
        const list = createPortalContributions({[path("x")]: {default: {section: "x"}}});
        expect(() => list()).toThrow(/portalContribution/);
    });

    describe("host pages (D96)", () => {
        const Page = () => null;

        it("accepts a contribution that brings only host pages, and keeps it out of the sections", () => {
            const list = createPortalContributions({
                [path("carRental")]: {default: {section: "carRental", path: "car-rental", CompanySite: Site}},
                [path("hostOnly")]: {default: {id: "hostOnly", hostPages: [{path: "/token-page", Page}]}},
            });
            expect(list().filter(isPortalSection).map((entry) => entry.section)).toEqual(["carRental"]);
            expect(list().map((entry) => entry.id ?? entry.section)).toEqual(["carRental", "hostOnly"]);
        });

        it("collects every contribution's host pages, sections' too, from the host root", () => {
            const list = createPortalContributions({
                [path("a")]: {default: {section: "a", path: "a", order: 10, hostPages: [{path: "a-link", Page}]}},
                [path("b")]: {default: {order: 20, hostPages: [{path: "/b-link", Page}]}},
            });
            expect(portalHostPagesOf(list()).map((page) => page.path)).toEqual(["a-link", "b-link"]);
        });

        it("rejects a host page without a component or a path", () => {
            expect(() => createPortalContributions({[path("x")]: {default: {hostPages: [{path: "x"}]}}})()).toThrow(/portalContribution/);
            expect(() => createPortalContributions({[path("x")]: {default: {hostPages: [{path: "/", Page}]}}})()).toThrow(/portalContribution/);
        });

        it("rejects a contribution without a section that has no host pages, or carries section parts", () => {
            expect(() => createPortalContributions({[path("x")]: {default: {hostPages: []}}})()).toThrow(/portalContribution/);
            expect(() => createPortalContributions({[path("x")]: {default: {hostPages: [{path: "x", Page}], CompanySite: Site}}})()).toThrow(/portalContribution/);
        });
    });
    it("collects every section's business type and rejects one without its key, icon or summary (D178)", () => {
        const businessType = {key: "fixtureRental", Icon: Site, Summary: Site};
        const list = createPortalContributions({
            [path("fixtureRental")]: {default: {section: "rental", path: "rental", order: 20, CompanySite: Site, businessType}},
            [path("fixtureShop")]: {default: {section: "shop", path: "shop", order: 10, SectionSite: Site}},
            [path("fixtureHostPages")]: {default: {hostPages: [{path: "token", Page: Site}]}},
        });
        expect(portalBusinessTypesOf(list())).toEqual([businessType]);

        const broken = createPortalContributions({[path("x")]: {default: {section: "x", path: "x", businessType: {key: "x", Icon: Site}}}});
        expect(() => broken()).toThrow("Invalid default export");
    });
});
