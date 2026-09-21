import {renderHook, act, waitFor} from "@testing-library/react";
import {describe, expect, it, vi, beforeEach, afterEach} from "vitest";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import {useApiSelectOptions, type UseApiSelectOptionsArgs} from "@coreModule/helpers/hooks/components/useApiSelectOptions.ts";

vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: {post: vi.fn()}}));
vi.mock("@coreModule/helpers/general/errors.ts", () => ({
    handleError: vi.fn(),
    isAbortError: (err: unknown) => (err as {name?: string})?.name === "AbortError",
}));

const post = vi.mocked(apiClient.post);

const page = (ids: string[], total: number) => ({data: {data: ids.map((id) => ({_id: id, name: id})), total}});

const args = (over: Partial<UseApiSelectOptionsArgs> = {}): UseApiSelectOptionsArgs => ({
    apiUrl: "/api/things",
    disabled: false,
    pageSize: 2,
    postBody: {},
    searchDebounceMs: 0,
    open: true,
    searchText: "",
    multiple: false,
    defaultOptions: [],
    ...over,
});

beforeEach(() => {
    post.mockReset();
    vi.useFakeTimers({shouldAdvanceTime: true});
});
afterEach(() => vi.useRealTimers());

describe("useApiSelectOptions", () => {
    it("loads the first page when opened", async () => {
        post.mockResolvedValue(page(["a", "b"], 2));
        const {result} = renderHook(() => useApiSelectOptions(args()));
        await waitFor(() => expect(result.current.options).toHaveLength(2));
        expect(result.current.options.map((o) => o.value)).toEqual(["a", "b"]);
        expect(result.current.hasMore).toBe(false);
    });

    it("appends the next page without duplicating entries", async () => {
        post.mockResolvedValueOnce(page(["a", "b"], 4)).mockResolvedValueOnce(page(["b", "c"], 4));
        const {result} = renderHook(() => useApiSelectOptions(args()));
        await waitFor(() => expect(result.current.options).toHaveLength(2));
        act(() => result.current.loadMore());
        await waitFor(() => expect(result.current.options).toHaveLength(3));
        expect(result.current.options.map((o) => o.value)).toEqual(["a", "b", "c"]);
    });

    /**
     * The regression this hook was extracted to fix: a second search used to be dropped outright
     * while the first was still in flight, leaving the list showing results for the old query.
     */
    it("supersedes an in-flight search instead of dropping the new one", async () => {
        let releaseFirst: (v: unknown) => void = () => {};
        post.mockImplementationOnce(() => new Promise((res) => {releaseFirst = res;}))
            .mockResolvedValueOnce(page(["match"], 1));

        const {result, rerender} = renderHook((p: UseApiSelectOptionsArgs) => useApiSelectOptions(p), {
            initialProps: args(),
        });
        await waitFor(() => expect(post).toHaveBeenCalledTimes(1));

        rerender(args({searchText: "ma"}));
        await waitFor(() => expect(post).toHaveBeenCalledTimes(2));

        // The stale first response arriving late must not overwrite the newer query's results.
        act(() => releaseFirst(page(["stale"], 1)));
        await waitFor(() => expect(result.current.options.map((o) => o.value)).toEqual(["match"]));
    });

    it("does not leave the spinner on when a superseded request settles", async () => {
        let releaseFirst: (v: unknown) => void = () => {};
        post.mockImplementationOnce(() => new Promise((res) => {releaseFirst = res;}))
            .mockResolvedValueOnce(page(["match"], 1));

        const {result, rerender} = renderHook((p: UseApiSelectOptionsArgs) => useApiSelectOptions(p), {
            initialProps: args(),
        });
        await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
        rerender(args({searchText: "ma"}));
        act(() => releaseFirst(page(["stale"], 1)));
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.options.map((o) => o.value)).toEqual(["match"]);
    });

    it("serves a repeated search from cache without refetching", async () => {
        post.mockResolvedValue(page(["a", "b"], 2));
        const {result, rerender} = renderHook((p: UseApiSelectOptionsArgs) => useApiSelectOptions(p), {
            initialProps: args(),
        });
        await waitFor(() => expect(result.current.options).toHaveLength(2));
        const callsAfterFirst = post.mock.calls.length;

        rerender(args({searchText: "zzz"}));
        await waitFor(() => expect(post.mock.calls.length).toBeGreaterThan(callsAfterFirst));
        const callsAfterSearch = post.mock.calls.length;

        rerender(args({searchText: ""}));
        await waitFor(() => expect(result.current.options).toHaveLength(2));
        expect(post.mock.calls.length).toBe(callsAfterSearch);
    });

    it("stays idle while disabled", async () => {
        post.mockResolvedValue(page(["a"], 1));
        renderHook(() => useApiSelectOptions(args({disabled: true})));
        await act(async () => {await Promise.resolve();});
        expect(post).not.toHaveBeenCalled();
    });

    it("reports a value it cannot yet label as pending", async () => {
        post.mockResolvedValue(page(["a"], 1));
        const {result} = renderHook(() => useApiSelectOptions(args({open: false, value: "missing-id"})));
        await waitFor(() => expect(result.current.pendingValue).toBe("missing-id"));
    });

    it("treats a value present in defaultOptions as already resolved", async () => {
        post.mockResolvedValue(page(["a"], 1));
        const {result} = renderHook(() =>
            useApiSelectOptions(args({open: false, value: "known", defaultOptions: [{value: "known", label: "Known"}]})),
        );
        await act(async () => {await Promise.resolve();});
        expect(result.current.pendingValue).toBeUndefined();
    });

    it("puts a newly created option at the top of the list", async () => {
        post.mockResolvedValue(page(["a", "b"], 2));
        const {result} = renderHook(() => useApiSelectOptions(args()));
        await waitFor(() => expect(result.current.options).toHaveLength(2));
        act(() => result.current.prependCreatedOption({value: "new", label: "New"}));
        expect(result.current.options.map((o) => o.value)).toEqual(["new", "a", "b"]);
    });
});
