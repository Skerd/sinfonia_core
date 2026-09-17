import {renderHook} from "@testing-library/react";
import {StrictMode, type ReactNode} from "react";
import {beforeEach, describe, expect, it, type Mock, vi} from "vitest";
import {
    acquireRoom,
    heldRooms,
    resetRoomMemberships,
    roomMessage,
    setRoomSocket,
} from "@baseModule/helpers/websocket/roomMemberships.ts";
import {useWebSocketRoom} from "@baseModule/helpers/hooks/useWebSocketRoom.ts";

type FakeSocket = {readyState: number; send: Mock<(data: string) => void>};

const CONNECTING = 0;
const OPEN = 1;
const CLOSED = 3;

const makeSocket = (readyState = OPEN): FakeSocket => ({readyState, send: vi.fn()});
const sent = (socket: FakeSocket) => socket.send.mock.calls.map(([data]) => JSON.parse(data));
const join = (...rooms: string[]) => ({code: "JOIN_ROOM", payload: rooms});
const leave = (...rooms: string[]) => ({code: "LEAVE_ROOM", payload: rooms});

function renderRoom(initialRoom: string | null | undefined, {strict = false} = {}) {
    const wrapper = strict ? ({children}: {children: ReactNode}) => <StrictMode>{children}</StrictMode> : undefined;
    const utils = renderHook(({room}: {room: string | null | undefined}) => useWebSocketRoom(room), {
        wrapper,
        initialProps: {room: initialRoom},
    });
    return {...utils, setRoom: (room: string | null | undefined) => utils.rerender({room})};
}

let socket: FakeSocket;

beforeEach(() => {
    resetRoomMemberships();
    socket = makeSocket();
    setRoomSocket(socket);
});

describe("roomMessage", () => {
    it("builds the server's room payload", () => {
        expect(JSON.parse(roomMessage("JOIN_ROOM", ["serverStats"]))).toEqual(join("serverStats"));
        expect(JSON.parse(roomMessage("LEAVE_ROOM", ["a", "b"]))).toEqual(leave("a", "b"));
    });
});

describe("roomMemberships", () => {
    it("joins on the first holder and leaves after the last", () => {
        const first = acquireRoom("websiteChats");
        const second = acquireRoom("websiteChats");
        first();
        expect(sent(socket)).toEqual([join("websiteChats")]);

        second();
        expect(sent(socket)).toEqual([join("websiteChats"), leave("websiteChats")]);
        expect(heldRooms()).toEqual([]);
    });

    it("ignores a repeated release", () => {
        const first = acquireRoom("chats");
        acquireRoom("chats");
        first();
        first();
        expect(heldRooms()).toEqual(["chats"]);
        expect(sent(socket)).toEqual([join("chats")]);
    });

    it("holds rooms while offline and joins them all once a socket opens", () => {
        setRoomSocket(null);
        acquireRoom("home");
        acquireRoom("serverStats");
        const released = acquireRoom("allChats");
        released();

        const next = makeSocket();
        setRoomSocket(next);
        expect(socket.send).not.toHaveBeenCalled();
        expect(sent(next)).toEqual([join("home", "serverStats")]);
    });

    it("rejoins every held room on a new socket after a reconnect", () => {
        acquireRoom("home");
        acquireRoom("serverHealth");
        socket.readyState = CLOSED;
        setRoomSocket(null);

        const next = makeSocket();
        setRoomSocket(next);
        expect(sent(socket)).toEqual([join("home"), join("serverHealth")]);
        expect(sent(next)).toEqual([join("home", "serverHealth")]);
    });

    it("does not rejoin when the same socket is set again", () => {
        acquireRoom("home");
        setRoomSocket(socket);
        expect(sent(socket)).toEqual([join("home")]);
    });

    it("sends nothing on a socket with no rooms held", () => {
        const next = makeSocket();
        setRoomSocket(next);
        expect(next.send).not.toHaveBeenCalled();
    });

    it("does not send on a socket that is not open", () => {
        const connecting = makeSocket(CONNECTING);
        setRoomSocket(connecting);
        const release = acquireRoom("home");
        connecting.readyState = CLOSED;
        release();
        expect(connecting.send).not.toHaveBeenCalled();
    });

    it("sends LEAVE on the current socket, which was rejoined to the room", () => {
        const release = acquireRoom("allChats");
        const next = makeSocket();
        setRoomSocket(next);
        release();
        expect(sent(next)).toEqual([join("allChats"), leave("allChats")]);
    });
});

describe("useWebSocketRoom", () => {
    it("joins on mount and leaves on unmount", () => {
        const {unmount} = renderRoom("serverStats");
        expect(sent(socket)).toEqual([join("serverStats")]);

        unmount();
        expect(sent(socket)).toEqual([join("serverStats"), leave("serverStats")]);
    });

    it("does nothing without a room", () => {
        const {unmount} = renderRoom(null);
        renderRoom(undefined);
        renderRoom("");
        unmount();
        expect(socket.send).not.toHaveBeenCalled();
    });

    it("switches rooms, leaving the old one first", () => {
        const {setRoom} = renderRoom("allChats");
        setRoom("websiteChats");
        expect(sent(socket)).toEqual([join("allChats"), leave("allChats"), join("websiteChats")]);
    });

    it("does not resend for the same room", () => {
        const {setRoom, rerender} = renderRoom("allChats");
        setRoom("allChats");
        rerender({room: "allChats"});
        expect(sent(socket)).toEqual([join("allChats")]);
    });

    it("leaves when the room is cleared", () => {
        const {setRoom} = renderRoom("allChats");
        setRoom(null);
        expect(sent(socket)).toEqual([join("allChats"), leave("allChats")]);
    });

    it("keeps separate memberships for separate rooms", () => {
        const first = renderRoom("serverStats");
        renderRoom("serverHealth");

        first.unmount();
        expect(sent(socket)).toEqual([join("serverStats"), join("serverHealth"), leave("serverStats")]);
    });

    it("keeps a shared room joined until its last caller unmounts", () => {
        const page = renderRoom("websiteChats");
        const siteRoom = renderRoom("websiteChats");

        page.unmount();
        expect(sent(socket)).toEqual([join("websiteChats")]);

        siteRoom.unmount();
        expect(sent(socket)).toEqual([join("websiteChats"), leave("websiteChats")]);
    });

    it("ends up joined under StrictMode's effect replay", () => {
        renderRoom("home", {strict: true});
        expect(heldRooms()).toEqual(["home"]);
        expect(sent(socket).at(-1)).toEqual(join("home"));
    });
});
