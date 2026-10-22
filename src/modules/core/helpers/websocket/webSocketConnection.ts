/** Connection policy for the panel socket (`WebSocketProvider`). */

/**
 * Close codes after which reconnecting would not help:
 * - 1000: a deliberate close.
 * - 1008: the server rejected the token, a malformed frame, or too many connections, or the
 *   session expired or was revoked. A new token changes the URL, which opens a fresh connection anyway.
 *
 * Everything else reconnects, notably 1006 (connection lost) and 1011 (server-side failure).
 * Keep in sync with the close codes in maestro's `websocket/webSocket.ts`.
 */
export const NO_RECONNECT_CLOSE_CODES: ReadonlySet<number> = new Set([1000, 1008]);
const MAX_RECONNECT_DELAY_MS = 30_000;

/** `ws(s)://<host>/ws/<token>/<languageCode>`, matching the page's protocol. */
export function buildWebSocketUrl(
    token: string,
    languageCode: string,
    location: Pick<Location, "protocol" | "host"> = window.location,
): string {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${location.host}/ws/${encodeURIComponent(token)}/${encodeURIComponent(languageCode)}`;
}

/** Exponential backoff (1s, 2s, 4s … capped at 30s) plus up to 1s of jitter so clients don't reconnect in lockstep. */
export function reconnectDelay(attempt: number, random: () => number = Math.random): number {
    return Math.min(MAX_RECONNECT_DELAY_MS, 1000 * 2 ** attempt) + Math.floor(random() * 1000);
}

/** `react-use-websocket`'s `shouldReconnect`: retry unless the close code is final. */
export function shouldReconnect(event: Pick<CloseEvent, "code">): boolean {
    return !NO_RECONNECT_CLOSE_CODES.has(event.code);
}
