import {render, screen} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";
import type {PortalContribution} from "@coreModule/helpers/types/portalContribution.types.ts";
import type {PortalSite} from "armonia/src/modules/core/api/portal/public/portal/portal.dto.ts";

const {apiClientMock} = vi.hoisted(() => ({apiClientMock: vi.fn()}));

// The portal reads what this host is from `/api/portal/site`; nothing else reaches the server in these tests.
vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: Object.assign((config: unknown) => apiClientMock(config), {get: apiClientMock})}));
vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} resolveLanguageKey={(key: string) => key}/>,
}));
// A core-only fixture module (D03): one host page and no section.
vi.mock("@coreModule/helpers/moduleContributions/loadPortalContributions.ts", async (importActual) => {
    const actual = await importActual<typeof import("@coreModule/helpers/moduleContributions/loadPortalContributions.ts")>();
    const FixtureHostPage = () => <p>fixture host page</p>;
    const contributions: PortalContribution[] = [{id: "fixture", hostPages: [{path: "/fixture-page", Page: FixtureHostPage}]}];
    return {...actual, getPortalContributions: () => contributions};
});
// The chrome around the page is not what these tests are about.
vi.mock("@coreModule/clients/portal/shared/navigation/index.tsx", () => ({default: () => null}));
vi.mock("@coreModule/clients/portal/shared/footer/index.tsx", () => ({default: () => null}));
vi.mock("@coreModule/clients/portal/shared/chat/index.tsx", () => ({default: () => null}));
vi.mock("@coreModule/components/ui/sonner.tsx", () => ({Toaster: () => null}));

import PortalApp from "../portalApp.tsx";

const LISTED_SITE: PortalSite = {
    scope: "company",
    company: {name: "Builder Co", slug: "builder-co", cities: [], chatEnabled: false},
    platform: {name: "Platform"},
    cities: [],
    sections: [],
};

/** Serves `/api/portal/site`: the listed host's site, or the refusal an unlisted host gets (`site === null`). */
function serveHost(listed: boolean) {
    apiClientMock.mockImplementation(({url}: {url: string}) => {
        if (url === "/api/portal/site" && listed) return Promise.resolve({data: {data: LISTED_SITE}});
        return Promise.reject({response: {status: 404, data: {error_code: "portal_site_not_found"}}});
    });
}

const renderAt = (path: string) => {
    window.history.pushState({}, "", path);
    return render(<PortalApp/>);
};

describe("PortalApp host pages (D96)", () => {
    beforeEach(() => {
        apiClientMock.mockReset();
    });

    it("renders a module's host page at its path on a host the portal lists", async () => {
        serveHost(true);
        renderAt("/fixture-page?token=abc");

        expect(await screen.findByText("fixture host page")).toBeInTheDocument();
        expect(screen.queryByText("404")).not.toBeInTheDocument();
    });

    it("renders the host page on a host the portal does not list", async () => {
        serveHost(false);
        renderAt("/fixture-page?token=abc");

        expect(await screen.findByText("fixture host page")).toBeInTheDocument();
        expect(screen.queryByText("404")).not.toBeInTheDocument();
    });

    it("still shows not found for any other path on a host the portal does not list", async () => {
        serveHost(false);
        renderAt("/some-unknown-page");

        expect(await screen.findByText("404")).toBeInTheDocument();
        expect(screen.queryByText("fixture host page")).not.toBeInTheDocument();
    });
});
