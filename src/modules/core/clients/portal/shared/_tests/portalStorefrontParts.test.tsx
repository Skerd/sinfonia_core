import {render, screen} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";
import {MemoryRouter} from "react-router-dom";

const {portal} = vi.hoisted(() => ({portal: {scope: "platform" as "platform" | "company" | undefined}}));

vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) => (props: Record<string, unknown>) => (
        <Wrapped {...props} languageCode="en-US" resolveLanguageKey={(key: string) => (key === "visitSiteNamed" ? "Visit {name}" : key)}/>
    ),
}));
vi.mock("@coreModule/helpers/hocs/withDebug.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) => Wrapped,
}));
vi.mock("../portalSiteContext.tsx", () => ({
    usePortalSite: () => ({site: portal.scope ? {scope: portal.scope} : undefined, sections: []}),
}));
vi.mock("@coreModule/clients/portal/shared/portalZone.ts", () => ({
    companySiteOrigin: (slug: string) => `https://${slug}.example.test`,
}));

import PortalSellerCard from "../portalSellerCard.tsx";
import {PortalInlineSignIn} from "../portalInlineSignIn.tsx";
import {PortalStatusPill} from "../portalStatusPill.tsx";
import {formatRecordMoney} from "../portalMoney.ts";
import {resolvePublicMediaUrl} from "../portalMedia.ts";
import {uniqueBySlug} from "../catalogFilters.tsx";

const SELLER = {_id: "6a1f0c2b9d3e4f5a6b7c8d9e", name: "Alpha Studio", siteSlug: "alpha"};

describe("portal storefront parts shared by the shop and the services (D142)", () => {
    beforeEach(() => {
        portal.scope = "platform";
    });

    it("shows the seller on the apex, linking to its own site at the given section", () => {
        render(<PortalSellerCard seller={SELLER} sectionPath="services" kind="service" size="card" />);

        expect(screen.getByText("Alpha Studio")).toBeInTheDocument();
        expect(screen.getByLabelText("Visit Alpha Studio")).toHaveAttribute("href", "https://alpha.example.test/services");
    });

    it("names the platform a task is posted on without a link, and a company that quoted with its own site (D172, D197)", () => {
        // The platform company keeps the board and has no site of its own: its name shows, linking nowhere.
        render(<PortalSellerCard seller={{_id: "6a1f0c2b9d3e4f5a6b7c8d00", name: "Kudoo"}} sectionPath="tasks" kind="task" size="card" />);
        render(<PortalSellerCard seller={SELLER} sectionPath="services" kind="quote" size="card" />);

        expect(screen.getByText("postedOn")).toBeInTheDocument();
        expect(screen.getByText("Kudoo")).toBeInTheDocument();
        expect(screen.queryByLabelText("Visit Kudoo")).toBeNull();
        expect(screen.getByText("sentQuote")).toBeInTheDocument();
        expect(screen.getByLabelText("Visit Alpha Studio")).toHaveAttribute("href", "https://alpha.example.test/services");
    });

    it("hides the seller on a company's own site, where everything is that company's", () => {
        portal.scope = "company";
        const {container} = render(<PortalSellerCard seller={SELLER} sectionPath="shop" kind="product" />);

        expect(container).toBeEmptyDOMElement();
    });

    it("asks a signed-out visitor to sign in, in the caller's words, and comes back to the page", () => {
        render(<MemoryRouter><PortalInlineSignIn next="/services/service?id=1" message="Log in to order this service." /></MemoryRouter>);

        expect(screen.getByText(/Log in to order this service\./)).toBeInTheDocument();
        expect(screen.getByRole("link", {name: "logIn"})).toHaveAttribute("href", "/login?next=%2Fservices%2Fservice%3Fid%3D1");
    });

    it("colours a status by its word and keeps an unknown word neutral", () => {
        render(<><PortalStatusPill value="completed" label="Done" /><PortalStatusPill value="whatever" label="Odd" /></>);

        expect(screen.getByText("Done").className).toContain("bg-emerald-50");
        expect(screen.getByText("Odd").className).toContain("bg-muted");
    });

    it("formats an amount in the record's own currency and never borrows one", () => {
        expect(formatRecordMoney(1234.5, {abbreviation: "EUR", decimalPlaces: 2})).toMatch(/1.234[.,]50/);
        expect(formatRecordMoney(5, {symbol: "L", decimalPlaces: 0})).toBe("L5");
        expect(formatRecordMoney(null, {abbreviation: "EUR"})).toBe("");
        expect(formatRecordMoney(7)).not.toMatch(/[€$L]/);
    });

    it("turns a media id or a private media path into its public URL", () => {
        expect(resolvePublicMediaUrl("abc")).toBe("/api/auxiliary/public/media/abc");
        expect(resolvePublicMediaUrl("/api/auxiliary/media/abc")).toBe("/api/auxiliary/public/media/abc");
        expect(resolvePublicMediaUrl("https://cdn.test/a.png")).toBe("https://cdn.test/a.png");
        expect(resolvePublicMediaUrl(undefined)).toBeUndefined();
    });

    it("keeps one filter option per slug", () => {
        expect(uniqueBySlug([{slug: "a", name: "A"}, {slug: "a", name: "A2"}, {slug: "b", name: "B"}]).map((c) => c.slug)).toEqual(["a", "b"]);
    });
});
