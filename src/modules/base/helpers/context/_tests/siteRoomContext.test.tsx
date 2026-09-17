import {act, render, screen} from "@testing-library/react";
import {beforeEach, describe, expect, it, type Mock, vi} from "vitest";
import {MemoryRouter, useNavigate, type NavigateFunction} from "react-router-dom";

type FakeSocket = {readyState: number; send: Mock<(data: string) => void>};

/* Socket and connection handling is covered by `useWebSocketRoom.test.tsx`; this file covers path → room. */
/* `/<room>/...` → `<room>`; `/` → `home`; `/noroom` → no room. */
vi.mock("@baseModule/helpers/websocket/resolveSiteRoom.ts", () => ({
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
import {resetRoomMemberships, setRoomSocket} from "@baseModule/helpers/websocket/roomMemberships.ts";

const OPEN = 1;

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
    const utils = render(
        <MemoryRouter initialEntries={[path]}>
            <CaptureNavigate/>
            <SiteRoomProvider>
                <span>child</span>
            </SiteRoomProvider>
        </MemoryRouter>,
    );
    return {
        ...utils,
        go: (to: string) => act(() => navigate(to)),
    };
}

let socket: FakeSocket;

beforeEach(() => {
    resetRoomMemberships();
    socket = makeSocket();
    setRoomSocket(socket);
});

describe("SiteRoomProvider", () => {
    it("renders the children after the setup step", () => {
        renderProvider();
        expect(screen.getByText("child")).toBeInTheDocument();
        expect(screen.queryByTestId("setup")).toBeNull();
    });

    it("joins the room for the current path", () => {
        renderProvider({path: "/sales/orders"});
        expect(sent(socket)).toEqual([join("sales")]);
    });

    it("joins `home` at the root", () => {
        renderProvider({path: "/"});
        expect(sent(socket)).toEqual([join("home")]);
    });

    it("sends nothing when the path has no room", () => {
        renderProvider({path: "/noroom"});
        expect(socket.send).not.toHaveBeenCalled();
    });

    it("switches rooms on navigation, leaving the old one first", () => {
        const {go} = renderProvider({path: "/sales"});
        go("/stock/items");
        expect(sent(socket)).toEqual([join("sales"), leave("sales"), join("stock")]);
    });

    it("sends nothing when navigating within the same room", () => {
        const {go} = renderProvider({path: "/sales/orders"});
        go("/sales/invoices");
        go("/sales/orders/42");
        expect(sent(socket)).toEqual([join("sales")]);
    });

    it("leaves the room when navigating to a path without one", () => {
        const {go} = renderProvider({path: "/sales"});
        go("/noroom");
        expect(sent(socket)).toEqual([join("sales"), leave("sales")]);
    });

    it("leaves the room on unmount", () => {
        const {unmount} = renderProvider({path: "/sales"});
        unmount();
        expect(sent(socket)).toEqual([join("sales"), leave("sales")]);
    });
});
