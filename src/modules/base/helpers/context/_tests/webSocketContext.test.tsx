import {act, render, screen} from "@testing-library/react";
import {StrictMode, type ReactNode} from "react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {Provider} from "react-redux";
import {combineReducers, configureStore} from "@reduxjs/toolkit";

const READY = {UNINSTANTIATED: -1, CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3} as const;

/** Stand-in for `react-use-websocket`: tests set `readyState` / `socket` and re-render. */
const hook = vi.hoisted(() => ({
    readyState: -1,
    socket: null as object | null,
    url: undefined as string | null | undefined,
    options: undefined as Record<string, any> | undefined,
    sendJsonMessage: vi.fn(),
    getWebSocket: vi.fn(),
}));
const {handleMessageMock, setRoomSocketMock} = vi.hoisted(() => ({handleMessageMock: vi.fn(), setRoomSocketMock: vi.fn()}));

vi.mock("react-use-websocket", () => ({
    ReadyState: {UNINSTANTIATED: -1, CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3},
    default: (url: string | null, options: Record<string, unknown>) => {
        hook.url = url;
        hook.options = options;
        return {readyState: hook.readyState, sendJsonMessage: hook.sendJsonMessage, getWebSocket: hook.getWebSocket};
    },
}));
vi.mock("@baseModule/helpers/websocket/webSocketMessages.ts", () => ({handleWebSocketMessage: handleMessageMock}));
vi.mock("@baseModule/helpers/websocket/roomMemberships.ts", () => ({setRoomSocket: setRoomSocketMock}));
vi.mock("@baseModule/components/custom/sessionSetupScreen.tsx", () => ({
    SESSION_SETUP_TOTAL_STEPS: 6,
    SessionSetupScreen: ({phase}: {phase: string}) => <div data-testid="setup">{phase}</div>,
}));

import * as webSocketContext from "@baseModule/helpers/context/webSocketContext.tsx";
import {WebSocketProvider} from "@baseModule/helpers/context/webSocketContext.tsx";
import {reconnectDelay, shouldReconnect} from "@baseModule/helpers/websocket/webSocketConnection.ts";
import authenticationReducer, {logIn, signOut, updateUserData} from "@baseModule/helpers/redux/slices/authSlice.ts";
import languageReducer, {changeLanguage} from "@baseModule/helpers/redux/slices/languageSlice.ts";
import uiReducer from "@baseModule/helpers/redux/slices/uiSlice.ts";

/** The socket room memberships were last pointed at. */
const roomSocket = () => setRoomSocketMock.mock.lastCall?.[0] ?? null;

function setup({token = "token-a" as string | null, strict = false} = {}) {
    const store = configureStore({
        reducer: combineReducers({authentication: authenticationReducer, language: languageReducer, ui: uiReducer}),
    });
    store.dispatch(signOut());
    if (token) store.dispatch(logIn({token, refreshToken: "refresh"}));
    store.dispatch(updateUserData({...store.getState().authentication.user, id: "me"}));
    store.dispatch(changeLanguage("en-US"));

    const tree = (): ReactNode => {
        const provider = (
            <Provider store={store}>
                <WebSocketProvider>
                    <span>child</span>
                </WebSocketProvider>
            </Provider>
        );
        return strict ? <StrictMode>{provider}</StrictMode> : provider;
    };
    const utils = render(tree());
    return {
        store,
        ...utils,
        connected: () => store.getState().ui.webSocketConnected,
        /** Simulates the hook reporting a new ready state. */
        setReadyState: (readyState: number, socket: object | null = hook.socket) => {
            hook.readyState = readyState;
            hook.socket = socket;
            utils.rerender(tree());
        },
        dispatch: (action: Parameters<typeof store.dispatch>[0]) => act(() => void store.dispatch(action)),
    };
}

beforeEach(() => {
    localStorage.clear();
    hook.readyState = READY.CONNECTING;
    hook.socket = null;
    hook.url = undefined;
    hook.options = undefined;
    hook.sendJsonMessage.mockReset();
    hook.getWebSocket.mockReset();
    hook.getWebSocket.mockImplementation(() => hook.socket);
    handleMessageMock.mockReset();
    setRoomSocketMock.mockReset();
});

describe("WebSocketProvider", () => {
    it("renders the children after the setup step", () => {
        setup();
        expect(screen.getByText("child")).toBeInTheDocument();
        expect(screen.queryByTestId("setup")).toBeNull();
    });

    it("connects to the token and language URL", () => {
        setup();
        expect(hook.url).toBe(`ws://${window.location.host}/ws/token-a/en-US`);
    });

    it("does not connect without a token", () => {
        setup({token: null});
        expect(hook.url).toBeNull();
    });

    it("reconnects to a new URL when the token or language changes", () => {
        const {dispatch} = setup();
        dispatch(logIn({token: "token-b", refreshToken: "refresh"}));
        expect(hook.url).toBe(`ws://${window.location.host}/ws/token-b/en-US`);
        dispatch(changeLanguage("de-CH"));
        expect(hook.url).toBe(`ws://${window.location.host}/ws/token-b/de-CH`);
    });

    it("passes the reconnect policy", () => {
        setup();
        expect(hook.options).toMatchObject({
            retryOnError: false,
            reconnectAttempts: Infinity,
            reconnectInterval: reconnectDelay,
            shouldReconnect,
        });
    });

    describe("connection state", () => {
        it("is offline while connecting", () => {
            const {connected} = setup();
            expect(connected()).toBe(false);
            expect(roomSocket()).toBeNull();
        });

        it("exposes the socket and flag once open", () => {
            const socket = {id: "s1"};
            const {connected, setReadyState} = setup();

            setReadyState(READY.OPEN, socket);
            expect(connected()).toBe(true);
            expect(roomSocket()).toBe(socket);
        });

        it("goes offline when the socket closes", () => {
            const {connected, setReadyState} = setup();
            setReadyState(READY.OPEN, {id: "s1"});

            setReadyState(READY.CLOSED);
            expect(connected()).toBe(false);
            expect(roomSocket()).toBeNull();
        });

        it("switches to the new socket after a reconnect", () => {
            const newSocket = {id: "s2"};
            const {connected, setReadyState} = setup();
            setReadyState(READY.OPEN, {id: "s1"});
            setReadyState(READY.CONNECTING, null);
            setReadyState(READY.OPEN, newSocket);

            expect(connected()).toBe(true);
            expect(roomSocket()).toBe(newSocket);
        });

        it("ignores the close callback: a replaced socket closing late keeps the app online", () => {
            const socket = {id: "s2"};
            const {connected, setReadyState} = setup();
            setReadyState(READY.OPEN, socket);

            const info = vi.spyOn(console, "info").mockImplementation(() => {});
            act(() => hook.options!.onClose({code: 1001, reason: ""}));
            info.mockRestore();

            expect(connected()).toBe(true);
            expect(roomSocket()).toBe(socket);
        });

        it("logs socket errors without changing the state", () => {
            const {connected, setReadyState} = setup();
            setReadyState(READY.OPEN, {id: "s1"});

            const error = vi.spyOn(console, "error").mockImplementation(() => {});
            act(() => hook.options!.onError(new Event("error")));
            expect(error).toHaveBeenCalledWith(expect.stringContaining("[WebSocket]"), expect.anything());
            error.mockRestore();
            expect(connected()).toBe(true);
        });

        it("resets everything on unmount", () => {
            const {connected, setReadyState, unmount} = setup();
            setReadyState(READY.OPEN, {id: "s1"});

            unmount();
            expect(connected()).toBe(false);
            expect(roomSocket()).toBeNull();
            expect(webSocketContext.sendWebsocketMessage).toBeNull();
        });

        it("ends up open under StrictMode's effect replay", () => {
            const socket = {id: "s1"};
            const {connected, setReadyState} = setup({strict: true});
            setReadyState(READY.OPEN, socket);
            expect(connected()).toBe(true);
            expect(roomSocket()).toBe(socket);
            expect(webSocketContext.sendWebsocketMessage).not.toBeNull();
        });
    });

    describe("sendWebsocketMessage", () => {
        it("sends JSON through the hook", () => {
            setup();
            const message = {code: "TYPING_START", payload: {channelId: "c1"}};
            webSocketContext.sendWebsocketMessage?.(message);
            expect(hook.sendJsonMessage).toHaveBeenCalledExactlyOnceWith(message);
        });
    });

    describe("incoming messages", () => {
        it("hands frame data to the message handler with the current user", () => {
            const {store} = setup();
            act(() => hook.options!.onMessage({data: '{"code":"X"}'}));
            expect(handleMessageMock).toHaveBeenCalledExactlyOnceWith('{"code":"X"}', {
                dispatch: store.dispatch,
                userId: "me",
            });
        });

        it("uses the latest user id", () => {
            const {store, dispatch} = setup();
            dispatch(updateUserData({...store.getState().authentication.user, id: "someone-else"}));
            act(() => hook.options!.onMessage({data: "{}"}));
            expect(handleMessageMock).toHaveBeenCalledWith("{}", expect.objectContaining({userId: "someone-else"}));
        });
    });
});
