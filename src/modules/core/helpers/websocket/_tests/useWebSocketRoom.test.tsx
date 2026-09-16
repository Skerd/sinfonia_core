import {act, renderHook} from "@testing-library/react";
import type {ReactNode} from "react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {Provider} from "react-redux";
import {configureStore, createSlice, type PayloadAction} from "@reduxjs/toolkit";

type FakeSocket = {readyState: number; send: ReturnType<typeof vi.fn>};

const socketState = vi.hoisted(() => ({current: null as FakeSocket | null}));

vi.mock("@baseModule/helpers/context/webSocketContext.tsx", () => ({
    get clientWebSocket() {
        return socketState.current;
    },
}));

import {roomMessage, useWebSocketRoom} from "@coreModule/helpers/websocket/useWebSocketRoom.ts";

const CONNECTING = 0;
const OPEN = 1;
const CLOSED = 3;

const uiSlice = createSlice({
    name: "ui",
    initialState: {webSocketConnected: false},
    reducers: {
        setConnected: (state, action: PayloadAction<boolean>) => void (state.webSocketConnected = action.payload),
    },
});

const makeSocket = (readyState = OPEN): FakeSocket => ({readyState, send: vi.fn()});
const sent = (socket: FakeSocket) => socket.send.mock.calls.map(([data]) => JSON.parse(data));
const join = (room: string) => ({code: "JOIN_ROOM", payload: [room]});
const leave = (room: string) => ({code: "LEAVE_ROOM", payload: [room]});

function renderRoom(initialRoom: string | null | undefined, {connected = true} = {}) {
    const store = configureStore({
        reducer: {ui: uiSlice.reducer},
        preloadedState: {ui: {webSocketConnected: connected}},
    });
    const wrapper = ({children}: {children: ReactNode}) => <Provider store={store}>{children}</Provider>;
    const utils = renderHook(({room}: {room: string | null | undefined}) => useWebSocketRoom(room), {
        wrapper,
        initialProps: {room: initialRoom},
    });
    return {
        ...utils,
        setRoom: (room: string | null | undefined) => utils.rerender({room}),
        setConnected: (value: boolean) => act(() => void store.dispatch(uiSlice.actions.setConnected(value))),
    };
}

beforeEach(() => {
    socketState.current = makeSocket();
});

describe("roomMessage", () => {
    it("builds the server's room payload", () => {
        expect(JSON.parse(roomMessage("JOIN_ROOM", "serverStats"))).toEqual(join("serverStats"));
        expect(JSON.parse(roomMessage("LEAVE_ROOM", "serverStats"))).toEqual(leave("serverStats"));
    });
});

describe("useWebSocketRoom", () => {
    it("joins on mount and leaves on unmount", () => {
        const {unmount} = renderRoom("serverStats");
        expect(sent(socketState.current!)).toEqual([join("serverStats")]);

        unmount();
        expect(sent(socketState.current!)).toEqual([join("serverStats"), leave("serverStats")]);
    });

    it("does nothing without a room", () => {
        const {unmount} = renderRoom(null);
        renderRoom(undefined);
        renderRoom("");
        unmount();
        expect(socketState.current!.send).not.toHaveBeenCalled();
    });

    it("switches rooms, leaving the old one first", () => {
        const {setRoom} = renderRoom("allChats");
        setRoom("websiteChats");
        expect(sent(socketState.current!)).toEqual([join("allChats"), leave("allChats"), join("websiteChats")]);
    });

    it("does not resend for the same room", () => {
        const {setRoom, rerender} = renderRoom("allChats");
        setRoom("allChats");
        rerender({room: "allChats"});
        expect(sent(socketState.current!)).toEqual([join("allChats")]);
    });

    it("leaves when the room is cleared", () => {
        const {setRoom} = renderRoom("allChats");
        setRoom(null);
        expect(sent(socketState.current!)).toEqual([join("allChats"), leave("allChats")]);
    });

    it("waits for the connection flag, then joins", () => {
        const {setConnected} = renderRoom("serverHealth", {connected: false});
        expect(socketState.current!.send).not.toHaveBeenCalled();

        setConnected(true);
        expect(sent(socketState.current!)).toEqual([join("serverHealth")]);
    });

    it("does not send on a socket that is not open", () => {
        socketState.current = makeSocket(CONNECTING);
        renderRoom("serverHealth");
        expect(socketState.current.send).not.toHaveBeenCalled();
    });

    it("does not throw without a socket", () => {
        socketState.current = null;
        const {unmount} = renderRoom("serverHealth");
        expect(() => unmount()).not.toThrow();
    });

    it("skips LEAVE when the socket has closed", () => {
        const socket = socketState.current!;
        const {setConnected} = renderRoom("serverHealth");

        socket.readyState = CLOSED;
        setConnected(false);
        expect(sent(socket)).toEqual([join("serverHealth")]);
    });

    it("rejoins on the new socket after a reconnect", () => {
        const oldSocket = socketState.current!;
        const {setConnected} = renderRoom("serverStats");

        oldSocket.readyState = CLOSED;
        socketState.current = null;
        setConnected(false);

        const newSocket = makeSocket();
        socketState.current = newSocket;
        setConnected(true);

        expect(sent(oldSocket)).toEqual([join("serverStats")]);
        expect(sent(newSocket)).toEqual([join("serverStats")]);
    });

    it("sends LEAVE to the socket it joined on, not a replacement", () => {
        const oldSocket = socketState.current!;
        const {setRoom} = renderRoom("allChats");

        // Socket swapped while the connection flag stayed true.
        const newSocket = makeSocket();
        socketState.current = newSocket;
        setRoom("websiteChats");

        expect(sent(oldSocket)).toEqual([join("allChats"), leave("allChats")]);
        expect(sent(newSocket)).toEqual([join("websiteChats")]);
    });

    it("keeps separate memberships for separate callers", () => {
        const first = renderRoom("serverStats");
        renderRoom("serverHealth");

        first.unmount();
        expect(sent(socketState.current!)).toEqual([
            join("serverStats"),
            join("serverHealth"),
            leave("serverStats"),
        ]);
    });
});
