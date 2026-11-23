import {act, render, screen} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";
import {MemoryRouter, Route, Routes} from "react-router-dom";

const {apiClientMock} = vi.hoisted(() => ({apiClientMock: vi.fn()}));

vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: apiClientMock}));
vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) => (props: Record<string, unknown>) => (
        <Wrapped {...props} languageCode="en-US" resolveLanguageKey={(key: string) => key} />
    ),
}));
vi.mock("../portalSiteContext.tsx", () => ({usePortalSite: () => ({site: {scope: "platform", company: {name: "Kudoo"}}, sections: []})}));
vi.mock("../../blog/index.tsx", () => ({BlogSection: () => null}));
vi.mock("../../notFound/index.tsx", () => ({default: () => <p>not found</p>}));

import PortalCompanySite from "../portalCompanySite.tsx";
import {getSiteCompany} from "@coreModule/helpers/apiClient/siteCompany.ts";
import {clearResponseCache} from "@coreModule/helpers/apiClient/responseCache.ts";

const Site = () => null;
const contribution = {section: "carRental", path: "car-rental", CompanySite: Site};

/** The apex company site's pages as the portal mounts them, with one page inside. */
function mount(path = "/car-rental/rental/categories/suv") {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="car-rental/:company/*" element={<PortalCompanySite contribution={contribution}><p>the company's page</p></PortalCompanySite>} />
            </Routes>
        </MemoryRouter>,
    );
}

describe("PortalCompanySite", () => {
    let answer: (value: {data: unknown}) => void = () => undefined;

    beforeEach(() => {
        clearResponseCache();
        apiClientMock.mockReset();
        apiClientMock.mockImplementation(() => new Promise((resolve) => { answer = resolve; }));
    });

    it("shows the company's pages at once, naming the company in every request, while it is looked up", () => {
        mount();
        expect(screen.getByText("the company's page")).toBeInTheDocument();
        expect(getSiteCompany()).toBe("rental");
        expect(apiClientMock).toHaveBeenCalledWith(expect.objectContaining({url: "/api/portal/companies", data: {section: "carRental", slug: "rental"}}));
    });

    it("names the company in the strip once found", async () => {
        mount();
        await act(async () => answer({data: {data: [{name: "Adriatic Drive", slug: "rental", cities: ["Tirana"]}]}}));
        expect(screen.getByText("Adriatic Drive")).toBeInTheDocument();
        expect(screen.getByText("the company's page")).toBeInTheDocument();
    });

    it("shows not found instead of the pages for a company the portal does not list", async () => {
        mount();
        await act(async () => answer({data: {data: []}}));
        expect(screen.getByText("not found")).toBeInTheDocument();
        expect(screen.queryByText("the company's page")).toBeNull();
    });

    it("names the company's own page after it in the browser tab, and leaves its inner pages to name themselves (D181)", async () => {
        document.title = "Server title";
        const index = mount("/car-rental/rental");
        await act(async () => answer({data: {data: [{name: "Adriatic Drive", slug: "rental", cities: []}]}}));
        expect(document.title).toBe("Adriatic Drive · Kudoo");
        index.unmount();

        clearResponseCache();
        document.title = "Server title";
        mount();
        await act(async () => answer({data: {data: [{name: "Adriatic Drive", slug: "rental", cities: []}]}}));
        expect(document.title).toBe("Server title");
    });
});
