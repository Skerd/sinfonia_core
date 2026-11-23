import {beforeEach, describe, expect, it, vi} from "vitest";
import type {PortalPrefetchTarget, PortalSection} from "@coreModule/helpers/types/portalContribution.types.ts";
import type {PortalSite} from "armonia/src/modules/core/api/portal/public/portal/portal.dto.ts";

const {prefetchMock} = vi.hoisted(() => ({prefetchMock: vi.fn()}));

vi.mock("@coreModule/helpers/apiClient/responseCache.ts", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@coreModule/helpers/apiClient/responseCache.ts")>()),
    prefetchHttpRequest: prefetchMock,
}));
const {loaded} = vi.hoisted(() => ({loaded: new Set<string>()}));
vi.mock("@coreModule/clients/portal/home/index.tsx", () => ({default: () => null}));
vi.mock("@coreModule/clients/portal/account/layout.tsx", () => { loaded.add("layout"); return {default: () => null}; });
vi.mock("@coreModule/clients/portal/account/profile.tsx", () => { loaded.add("profile"); return {default: () => null}; });
vi.mock("@coreModule/clients/portal/landing/index.tsx", () => { loaded.add("landing"); return {default: () => null}; });

import {prefetchPortalLink} from "@coreModule/clients/portal/shared/portalLinkIntent.ts";
import {BROWSE_REQUEST, browseForm} from "@coreModule/clients/portal/home/catalogBrowse.ts";
import {COMPANIES_REQUEST} from "@coreModule/clients/portal/shared/portalCompanies.ts";

const Site = () => null;
const apex: Pick<PortalSite, "scope" | "landings"> = {scope: "platform", landings: [{section: "carRental", city: "Tiranë", count: 12}]};
const companyHost: Pick<PortalSite, "scope" | "landings"> = {scope: "company", landings: []};
const url = (path: string) => new URL(path, "http://portal.localhost");

const prefetchSpy = () => vi.fn<(target: PortalPrefetchTarget) => void>();

/** Where the section was told the link leads. */
const targetOf = (section: {prefetch: ReturnType<typeof prefetchSpy>}) => {
    const [target] = section.prefetch.mock.calls[0];
    return {path: target.path, siteCompany: target.siteCompany};
};

describe("prefetchPortalLink", () => {
    const shop = {section: "shop", path: "shop", SectionSite: Site, prefetch: prefetchSpy()} satisfies PortalSection;
    const cars = {section: "carRental", path: "car-rental", CompanySite: Site, catalogs: [{kind: "vehicleCategory"}], prefetch: prefetchSpy()} satisfies PortalSection;
    const dentists = {
        section: "dentalClinic", path: "dentists", CompanySite: Site, prefetch: prefetchSpy(),
        sectionPages: [{path: "request-quotes", Page: Site}],
    } satisfies PortalSection;
    const sections: PortalSection[] = [shop, cars, dentists];

    beforeEach(() => {
        prefetchMock.mockReset();
        [shop, cars, dentists].forEach((section) => section.prefetch.mockReset());
    });

    it("asks the home catalog's results for a catalog link", () => {
        prefetchPortalLink(url("/?kind=product&f.category=electronics"), apex, sections);
        const params = new URLSearchParams("kind=product&f.category=electronics");
        expect(prefetchMock).toHaveBeenCalledWith(BROWSE_REQUEST, browseForm(params));
    });

    it("hands a section spanning companies its path and query", () => {
        prefetchPortalLink(url("/shop/product?id=p1&seller=s1"), apex, sections);
        expect(shop.prefetch).toHaveBeenCalledTimes(1);
        const [target] = shop.prefetch.mock.calls[0];
        expect(target.path).toBe("/product");
        expect(target.params.get("id")).toBe("p1");
        expect(target.siteCompany).toBeUndefined();
    });

    it("on the apex, asks for the company of a company site and hands the section the path inside it", () => {
        prefetchPortalLink(url("/car-rental/rental/categories/suv"), apex, sections);
        expect(prefetchMock).toHaveBeenCalledWith(COMPANIES_REQUEST, {section: "carRental", slug: "rental"}, {siteCompany: "rental"});
        expect(cars.prefetch).toHaveBeenCalledWith(expect.objectContaining({path: "/categories/suv", siteCompany: "rental"}));
    });

    it("on a company's own site, has no company segment to strip", () => {
        prefetchPortalLink(url("/car-rental/categories/suv"), companyHost, sections);
        expect(prefetchMock).not.toHaveBeenCalled();
        expect(targetOf(cars)).toEqual({path: "/categories/suv", siteCompany: undefined});
    });

    it("never takes one of the section's own pages for a company", () => {
        prefetchPortalLink(url("/dentists/request-quotes"), apex, sections);
        expect(prefetchMock).not.toHaveBeenCalled();
        expect(targetOf(dentists)).toEqual({path: "/request-quotes", siteCompany: undefined});
    });

    it("loads the code of the visitor's own pages, and nothing of any section", async () => {
        prefetchPortalLink(url("/account/profile"), apex, sections);
        await vi.waitFor(() => expect([...loaded].sort()).toEqual(["layout", "profile"]));
        expect(prefetchMock).not.toHaveBeenCalled();
        [shop, cars, dentists].forEach((section) => expect(section.prefetch).not.toHaveBeenCalled());
    });

    it("on the apex, loads a city landing page and its catalog's results, never a company called \"in\" (D181)", async () => {
        loaded.clear();
        prefetchPortalLink(url("/car-rental/in/tirane?page=2"), apex, sections);
        await vi.waitFor(() => expect(loaded.has("landing")).toBe(true));
        expect(prefetchMock).toHaveBeenCalledTimes(1);
        expect(prefetchMock).toHaveBeenCalledWith(BROWSE_REQUEST, browseForm(new URLSearchParams("page=2&kind=vehicleCategory&city=Tiranë")));
        expect(cars.prefetch).not.toHaveBeenCalled();
    });

    it("asks nothing ahead for a city the site has no landing page for", () => {
        prefetchPortalLink(url("/car-rental/in/durres"), apex, sections);
        expect(prefetchMock).not.toHaveBeenCalled();
        expect(cars.prefetch).not.toHaveBeenCalled();
    });

    it("leaves links outside the sections alone", () => {
        prefetchPortalLink(url("/blog/some-story"), apex, sections);
        prefetchPortalLink(url("/car-rental"), apex, sections);
        expect(prefetchMock).not.toHaveBeenCalled();
        [shop, cars, dentists].forEach((section) => expect(section.prefetch).not.toHaveBeenCalled());
    });
});
