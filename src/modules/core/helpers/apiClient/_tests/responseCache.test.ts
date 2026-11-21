import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import type {HttpRequest} from "@coreModule/helpers/types/httpRequest.types.ts";

const {apiClientMock, context} = vi.hoisted(() => ({
    apiClientMock: vi.fn(),
    context: {headers: {} as Record<string, string>},
}));

vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: apiClientMock}));
vi.mock("@coreModule/helpers/apiClient/contextHeaders.ts", () => ({contextHeaders: () => context.headers}));

import {
    beginWaitingRead,
    clearResponseCache,
    endWaitingRead,
    getWaitingReads,
    markCachedResponsesStale,
    pendingRead,
    prefetchHttpRequest,
    readCachedResponse,
    responseCacheKey,
    storeResponse,
    subscribeWaitingReads,
} from "@coreModule/helpers/apiClient/responseCache.ts";

const READ: HttpRequest = {method: "post", url: "/api/read", data: {}, cache: true};

describe("responseCache", () => {
    beforeEach(() => {
        clearResponseCache();
        apiClientMock.mockReset();
        context.headers = {"language": "en-US"};
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it("keys on the request and on who asks, whatever the key order of the body", () => {
        const key = responseCacheKey("post", "/api/read", {a: 1, b: {c: 2, d: 3}}, {});
        expect(responseCacheKey("POST", "/api/read", {b: {d: 3, c: 2}, a: 1}, {})).toBe(key);
        expect(responseCacheKey("post", "/api/read", {a: 2, b: {c: 2, d: 3}}, {})).not.toBe(key);
        context.headers = {"language": "de-CH"};
        expect(responseCacheKey("post", "/api/read", {a: 1, b: {c: 2, d: 3}}, {})).not.toBe(key);
        context.headers = {"language": "en-US", "x-auth-token": "visitor"};
        expect(responseCacheKey("post", "/api/read", {a: 1, b: {c: 2, d: 3}}, {})).not.toBe(key);
    });

    it("lets a request's own site company win over the page's, as apiClient does", () => {
        context.headers = {"x-site-company": "rental"};
        const onRentalPage = responseCacheKey("post", "/api/read", {}, {});
        context.headers = {};
        expect(responseCacheKey("post", "/api/read", {}, {"x-site-company": "rental"})).toBe(onRentalPage);
        context.headers = {"x-site-company": "clinic"};
        expect(responseCacheKey("post", "/api/read", {}, {"x-site-company": "rental"})).toBe(onRentalPage);
    });

    it("never keys a multipart body", () => {
        expect(responseCacheKey("post", "/api/read", new FormData(), {})).toBeNull();
    });

    it("answers fresh at first, then stale, then not at all", () => {
        storeResponse("k", {n: 1});
        expect(readCachedResponse("k")).toEqual({data: {n: 1}, fresh: true});
        vi.advanceTimersByTime(11_000);
        expect(readCachedResponse("k")).toEqual({data: {n: 1}, fresh: false});
        vi.advanceTimersByTime(5 * 60_000);
        expect(readCachedResponse("k")).toBeUndefined();
    });

    it("marks every answer stale after a write, still answering with it", () => {
        storeResponse("k", {n: 1});
        markCachedResponsesStale();
        expect(readCachedResponse("k")).toEqual({data: {n: 1}, fresh: false});
    });

    it("hands out copies: a page changing its answer never changes the kept one", () => {
        const answer = {items: [1]};
        storeResponse("k", answer);
        answer.items.push(2);
        const read = readCachedResponse("k");
        expect(read?.data).toEqual({items: [1]});
        (read?.data as {items: number[]}).items.push(3);
        expect(readCachedResponse("k")?.data).toEqual({items: [1]});
    });

    it("forgets the answer used longest ago beyond 120", () => {
        for (let index = 0; index <= 120; index += 1) storeResponse(`k${index}`, index);
        expect(readCachedResponse("k0")).toBeUndefined();
        expect(readCachedResponse("k120")?.data).toBe(120);
    });

    it("prefetches once, keeps the answer, and sends the site company it is given", async () => {
        apiClientMock.mockResolvedValue({data: {product: "p1"}});
        prefetchHttpRequest(READ, {id: "p1"}, {siteCompany: "store"});
        prefetchHttpRequest(READ, {id: "p1"}, {siteCompany: "store"});
        expect(apiClientMock).toHaveBeenCalledTimes(1);
        expect(apiClientMock).toHaveBeenCalledWith(expect.objectContaining({
            method: "post", url: "/api/read", data: {id: "p1"}, headers: {"x-site-company": "store"},
        }));
        const key = responseCacheKey("post", "/api/read", {id: "p1"}, {"x-site-company": "store"}) ?? "";
        expect(pendingRead(key)).toBeDefined();
        await vi.runAllTimersAsync();
        expect(pendingRead(key)).toBeUndefined();
        expect(readCachedResponse(key)).toEqual({data: {product: "p1"}, fresh: true});
        prefetchHttpRequest(READ, {id: "p1"}, {siteCompany: "store"});
        expect(apiClientMock).toHaveBeenCalledTimes(1);
    });

    it("drops a failed prefetch silently", async () => {
        apiClientMock.mockRejectedValue(new Error("offline"));
        prefetchHttpRequest(READ, {id: "p1"});
        await vi.runAllTimersAsync();
        const key = responseCacheKey("post", "/api/read", {id: "p1"}, {}) ?? "";
        expect(readCachedResponse(key)).toBeUndefined();
        expect(pendingRead(key)).toBeUndefined();
    });

    it("tells its listeners how many reads a page is waiting on", () => {
        const listener = vi.fn();
        const unsubscribe = subscribeWaitingReads(listener);
        beginWaitingRead();
        beginWaitingRead();
        expect(getWaitingReads()).toBe(2);
        endWaitingRead();
        endWaitingRead();
        endWaitingRead();
        expect(getWaitingReads()).toBe(0);
        expect(listener).toHaveBeenCalledTimes(5);
        unsubscribe();
        beginWaitingRead();
        expect(listener).toHaveBeenCalledTimes(5);
        endWaitingRead();
    });
});
