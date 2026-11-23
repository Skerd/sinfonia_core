import {render, screen} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";
import {MemoryRouter} from "react-router-dom";
import type {PortalSite} from "armonia/src/modules/core/api/portal/public/portal/portal.dto.ts";

const {siteState} = vi.hoisted(() => ({siteState: {site: undefined as PortalSite | undefined}}));

vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => (
            <Wrapped {...props} resolveLanguageKey={(key: string) => (key === "poweredBy" ? "Powered by {brand} · Create your free business site" : key)}/>
        ),
}));
vi.mock("@coreModule/clients/portal/shared/portalSiteContext.tsx", () => ({usePortalSite: () => ({site: siteState.site, sections: []})}));
vi.mock("@coreModule/clients/portal/shared/portalZone.ts", () => ({portalApexOrigin: () => "http://portal.example.test:5212"}));

import PortalFooter from "../index.tsx";

const site = (scope: PortalSite["scope"]): PortalSite => ({
    scope,
    company: {name: "Rental Co", slug: "rental-co", cities: [], chatEnabled: false},
    platform: {name: "Platform"},
    cities: [],
    sections: [],
});

const renderFooter = () => render(<MemoryRouter><PortalFooter/></MemoryRouter>);

/* D178, P23.9: a company's site invites its visitors to make their own, naming the site in the sign-up link. */
describe("PortalFooter", () => {
    beforeEach(() => {
        siteState.site = undefined;
    });

    it("links a company site's visitors to the platform's business sign-up, with the site as the referrer", () => {
        siteState.site = site("company");
        renderFooter();

        const link = screen.getByRole("link", {name: "Powered by Platform · Create your free business site"});
        expect(link).toHaveAttribute("href", "http://portal.example.test:5212/business?ref=rental-co");
    });

    it("shows no such link on the platform's own site", () => {
        siteState.site = site("platform");
        renderFooter();

        expect(screen.queryByRole("link", {name: /Powered by/})).not.toBeInTheDocument();
    });
});
