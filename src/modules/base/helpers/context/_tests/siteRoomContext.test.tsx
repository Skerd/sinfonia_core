import {act, render, screen} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {Provider} from "react-redux";
import {configureStore, createSlice} from "@reduxjs/toolkit";
import {MemoryRouter, useNavigate, type NavigateFunction} from "react-router-dom";

type FakeSocket = {readyState: number; send: ReturnType<typeof vi.fn>};

/* Socket and connection handling is covered by `useWebSocketRoom.test.tsx`; this file covers path → room. */
const socketState = vi.hoisted(() => ({current: null as FakeSocket | null}));

vi.mock("@baseModule/helpers/context/webSocketContext.tsx", () => ({
    get clientWebSocket() {
        return socketState.current;
    },
}));
/* `/<room>/...` → `<room>`; `/` → `home`; `/noroom` → no room. */
vi.mock("@coreModule/helpers/websocket/resolveSiteRoom.ts", () => ({
    resolveSiteRoomFromPath: (pathname: string) => {
        const [first] = pathname.split("/").filter(Boolean);
        if (!first) return "home";
        return first === "noroom" ? null : first;
    },
}));
vi.mock("@coreModule/components/ui/sessionSetupScreen.tsx", () => ({
    SESSION_SETUP_TOTAL_STEPS: 6,
    SessionSetupScreen: ({phase, step, total}: {phase: string; step: number; total: number}) => (
        <div data-testid="setup" data-phase={phase} data-step={step} data-total={total}/>
    ),
}));

import {SiteRoomProvider} from "@baseModule/helpers/context/siteRoomContext.tsx";

const OPEN = 1;

const uiSlice = createSlice({name: "ui", initialState: {webSocketConnected: true}, reducers: {}});

function makeSocket(readyState = OPEN): FakeSocket {
    return {readyState, send: vi.fn()};
}

const sent = (socket: FakeSocket) => socket.send.mock.calls.map(([data]) => JSON.parse(data));
const join = (room: string) => ({code: "JOIN_ROOM", payload: [room]});
const leave = (room: string) => ({code: "LEAVE_ROOM", payload: [room]});

let navigate: NavigateFunction;
function CaptureNavigate() {
    navigate = useNavigate();
    return null;
}

function renderProvider({path = "/sales/orders"} = {}) {
    const store = configureStore({
        reducer: {ui: uiSlice.reducer},
    });
    const utils = render(
        <Provider store={store}>
            <MemoryRouter initialEntries={[path]}>
                <CaptureNavigate/>
                <SiteRoomProvider>
                    <span>child</span>
                </SiteRoomProvider>
            </MemoryRouter>
        </Provider>,
    );
    return {
        ...utils,
        go: (to: string) => act(() => navigate(to)),
    };
}

beforeEach(() => {
    socketState.current = makeSocket();
});

describe("SiteRoomProvider", () => {
    it("renders the children after the setup step", () => {
        renderProvider();
        expect(screen.getByText("child")).toBeInTheDocument();
        expect(screen.queryByTestId("setup")).toBeNull();
    });

    it("joins the room for the current path", () => {
        renderProvider({path: "/sales/orders"});
        expect(sent(socketState.current!)).toEqual([join("sales")]);
    });

    it("joins `home` at the root", () => {
        renderProvider({path: "/"});
        expect(sent(socketState.current!)).toEqual([join("home")]);
    });

    it("sends nothing when the path has no room", () => {
        renderProvider({path: "/noroom"});
        expect(socketState.current!.send).not.toHaveBeenCalled();
    });

    it("switches rooms on navigation, leaving the old one first", () => {
        const {go} = renderProvider({path: "/sales"});
        go("/stock/items");
        expect(sent(socketState.current!)).toEqual([join("sales"), leave("sales"), join("stock")]);
    });

    it("sends nothing when navigating within the same room", () => {
        const {go} = renderProvider({path: "/sales/orders"});
        go("/sales/invoices");
        go("/sales/orders/42");
        expect(sent(socketState.current!)).toEqual([join("sales")]);
    });

    it("leaves the room when navigating to a path without one", () => {
        const {go} = renderProvider({path: "/sales"});
        go("/noroom");
        expect(sent(socketState.current!)).toEqual([join("sales"), leave("sales")]);
    });

    it("leaves the room on unmount", () => {
        const {unmount} = renderProvider({path: "/sales"});
        unmount();
        expect(sent(socketState.current!)).toEqual([join("sales"), leave("sales")]);
    });
});
