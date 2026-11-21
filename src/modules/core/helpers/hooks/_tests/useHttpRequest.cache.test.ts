import {renderHook, waitFor} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import type {HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";

const {apiClientMock} = vi.hoisted(() => ({apiClientMock: vi.fn()}));

vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: apiClientMock}));
vi.mock("sonner", () => ({toast: {loading: vi.fn(), success: vi.fn(), error: vi.fn(), dismiss: vi.fn()}}));

import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {
    clearResponseCache,
    getWaitingReads,
    prefetchHttpRequest,
} from "@coreModule/helpers/apiClient/responseCache.ts";
import {noteApiWrite} from "@coreModule/helpers/apiClient/apiWrites.ts";

const READ: HttpRequest = {method: "post", url: "/api/read", data: {}, cache: true};
const PLAIN: HttpRequest = {method: "post", url: "/api/plain", data: {}};

/** Mounts a page asking `READ` for `id`, as a page opening would. */
const openPage = (id: string, count = 1) => renderHook(
    ({fetchCount}) => useHttpRequest<{name: string}>(READ, {id}, fetchCount),
    {initialProps: {fetchCount: count}},
);

describe("useHttpRequest with a cached read", () => {
    beforeEach(() => {
        clearResponseCache();
        apiClientMock.mockReset();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it("opens again with the last answer at once, without asking, while it is fresh", async () => {
        apiClientMock.mockResolvedValueOnce({data: {name: "first"}});
        const first = openPage("a");
        await waitFor(() => expect(first.result.current.data).toEqual({name: "first"}));
        first.unmount();

        const order: string[] = [];
        const success = vi.fn(() => order.push("success"));
        const again = renderHook(() => useHttpRequest<{name: string}>(READ, {id: "a"}, 1, true, {start: () => order.push("start"), success}));
        await waitFor(() => expect(again.result.current.data).toEqual({name: "first"}));
        expect(again.result.current.loading).toBe(false);
        expect(success).toHaveBeenCalledWith({name: "first"});
        // Callers that count started requests (withAxios, the entity card fetch) see a request start and settle.
        expect(order).toEqual(["start", "success"]);
        expect(apiClientMock).toHaveBeenCalledTimes(1);
    });

    it("shows an older answer at once and swaps in the server's newer one", async () => {
        vi.useFakeTimers({shouldAdvanceTime: true});
        apiClientMock.mockResolvedValueOnce({data: {name: "old"}});
        const first = openPage("a");
        await waitFor(() => expect(first.result.current.data).toEqual({name: "old"}));
        first.unmount();
        vi.advanceTimersByTime(11_000);

        let answer: (value: {data: {name: string}}) => void = () => undefined;
        apiClientMock.mockImplementationOnce(() => new Promise((resolve) => { answer = resolve; }));
        const again = openPage("a");
        await waitFor(() => expect(again.result.current.data).toEqual({name: "old"}));
        expect(again.result.current.loading).toBe(false);
        expect(apiClientMock).toHaveBeenCalledTimes(2);
        // A refresh behind the shown answer is not a wait the progress bar shows.
        expect(getWaitingReads()).toBe(0);

        answer({data: {name: "new"}});
        await waitFor(() => expect(again.result.current.data).toEqual({name: "new"}));
        expect(again.result.current.loading).toBe(false);
    });

    it("keeps the shown answer when the background refresh finds the network down", async () => {
        vi.useFakeTimers({shouldAdvanceTime: true});
        apiClientMock.mockResolvedValueOnce({data: {name: "kept"}});
        const first = openPage("a");
        await waitFor(() => expect(first.result.current.data).toEqual({name: "kept"}));
        first.unmount();
        vi.advanceTimersByTime(11_000);

        apiClientMock.mockRejectedValueOnce(new Error("Network Error"));
        const again = openPage("a");
        await waitFor(() => expect(apiClientMock).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(again.result.current.loading).toBe(false));
        expect(again.result.current.data).toEqual({name: "kept"});
        expect(again.result.current.error).toBeNull();
    });

    it("asks the server when the page asks again for what it shows (a refresh)", async () => {
        apiClientMock.mockResolvedValueOnce({data: {name: "before"}});
        const page = openPage("a");
        await waitFor(() => expect(page.result.current.data).toEqual({name: "before"}));

        apiClientMock.mockResolvedValueOnce({data: {name: "after"}});
        page.rerender({fetchCount: 2});
        await waitFor(() => expect(page.result.current.data).toEqual({name: "after"}));
        expect(apiClientMock).toHaveBeenCalledTimes(2);
    });

    it("waits for a prefetch of the same read instead of asking twice", async () => {
        let answer: (value: {data: {name: string}}) => void = () => undefined;
        apiClientMock.mockImplementationOnce(() => new Promise((resolve) => { answer = resolve; }));
        prefetchHttpRequest(READ, {id: "a"});

        const page = openPage("a");
        expect(page.result.current.loading).toBe(true);
        await waitFor(() => expect(getWaitingReads()).toBe(1));
        answer({data: {name: "prefetched"}});
        await waitFor(() => expect(page.result.current.data).toEqual({name: "prefetched"}));
        expect(apiClientMock).toHaveBeenCalledTimes(1);
        expect(getWaitingReads()).toBe(0);
    });

    it("asks again after any write through apiClient, still showing the kept answer meanwhile", async () => {
        apiClientMock.mockResolvedValueOnce({data: {name: "before write"}});
        const first = openPage("a");
        await waitFor(() => expect(first.result.current.data).toEqual({name: "before write"}));
        first.unmount();

        // The real apiClient reports a write (the checkout placing an order); here it is mocked.
        noteApiWrite();

        apiClientMock.mockResolvedValueOnce({data: {name: "after write"}});
        const again = openPage("a");
        await waitFor(() => expect(again.result.current.data).toEqual({name: "after write"}));
        expect(apiClientMock).toHaveBeenCalledTimes(2);
    });

    it("sends a cached read as one, so apiClient does not take it for a write", async () => {
        apiClientMock.mockResolvedValue({data: {}});
        openPage("a");
        renderHook(() => useHttpRequest(PLAIN, {}, 1));
        await waitFor(() => expect(apiClientMock).toHaveBeenCalledTimes(2));
        expect(apiClientMock).toHaveBeenCalledWith(expect.objectContaining({url: "/api/read", cachedRead: true}));
        expect(apiClientMock).toHaveBeenCalledWith(expect.objectContaining({url: "/api/plain", cachedRead: false}));
    });

    it("never shares answers between two reads that differ", async () => {
        apiClientMock.mockResolvedValueOnce({data: {name: "a"}});
        const pageA = openPage("a");
        await waitFor(() => expect(pageA.result.current.data).toEqual({name: "a"}));

        apiClientMock.mockResolvedValueOnce({data: {name: "b"}});
        const pageB = openPage("b");
        expect(pageB.result.current.loading).toBe(true);
        await waitFor(() => expect(pageB.result.current.data).toEqual({name: "b"}));
        expect(apiClientMock).toHaveBeenCalledTimes(2);
    });
});
