type RoomMessageCode = "JOIN_ROOM" | "LEAVE_ROOM";

/** Wire format understood by the server's room handler. */
export function roomMessage(code: RoomMessageCode, rooms: string[]): string {
    return JSON.stringify({code, payload: rooms});
}

/** `WebSocket.OPEN`, spelled out so it also holds for socket-like objects without the static. */
const SOCKET_OPEN = 1;

export type RoomSocket = {readyState: number; send: (data: string) => void};

/**
 * How many callers hold each room. The server keeps one membership per room per connection,
 * so only the first acquire sends JOIN and only the last release sends LEAVE.
 */
const holders = new Map<string, number>();
let socket: RoomSocket | null = null;

function sendIfOpen(code: RoomMessageCode, rooms: string[]): void {
    // Never queued: anything missed while offline is covered by the rejoin in `setRoomSocket`.
    if (rooms.length > 0 && socket?.readyState === SOCKET_OPEN) {
        socket.send(roomMessage(code, rooms));
    }
}

/**
 * Sets the open connection (or `null` while offline). A new connection has no memberships
 * on the server, so every held room is joined on it in one message.
 */
export function setRoomSocket(next: RoomSocket | null): void {
    if (next === socket) return;
    socket = next;
    sendIfOpen("JOIN_ROOM", [...holders.keys()]);
}

/** Holds `room` until the returned release is called (once). */
export function acquireRoom(room: string): () => void {
    const count = holders.get(room) ?? 0;
    holders.set(room, count + 1);
    if (count === 0) sendIfOpen("JOIN_ROOM", [room]);

    let released = false;
    return () => {
        if (released) return;
        released = true;
        const left = (holders.get(room) ?? 1) - 1;
        if (left > 0) {
            holders.set(room, left);
            return;
        }
        holders.delete(room);
        sendIfOpen("LEAVE_ROOM", [room]);
    };
}

/** Rooms currently held, for diagnostics and tests. */
export function heldRooms(): string[] {
    return [...holders.keys()];
}

/** Forgets every membership and the socket. Tests only. */
export function resetRoomMemberships(): void {
    holders.clear();
    socket = null;
}
