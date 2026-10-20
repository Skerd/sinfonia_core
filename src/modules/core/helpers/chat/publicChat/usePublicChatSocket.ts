/**
 * Visitor WebSocket for the public chat.
 *
 * The socket is used purely as a *wake-up signal*: the server tells us "channel
 * X has message Y", and we re-run the same incremental fetch the polling loop
 * uses. That keeps exactly one code path for turning server state into rendered
 * messages, and means a dropped socket degrades to polling rather than to a
 * different (and separately buggy) rendering path.
 *
 * The connection is confined server-side to this visitor's single channel — it
 * joins no rooms and receives no system broadcasts.
 */

import {useEffect, useRef, useState} from "react";
import {WebSocketMessageCodes} from "armonia/src/modules/core/websocket/types";
import {getVisitorToken} from "@coreModule/helpers/chat/publicChat/publicChatClient.ts";

/**
 * Codes that should make the widget re-fetch. Only new messages matter here —
 * the public widget renders no receipts, reactions or pins, so the other codes
 * would be wasted round-trips.
 */
const WAKE_CODES: string[] = [WebSocketMessageCodes.NEW_MESSAGE];

const MAX_RECONNECT_DELAY_MS = 30000;
const BASE_RECONNECT_DELAY_MS = 1000;

function buildSocketUrl(token: string, languageCode: string): string {
    const scheme = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${scheme}//${window.location.host}/ws/${token}/${languageCode}`;
}

export type PublicChatSocketOptions = {
    /** Only connect while the panel is open and a session exists. */
    enabled: boolean;
    languageCode?: string;
    /** Called when the server signals there is something new to fetch. */
    onWake: () => void;
    /** Called when an agent signals they are typing. */
    onAgentTyping?: (typing: boolean) => void;
};

/**
 * Maintains the visitor socket with exponential backoff.
 *
 * @returns whether the socket is currently connected — the caller slows its
 *          polling loop down while it is.
 */
export function usePublicChatSocket(options: PublicChatSocketOptions): boolean {
    const {enabled, languageCode = "en-US", onWake, onAgentTyping} = options;
    const [isConnected, setIsConnected] = useState(false);

    // Keep the latest callbacks in refs so reconnect logic never re-subscribes
    // just because a parent re-rendered.
    const onWakeRef = useRef(onWake);
    const onAgentTypingRef = useRef(onAgentTyping);
    onWakeRef.current = onWake;
    onAgentTypingRef.current = onAgentTyping;

    useEffect(() => {
        if (!enabled) {
            return;
        }
        const token = getVisitorToken();
        if (!token) {
            return;
        }

        let socket: WebSocket | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
        let attempt = 0;
        let disposed = false;

        const connect = () => {
            if (disposed) {
                return;
            }
            try {
                socket = new WebSocket(buildSocketUrl(token, languageCode));
            }
            catch {
                scheduleReconnect();
                return;
            }

            socket.onopen = () => {
                attempt = 0;
                setIsConnected(true);
            };

            socket.onmessage = (event: MessageEvent) => {
                // The server sends a plain-text greeting before any JSON frames.
                let parsed: {code?: string; payload?: Record<string, unknown>};
                try {
                    parsed = JSON.parse(String(event.data));
                }
                catch {
                    return;
                }
                if (!parsed?.code) {
                    return;
                }
                if (WAKE_CODES.includes(parsed.code)) {
                    onWakeRef.current();
                    return;
                }
                if (parsed.code === WebSocketMessageCodes.TYPING_START) {
                    onAgentTypingRef.current?.(true);
                }
                else if (parsed.code === WebSocketMessageCodes.TYPING_STOP) {
                    onAgentTypingRef.current?.(false);
                }
            };

            socket.onclose = (event: CloseEvent) => {
                setIsConnected(false);
                // 1008 is the server refusing the token outright — retrying with
                // the same token would just loop.
                if (event.code !== 1008) {
                    scheduleReconnect();
                }
            };

            socket.onerror = () => {
                // `onclose` always follows; reconnect is scheduled there.
                setIsConnected(false);
            };
        };

        const scheduleReconnect = () => {
            if (disposed || reconnectTimer) {
                return;
            }
            const backoff = Math.min(
                MAX_RECONNECT_DELAY_MS,
                BASE_RECONNECT_DELAY_MS * 2 ** attempt,
            ) + Math.floor(Math.random() * 500);
            attempt += 1;
            reconnectTimer = setTimeout(() => {
                reconnectTimer = null;
                connect();
            }, backoff);
        };

        connect();

        return () => {
            disposed = true;
            setIsConnected(false);
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
            }
            if (socket) {
                socket.onclose = null;
                socket.onerror = null;
                socket.onmessage = null;
                socket.onopen = null;
                try {
                    socket.close(1000, "Chat closed");
                }
                catch {
                    /* already closing */
                }
            }
        };
    }, [enabled, languageCode]);

    return isConnected;
}
