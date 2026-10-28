import {act, render, screen, waitFor} from "@testing-library/react";
import {describe, expect, it, vi, beforeEach} from "vitest";
import {Provider} from "react-redux";
import {combineReducers, configureStore} from "@reduxjs/toolkit";
import {Link, MemoryRouter, Route, Routes} from "react-router-dom";

const {apiGetMock} = vi.hoisted(() => ({apiGetMock: vi.fn()}));

vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: {get: apiGetMock}}));

import authenticationReducer, {markSessionExpired, signOut} from "@coreModule/helpers/redux/slices/authSlice.ts";
import {PortalSessionProvider, usePortalSession} from "@coreModule/clients/portal/shared/portalSession.tsx";

const VALIDATED_USER = {id: "user-1", name: "Buyer"};

function signedInStore() {
    const signedOut = authenticationReducer(undefined, signOut());
    const authentication = {...signedOut, token: "token", refreshToken: "refresh"} as typeof signedOut;
    return configureStore({
        reducer: combineReducers({authentication: authenticationReducer}),
        preloadedState: {authentication},
    });
}

function HydrationProbe() {
    const {isHydrating} = usePortalSession();
    return <p data-testid="hydrating">{String(isHydrating)}</p>;
}

function renderPortal(store: ReturnType<typeof signedInStore>) {
    return render(
        <Provider store={store}>
            <MemoryRouter initialEntries={["/"]}>
                <PortalSessionProvider>
                    <HydrationProbe />
                    <Link to="/products">products</Link>
                    <Link to="/cart">cart</Link>
                    <Routes>
                        <Route path="/" element={<p>home page</p>} />
                        <Route path="/products" element={<p>products page</p>} />
                        <Route path="/cart" element={<p>cart page</p>} />
                        <Route path="/login" element={<p>login page</p>} />
                    </Routes>
                </PortalSessionProvider>
            </MemoryRouter>
        </Provider>,
    );
}

describe("PortalSessionProvider", () => {
    beforeEach(() => {
        apiGetMock.mockReset();
        apiGetMock.mockResolvedValue({data: VALIDATED_USER});
    });

    it("validates the token once, not again on every client-side navigation", async () => {
        renderPortal(signedInStore());
        await waitFor(() => expect(screen.getByTestId("hydrating")).toHaveTextContent("false"));

        await act(async () => screen.getByText("products").click());
        expect(screen.getByText("products page")).toBeInTheDocument();
        await act(async () => screen.getByText("cart").click());
        expect(screen.getByText("cart page")).toBeInTheDocument();

        expect(apiGetMock).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId("hydrating")).toHaveTextContent("false");
    });

    it("sends an expired session to the login page once, then lets the visitor browse", async () => {
        const store = signedInStore();
        renderPortal(store);
        await waitFor(() => expect(screen.getByTestId("hydrating")).toHaveTextContent("false"));

        act(() => {
            store.dispatch(markSessionExpired());
        });
        expect(await screen.findByText("login page")).toBeInTheDocument();

        await act(async () => screen.getByText("products").click());
        expect(screen.getByText("products page")).toBeInTheDocument();
    });
});
