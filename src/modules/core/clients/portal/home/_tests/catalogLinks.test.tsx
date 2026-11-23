import {render, screen} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";
import {MemoryRouter} from "react-router-dom";
import type {PortalSection} from "@coreModule/helpers/types/portalContribution.types.ts";

const {apiClientMock} = vi.hoisted(() => ({apiClientMock: vi.fn()}));

vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: apiClientMock}));
vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) => (props: Record<string, unknown>) => (
        <Wrapped {...props} languageCode="en-US" resolveLanguageKey={(key: string) => key} />
    ),
}));
const {sections} = vi.hoisted(() => {
    const Site = () => null;
    return {
        sections: [
            {section: "shop", path: "shop", SectionSite: Site, catalogs: [{kind: "product"}]},
            {section: "carRental", path: "car-rental", CompanySite: Site, catalogs: [{kind: "vehicleCategory"}]},
        ],
    };
});
vi.mock("../../shared/portalSiteContext.tsx", () => ({usePortalSite: () => ({site: {scope: "platform"}, sections})}));
vi.mock("../../shared/portalKindName.tsx", () => ({default: ({kind}: {kind: string}) => <>{kind}</>}));
vi.mock("@coreModule/helpers/hooks/useDynamicLanguage.ts", () => ({useDynamicLanguage: () => ({resolveLanguageKey: (key: string) => key})}));

import Catalog from "../catalog.tsx";
import {clearResponseCache} from "@coreModule/helpers/apiClient/responseCache.ts";

const item = (id: string, kind: string, section: string) => ({kind, id, title: `Item ${id}`, section, path: `/items/${id}`, company: {name: "Co", slug: "co"}});

const renderAt = (path: string, landing?: {section: PortalSection; city: string}) =>
    render(<MemoryRouter initialEntries={[path]}><Catalog landing={landing} /></MemoryRouter>);

/** The browse request the catalog sent last. */
const lastBrowse = () => apiClientMock.mock.calls.at(-1)?.[0];

/* D181: the catalog's kinds and "See all" are links a search engine can follow; a landing page shows one section in one city. */
describe("the home catalog's links", () => {
    beforeEach(() => {
        clearResponseCache();
        apiClientMock.mockReset();
        apiClientMock.mockResolvedValue({data: {data: [
            {kind: "product", total: 9, items: [item("p1", "product", "shop")]},
            {kind: "vehicleCategory", total: 5, items: [item("c1", "vehicleCategory", "carRental")]},
        ]}});
    });

    it("makes every kind tab a link to the same address, dropping the old kind's page and filters", async () => {
        renderAt("/?q=bmw&kind=product&page=2&sort=priceAsc&f.category=cars");
        await screen.findByText("Item p1");

        expect(screen.getByRole("tab", {name: "vehicleCategory"})).toHaveAttribute("href", "/?q=bmw&kind=vehicleCategory");
        expect(screen.getByRole("tab", {name: "all"})).toHaveAttribute("href", "/?q=bmw");
        expect(screen.getByRole("tab", {name: "product"})).toHaveAttribute("aria-selected", "true");
    });

    it("makes each rail's \"See all\" a link to that kind", async () => {
        renderAt("/");
        await screen.findByText("Item c1");

        expect(screen.getAllByRole("link", {name: "seeAll"}).map((link) => link.getAttribute("href"))).toEqual(["/?kind=product", "/?kind=vehicleCategory"]);
    });

    it("on a landing page, asks for the section's first kind in the landing's city, with no tabs for one kind", async () => {
        renderAt("/car-rental/in/tirana?city=Durres", {section: sections[1], city: "Tirana"});
        await screen.findByText("Item c1");

        expect(lastBrowse()).toEqual(expect.objectContaining({url: "/api/portal/browse", data: expect.objectContaining({kind: "vehicleCategory", city: "Tirana"})}));
        expect(screen.queryByRole("tablist")).toBeNull();
        expect(screen.queryByText("Item p1")).toBeNull();
    });
});
