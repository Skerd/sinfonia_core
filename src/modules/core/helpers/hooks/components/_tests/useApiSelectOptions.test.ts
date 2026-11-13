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
    // TD-B173: role selects showed the stored English name of a default role.
    it("shows a default role's label in the reader's language and keeps other labels as stored", async () => {
        post.mockResolvedValue({data: {data: [
            {value: "r1", label: "Web Client", slug: "acme:default:webclient"},
            {value: "r2", label: "Front desk", slug: "acme:front desk"},
            {value: "r3", label: "Renamed", slug: "acme:default:webclient"},
        ], total: 3}});
        const {result} = renderHook(() => useApiSelectOptions(args({pageSize: 3, languageCode: "de-CH"})));
        await waitFor(() => expect(result.current.options).toHaveLength(3));
        // A default role an administrator renamed keeps its name.
        expect(result.current.options.map((o) => o.label)).toEqual(["Webkunde", "Front desk", "Renamed"]);
    });

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

    /**
     * Regression: with a selected value, hydrate used to restore the empty-search cache after
     * typing (marking page 1 fetched). The debounced search then no-op'd and the list looked
     * unfiltered.
     */
    it("still searches after a value is already selected", async () => {
        post.mockImplementation((_url, body) => {
            const name = (body as {name?: string})?.name ?? "";
            return Promise.resolve(name === "ma" ? page(["match"], 1) : page(["alpha", "beta"], 2));
        });

        const {result, rerender} = renderHook((p: UseApiSelectOptionsArgs) => useApiSelectOptions(p), {
            initialProps: args({value: "alpha"}),
        });
        await waitFor(() => expect(result.current.options.map((o) => o.value)).toEqual(["alpha", "beta"]));

        // Fresh defaultOptions array each render mimics parents that pass `defaultOptions={[]}` /
        // inline arrays — that used to re-fire hydrate and stomp the in-flight search.
        rerender(args({value: "alpha", searchText: "ma", defaultOptions: []}));
        await waitFor(() => expect(result.current.options.map((o) => o.value)).toEqual(["match"]));

        const searchCall = post.mock.calls.find((call) => (call[1] as {name?: string})?.name === "ma");
        expect(searchCall).toBeTruthy();
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

    // TD-F70: a disabled select (a locked currency) showed its placeholder instead of the stored record.
    it("labels a disabled select's value by id without loading its list", async () => {
        post.mockResolvedValue({data: {data: [{_id: "eur", name: "Euro"}], total: 1}});
        const {result} = renderHook(() => useApiSelectOptions(args({disabled: true, open: false, value: "eur", postBody: {kind: "x"}})));
        await waitFor(() => expect(result.current.resolvedOptions).toEqual([{value: "eur", label: "Euro", photo: undefined}]));
        expect(post).toHaveBeenCalledTimes(1);
        expect(post.mock.calls[0][1]).toEqual({kind: "x", name: "", page: 1, limit: 2, ids: ["eur"]});
        expect(result.current.options).toEqual([]);
        expect(result.current.pendingValue).toBeUndefined();
    });

    // TD-F71: a preset value beyond the first page showed its raw id.
    it("labels a closed select's value that is not on the first page", async () => {
        post.mockImplementation((_url, body) => {
            const ids = (body as {ids?: string[]}).ids;
            return Promise.resolve(ids ? {data: {data: [{_id: "z", name: "Zulu"}], total: 1}} : page(["a", "b"], 30));
        });
        const {result} = renderHook(() => useApiSelectOptions(args({open: false, value: "z"})));
        await waitFor(() => expect(result.current.resolvedOptions.map((o) => o.label)).toEqual(["Zulu"]));
        expect(result.current.pendingValue).toBeUndefined();
        expect(post.mock.calls.every((call) => (call[1] as {ids?: string[]}).ids?.[0] === "z")).toBe(true);
    });

    it("asks for a label it could not find only once", async () => {
        post.mockResolvedValue(page(["a"], 1));
        const {result, rerender} = renderHook((p: UseApiSelectOptionsArgs) => useApiSelectOptions(p), {
            initialProps: args({open: false, value: "gone"}),
        });
        await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
        rerender(args({open: false, value: "gone", defaultOptions: []}));
        await act(async () => {await Promise.resolve();});
        expect(post).toHaveBeenCalledTimes(1);
        expect(result.current.pendingValue).toBe("gone");
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
