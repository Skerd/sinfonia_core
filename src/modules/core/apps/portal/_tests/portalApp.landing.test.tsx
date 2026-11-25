import {render, screen} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";
import type {PortalContribution} from "@coreModule/helpers/types/portalContribution.types.ts";
import type {PortalSite} from "armonia/src/modules/core/api/portal/public/portal/portal.dto.ts";

const {apiClientMock} = vi.hoisted(() => ({apiClientMock: vi.fn()}));

vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: Object.assign((config: unknown) => apiClientMock(config), {get: apiClientMock})}));
vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} resolveLanguageKey={(key: string) => key}/>,
}));
// The landing's name comes from the section names' and the landing texts' dictionaries.
vi.mock("@coreModule/helpers/hooks/useDynamicLanguage.ts", () => ({
    useDynamicLanguage: () => ({
        currentLanguage: {},
        resolveLanguageKey: (key: string) => ({name: "{section} in {city}", "carRental.title": "Car rental"})[key] ?? key,
    }),
}));
// One section with a company's pages under `/car-rental/<company>` on the apex, and cars in the home catalog. Not built
// on the real loader: loading it imports every module's contribution, and with them the site context, before this mock.
vi.mock("@coreModule/helpers/moduleContributions/loadPortalContributions.ts", () => {
    const CompanySite = () => <p>a company's site</p>;
    const contributions: PortalContribution[] = [{section: "carRental", path: "car-rental", CompanySite, catalogs: [{kind: "vehicleCategory"}]}];
    return {
        getPortalContributions: () => contributions,
        isPortalSection: (contribution: PortalContribution) => contribution.section !== undefined,
        portalHostPagesOf: () => [],
        portalBusinessTypesOf: () => [],
    };
});
vi.mock("@coreModule/clients/portal/shared/navigation/index.tsx", () => ({default: () => null}));
vi.mock("@coreModule/clients/portal/shared/footer/index.tsx", () => ({default: () => null}));
vi.mock("@coreModule/clients/portal/shared/chat/index.tsx", () => ({default: () => null}));
vi.mock("@coreModule/components/ui/sonner.tsx", () => ({Toaster: () => null}));
vi.mock("@coreModule/clients/portal/home/catalogCard.tsx", () => ({default: ({item}: {item: {title: string}}) => <p>{item.title}</p>}));

import PortalApp from "../portalApp.tsx";

const APEX: PortalSite = {
    scope: "platform",
    company: {_id: "65a000000000000000000002", name: "Kudoo", slug: "kudoo", cities: [], chatEnabled: false},
    platform: {name: "Kudoo"},
    cities: ["Tiranë", "Durrës"],
    sections: ["carRental"],
    landings: [{section: "carRental", city: "Tiranë", count: 12}],
};

function serve(site: PortalSite) {
    apiClientMock.mockImplementation(({url}: {url: string}) => {
        if (url === "/api/portal/site") return Promise.resolve({data: {data: site}});
        if (url === "/api/portal/companies") return Promise.resolve({data: {data: [{name: "Adriatic Drive", slug: "adriatic", cities: []}], total: 1}});
        if (url === "/api/portal/browse") {
            return Promise.resolve({data: {data: [{kind: "vehicleCategory", total: 1, items: [
                {kind: "vehicleCategory", id: "c1", title: "Blue Sedan", section: "carRental", path: "/categories/c1", company: {name: "Adriatic Drive", slug: "adriatic"}},
            ]}]}});
        }
        return Promise.reject({response: {status: 404, data: {error_code: "not_found"}}});
    });
}

const renderAt = (path: string) => {
    window.history.pushState({}, "", path);
    return render(<PortalApp/>);
};

/* D181: `/<section path>/in/<city>` on the apex is the section's landing page for a city the site lists. */
describe("PortalApp city landing pages", () => {
    beforeEach(() => {
        apiClientMock.mockReset();
    });

    it("shows the section's catalog in the city under its name, before a company's pages", async () => {
        serve(APEX);
        renderAt("/car-rental/in/tirane");

        expect(await screen.findByRole("heading", {level: 1, name: "Car rental in Tiranë"})).toBeInTheDocument();
        expect(await screen.findByText("Blue Sedan")).toBeInTheDocument();
        expect(apiClientMock).toHaveBeenCalledWith(expect.objectContaining({
            url: "/api/portal/browse",
            data: expect.objectContaining({kind: "vehicleCategory", city: "Tiranë"}),
        }));
        expect(screen.queryByText("a company's site")).not.toBeInTheDocument();
        expect(document.title).toBe("Car rental in Tiranë · Kudoo");
    });

    it("shows not found for a city the site lists no landing page for", async () => {
        serve(APEX);
        renderAt("/car-rental/in/durres");

        expect(await screen.findByText("404")).toBeInTheDocument();
        expect(screen.queryByText("a company's site")).not.toBeInTheDocument();
    });

    it("keeps a company's pages at `/<path>/<company>`", async () => {
        serve(APEX);
        renderAt("/car-rental/adriatic");

        expect(await screen.findByText("a company's site")).toBeInTheDocument();
    });

    it("has no landing pages on a company's own site", async () => {
        serve({...APEX, scope: "company", landings: []});
        renderAt("/car-rental/in/tirane");

        expect(await screen.findByText("a company's site")).toBeInTheDocument();
        expect(screen.queryByRole("heading", {level: 1, name: "Car rental in Tiranë"})).not.toBeInTheDocument();
    });
});
