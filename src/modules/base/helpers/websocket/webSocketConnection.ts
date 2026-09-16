/** Connection policy for the panel socket (`WebSocketProvider`). */

/** Close codes after which reconnecting would not help: a normal close, or the server rejecting the token. */
export const NO_RECONNECT_CLOSE_CODES = new Set([1000, 1008]);
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

export function shouldReconnect(event: CloseEvent): boolean {
    return !NO_RECONNECT_CLOSE_CODES.has(event.code);
}
