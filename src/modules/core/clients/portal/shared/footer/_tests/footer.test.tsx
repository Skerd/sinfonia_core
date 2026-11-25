import {render, screen, within} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";
import {MemoryRouter} from "react-router-dom";
import type {PortalSite} from "armonia/src/modules/core/api/portal/public/portal/portal.dto.ts";
import type {PortalSection} from "@coreModule/helpers/types/portalContribution.types.ts";

const {siteState} = vi.hoisted(() => ({siteState: {site: undefined as PortalSite | undefined, sections: [] as PortalSection[]}}));

vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => (
            <Wrapped {...props} resolveLanguageKey={(key: string) => (key === "poweredBy" ? "Powered by {brand} · Create your free business site" : key)}/>
        ),
}));
vi.mock("@coreModule/clients/portal/shared/portalSiteContext.tsx", () => ({usePortalSite: () => ({site: siteState.site, sections: siteState.sections})}));
// The landing links' names (D181): the section names' and the landing texts' dictionaries.
vi.mock("@coreModule/helpers/hooks/useDynamicLanguage.ts", () => ({
    useDynamicLanguage: () => ({
        currentLanguage: {},
        resolveLanguageKey: (key: string) => ({name: "{section} in {city}", "carRental.title": "Car rental", "dentalClinic.title": "Dentists"})[key] ?? null,
    }),
}));
vi.mock("@coreModule/clients/portal/shared/portalZone.ts", () => ({portalApexOrigin: () => "http://portal.example.test:5212"}));
// The real switch reads the app's ThemeProvider; here it only has to be placed.
vi.mock("@coreModule/components/custom/preferences/themeSwitch.tsx", () => ({default: () => <button type="button">Theme</button>}));

import PortalFooter from "../index.tsx";

const site = (scope: PortalSite["scope"]): PortalSite => ({
    scope,
    company: {_id: "65a000000000000000000003", name: "Rental Co", slug: "rental-co", cities: [], chatEnabled: false},
    platform: {name: "Platform"},
    cities: [],
    sections: [],
    landings: [],
});

const renderFooter = () => render(<MemoryRouter><PortalFooter/></MemoryRouter>);

/* D178, P23.9: a company's site invites its visitors to make their own, naming the site in the sign-up link. */
describe("PortalFooter", () => {
    beforeEach(() => {
        siteState.site = undefined;
        siteState.sections = [];
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

    it("carries the theme switch, which left the header (2026-11-23)", () => {
        siteState.site = site("platform");
        renderFooter();

        expect(screen.getByRole("button", {name: "Theme"})).toBeInTheDocument();
    });

    it("links the city landing pages, one column per section, and none when the site lists none (D181)", () => {
        const Site = () => null;
        siteState.sections = [
            {section: "carRental", path: "car-rental", CompanySite: Site},
            {section: "dentalClinic", path: "dentists", CompanySite: Site},
            {section: "shop", path: "shop", SectionSite: Site},
        ];
        siteState.site = {
            ...site("platform"),
            landings: [
                {section: "dentalClinic", city: "Durrës", count: 4},
                {section: "carRental", city: "Tiranë", count: 9},
                {section: "carRental", city: "Vlorë", count: 5},
            ],
        };
        renderFooter();

        const cars = screen.getByRole("navigation", {name: "carRental.title"});
        expect(within(cars).getAllByRole("link").map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
            ["Car rental in Tiranë", "/car-rental/in/tirane"],
            ["Car rental in Vlorë", "/car-rental/in/vlore"],
        ]);
        expect(within(screen.getByRole("navigation", {name: "dentalClinic.title"})).getByRole("link", {name: "Dentists in Durrës"})).toHaveAttribute("href", "/dentists/in/durres");
        expect(screen.queryByRole("navigation", {name: "shop.title"})).toBeNull();
    });

    it("shows no landing links on a site that lists none", () => {
        siteState.sections = [{section: "carRental", path: "car-rental", CompanySite: () => null}];
        siteState.site = site("company");
        renderFooter();

        expect(screen.queryByRole("link", {name: /in /})).toBeNull();
    });
});
