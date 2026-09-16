import {useEffect} from "react";
import {useSelector} from "react-redux";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {clientWebSocket} from "@baseModule/helpers/context/webSocketContext.tsx";

type RoomMessageCode = "JOIN_ROOM" | "LEAVE_ROOM";

/** Wire format understood by the server's room handler. */
export function roomMessage(code: RoomMessageCode, room: string): string {
    return JSON.stringify({code, payload: [room]});
}

/** `WebSocket.OPEN`, spelled out so it also holds for socket-like objects without the static. */
const SOCKET_OPEN = 1;

type RoomSocket = {readyState: number; send: (data: string) => void};

function isOpen(socket: RoomSocket | null | undefined): socket is RoomSocket {
    return socket?.readyState === SOCKET_OPEN;
}

/**
 * Keeps the shared socket joined to `room` while mounted and connected.
 * Changing `room` leaves the old one first; `null` / `""` joins nothing.
 * Rejoins after a reconnect, since the server drops memberships with the connection.
 */
export function useWebSocketRoom(room: string | null | undefined): void {
    const webSocketConnected = useSelector((state: RootState) => state.ui.webSocketConnected);

    useEffect(() => {
        // Capture the socket we join on: `clientWebSocket` is reassigned on reconnect, and
        // LEAVE must go to the same connection (a new one never joined this room).
        const socket = clientWebSocket as RoomSocket | null;
        if (!room || !webSocketConnected || !isOpen(socket)) {
            return;
        }

        socket.send(roomMessage("JOIN_ROOM", room));
        return () => {
            if (isOpen(socket)) {
                socket.send(roomMessage("LEAVE_ROOM", room));
            }
        };
    }, [webSocketConnected, room]);
}
