import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";
import {MemoryRouter, Route, Routes, useLocation} from "react-router-dom";

const {apiClientMock, session} = vi.hoisted(() => {
    // Reads call the client (`useHttpRequest`), writes its `request` (`requestFromApi`): one mock answers both.
    const client = vi.fn();
    return {apiClientMock: Object.assign(client, {request: client}), session: {isAuthenticated: true, isHydrating: false, user: {id: "ada"}}};
});

vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: apiClientMock}));
vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) => (props: Record<string, unknown>) => (
        <Wrapped {...props} languageCode="en-US" resolveLanguageKey={(key: string) => key === "keep" ? "Save {title}" : "Remove {title}"} />
    ),
}));
vi.mock("../portalSession.tsx", () => ({usePortalSession: () => session}));

import {PortalKeepButton, PortalSavedProvider} from "../portalSaved.tsx";
import {clearResponseCache} from "@coreModule/helpers/apiClient/responseCache.ts";

/* D178, P23.7: the heart on a catalog card keeps the item for a signed-in visitor. */

const lamp = {kind: "product", id: "p1", title: "Desk lamp", section: "shop", path: "/product?id=p1", company: {name: "Store", slug: "store"}};

function Where() {
    const {pathname, search} = useLocation();
    return <p data-testid="where">{`${pathname}${search}`}</p>;
}

function renderCard() {
    return render(
        <MemoryRouter initialEntries={["/?kind=product"]}>
            <PortalSavedProvider>
                <Routes>
                    <Route path="*" element={<><PortalKeepButton item={lamp} /><Where /></>} />
                </Routes>
            </PortalSavedProvider>
        </MemoryRouter>,
    );
}

describe("the heart on a catalog card", () => {
    beforeEach(() => {
        clearResponseCache();
        apiClientMock.mockReset();
        session.isAuthenticated = true;
    });

    it("shows what the visitor keeps and keeps or drops the item with the server", async () => {
        apiClientMock.mockResolvedValueOnce({data: {data: []}});
        renderCard();
        const heart = await screen.findByRole("button", {name: "Save Desk lamp"});
        expect(heart).toHaveAttribute("aria-pressed", "false");

        apiClientMock.mockResolvedValueOnce({data: {data: ["product:p1"]}});
        await act(async () => fireEvent.click(heart));
        expect(screen.getByRole("button", {name: "Remove Desk lamp"})).toHaveAttribute("aria-pressed", "true");
        expect(apiClientMock).toHaveBeenLastCalledWith(expect.objectContaining({method: "put", url: "/api/portal/saved/favourites", data: {kind: "product", id: "p1", section: "shop", path: "/product?id=p1"}}));

        apiClientMock.mockResolvedValueOnce({data: {data: []}});
        await act(async () => fireEvent.click(screen.getByRole("button", {name: "Remove Desk lamp"})));
        expect(screen.getByRole("button", {name: "Save Desk lamp"})).toHaveAttribute("aria-pressed", "false");
        expect(apiClientMock).toHaveBeenLastCalledWith(expect.objectContaining({method: "delete", data: {kind: "product", id: "p1"}}));
    });

    it("goes back to what the server has when keeping fails", async () => {
        apiClientMock.mockResolvedValueOnce({data: {data: []}});
        renderCard();
        const heart = await screen.findByRole("button", {name: "Save Desk lamp"});

        apiClientMock.mockRejectedValueOnce({response: {status: 409, data: {error_code: "portal_favourites_limit_reached", message: "Limit"}}});
        await act(async () => fireEvent.click(heart));
        await waitFor(() => expect(screen.getByRole("button", {name: "Save Desk lamp"})).toHaveAttribute("aria-pressed", "false"));
    });

    it("sends a signed-out visitor to sign in, and back to the same page after", async () => {
        session.isAuthenticated = false;
        renderCard();
        await act(async () => fireEvent.click(screen.getByRole("button", {name: "Save Desk lamp"})));
        expect(screen.getByTestId("where")).toHaveTextContent("/login?next=%2F%3Fkind%3Dproduct");
        expect(apiClientMock).not.toHaveBeenCalled();
    });
});
