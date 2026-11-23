import {act, fireEvent, render, screen} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";
import {MemoryRouter} from "react-router-dom";

const {apiClientMock} = vi.hoisted(() => ({apiClientMock: vi.fn()}));

vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: apiClientMock}));
vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) => (props: Record<string, unknown>) => (
        <Wrapped {...props} languageCode="en-US" resolveLanguageKey={(key: string) => key} />
    ),
}));
vi.mock("../../shared/portalSiteContext.tsx", () => ({
    usePortalSite: () => ({
        site: {scope: "platform"},
        sections: [{section: "shop", path: "shop", SectionSite: () => null, catalogs: [{kind: "product"}, {kind: "vehicleCategory"}]}],
    }),
}));
vi.mock("../../shared/portalKindName.tsx", () => ({default: ({kind}: {kind: string}) => <>{kind}</>}));
// The "Save this search" button names the kind from the kinds' dictionary (P23.7).
vi.mock("@coreModule/helpers/hooks/useDynamicLanguage.ts", () => ({useDynamicLanguage: () => ({resolveLanguageKey: (key: string) => key})}));

import Catalog from "../catalog.tsx";
import {clearResponseCache} from "@coreModule/helpers/apiClient/responseCache.ts";

const item = (id: string, kind: string) => ({kind, id, title: `Item ${id}`, section: "shop", path: `/product?id=${id}`, company: {name: "Store", slug: "store"}});

describe("the home catalog while it loads other results", () => {
    beforeEach(() => {
        clearResponseCache();
        apiClientMock.mockReset();
    });

    it("keeps the results on screen, marked busy, until the new ones arrive", async () => {
        apiClientMock.mockResolvedValueOnce({data: {data: [
            {kind: "product", total: 1, items: [item("p1", "product")]},
            {kind: "vehicleCategory", total: 1, items: [item("c1", "vehicleCategory")]},
        ]}});
        render(<MemoryRouter initialEntries={["/"]}><Catalog /></MemoryRouter>);
        expect(await screen.findByText("Item p1")).toBeInTheDocument();

        let answer: (value: {data: unknown}) => void = () => undefined;
        apiClientMock.mockImplementationOnce(() => new Promise((resolve) => { answer = resolve; }));
        fireEvent.click(screen.getByRole("tab", {name: "vehicleCategory"}));

        // The chosen kind's results from the last answer stay, busy; no skeletons in between.
        expect(screen.getByText("Item c1").closest("[aria-busy='true']")).not.toBeNull();

        await act(async () => answer({data: {data: [{kind: "vehicleCategory", total: 2, items: [item("c1", "vehicleCategory"), item("c2", "vehicleCategory")]}]}}));
        expect(screen.getByText("Item c2")).toBeInTheDocument();
        expect(screen.getByText("Item c2").closest("[aria-busy='true']")).toBeNull();
    });
});
