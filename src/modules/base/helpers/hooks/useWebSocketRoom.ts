import {useEffect} from "react";
import {acquireRoom} from "@baseModule/helpers/websocket/roomMemberships.ts";

/**
 * Keeps the shared socket joined to `room` while mounted; `null` / `""` joins nothing.
 * Changing `room` leaves the old one first. Several callers may hold the same room: it is only
 * left when the last one lets go. Joining while offline and rejoining after a reconnect are
 * handled by `roomMemberships`.
 */
export function useWebSocketRoom(room: string | null | undefined): void {
    useEffect(() => (room ? acquireRoom(room) : undefined), [room]);
}
