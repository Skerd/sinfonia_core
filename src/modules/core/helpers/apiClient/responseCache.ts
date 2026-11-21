import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import {contextHeaders} from "@coreModule/helpers/apiClient/contextHeaders.ts";
import {onApiWrite} from "@coreModule/helpers/apiClient/apiWrites.ts";
import {buildBody, buildHeaders, buildUrl} from "@coreModule/helpers/general/httpRequestBuilders.ts";
import type {HttpRequest, RequestPayload} from "@coreModule/helpers/types/httpRequest.types.ts";

/*
 * Answers to reads flagged `cache` (see `HttpRequest.cache`), kept in memory for this tab. A page that asks again
 * for what it was just shown (Back, a revisit, a hovered link's prefetch) gets it at once and refreshes it in the
 * background; nothing here is ever the only source of truth.
 */

/** Shown again without asking: a hovered link's prefetch, then the click. */
const FRESH_MS = 10_000;
/** Older than this, an answer is not shown at all: the page loads as if it had never asked. */
const MAX_AGE_MS = 5 * 60_000;
const MAX_ENTRIES = 120;

type Entry = {data: unknown; at: number; stale: boolean};

const entries = new Map<string, Entry>();
const inFlight = new Map<string, Promise<unknown>>();

/** JSON with object keys sorted, so two requests built in a different key order share an answer. */
function stableStringify(value: unknown): string {
    return JSON.stringify(value, (_key, inner: unknown) => {
        if (!inner || typeof inner !== "object" || Array.isArray(inner)) return inner;
        return Object.fromEntries(Object.entries(inner).sort(([a], [b]) => a.localeCompare(b)));
    });
}

/**
 * Which answer a request reads: its method, URL, body and headers as `apiClient` will send them (the visitor's
 * session, language and company included). `null` for a multipart body, which is never a cached read.
 */
export function responseCacheKey(method: string, url: string, data: unknown, headers: Record<string, string>): string | null {
    if (data instanceof FormData) return null;
    const effective = {...headers};
    for (const [name, value] of Object.entries(contextHeaders())) {
        // Same precedence as apiClient: a request naming its site company keeps it.
        if (name === "x-site-company" && effective[name]) continue;
        effective[name] = value;
    }
    return stableStringify([method.toUpperCase(), url, data ?? null, effective]);
}

/**
 * The answer kept for `key`, as a copy the page may change freely: `fresh` when it may be shown without asking again.
 * Too old, or never asked: `undefined`.
 */
export function readCachedResponse(key: string): {data: unknown; fresh: boolean} | undefined {
    const entry = entries.get(key);
    if (!entry) return undefined;
    const age = Date.now() - entry.at;
    if (age > MAX_AGE_MS) {
        entries.delete(key);
        return undefined;
    }
    return {data: structuredClone(entry.data), fresh: !entry.stale && age < FRESH_MS};
}

/** Keeps a copy of `data`: the page that asked goes on using (and may change) its own. */
export function storeResponse(key: string, data: unknown): void {
    entries.delete(key);
    entries.set(key, {data: structuredClone(data), at: Date.now(), stale: false});
    // Map keeps insertion order, so the first key is the one used longest ago.
    while (entries.size > MAX_ENTRIES) {
        const oldest = entries.keys().next().value;
        if (oldest === undefined) break;
        entries.delete(oldest);
    }
}

/** A prefetch of `key` still on its way, which a page asking the same thing waits for instead of asking twice. */
export function pendingRead(key: string): Promise<unknown> | undefined {
    return inFlight.get(key);
}

/** After a write every kept answer may be out of date: still shown at once, but always asked again. */
export function markCachedResponsesStale(): void {
    entries.forEach((entry) => {
        entry.stale = true;
    });
}

onApiWrite(markCachedResponsesStale);

export function clearResponseCache(): void {
    entries.clear();
    inFlight.clear();
}

/**
 * Asks a cached read ahead of the page that will show it (a hovered or touched link), so the page opens with its
 * answer. Silent: no toasts, failures are dropped, and an answer still fresh or already on its way is not asked again.
 * `siteCompany` names the company of an apex company page the visitor is not on yet (`x-site-company`).
 */
export function prefetchHttpRequest(httpRequest: HttpRequest, requestData: RequestPayload = {}, options: {siteCompany?: string} = {}): void {
    const url = buildUrl(httpRequest, {}, httpRequest.url);
    const data = buildBody(httpRequest, {}, requestData);
    const headers = buildHeaders(httpRequest, {}, false);
    if (options.siteCompany) headers["x-site-company"] = options.siteCompany;
    const key = responseCacheKey(httpRequest.method, url, data, headers);
    if (!key || inFlight.has(key) || readCachedResponse(key)?.fresh) return;

    const request = apiClient({method: httpRequest.method, url, data, headers, responseType: httpRequest.responseType, cachedRead: true})
        .then((response) => {
            storeResponse(key, response.data);
            return response.data;
        })
        .finally(() => inFlight.delete(key));
    inFlight.set(key, request);
    request.catch(() => undefined);
}

/* Reads a page is waiting on (not prefetches, not background refreshes): the portal's progress bar follows them. */
let waitingReads = 0;
const waitingListeners = new Set<() => void>();

export function beginWaitingRead(): void {
    waitingReads += 1;
    waitingListeners.forEach((listener) => listener());
}

export function endWaitingRead(): void {
    waitingReads = Math.max(0, waitingReads - 1);
    waitingListeners.forEach((listener) => listener());
}

export function getWaitingReads(): number {
    return waitingReads;
}

export function subscribeWaitingReads(listener: () => void): () => void {
    waitingListeners.add(listener);
    return () => {
        waitingListeners.delete(listener);
    };
}
