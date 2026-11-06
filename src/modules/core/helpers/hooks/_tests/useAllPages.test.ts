import {beforeEach, describe, expect, it, vi} from "vitest";
import {renderHook, waitFor} from "@testing-library/react";

const {apiClientMock} = vi.hoisted(() => ({apiClientMock: vi.fn()}));
vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: apiClientMock}));
vi.mock("sonner", () => ({toast: {loading: vi.fn(), success: vi.fn(), error: vi.fn(), dismiss: vi.fn()}}));

const {default: useAllPages} = await import("../useAllPages.ts");

const REQUEST = {method: "post" as const, url: "/api/items", data: {}};
type Item = {_id: string};
const items = (from: number, count: number): Item[] => Array.from({length: count}, (_, i) => ({_id: String(from + i)}));

/** Answers `{offset, limit}` from a list of `total` rows. */
function serve(total: number) {
    apiClientMock.mockImplementation(({data}: {data: {offset: number; limit: number}}) => {
        return Promise.resolve({data: {data: items(data.offset, Math.max(0, Math.min(data.limit, total - data.offset))), total}});
    });
}

beforeEach(() => {
    apiClientMock.mockReset();
});

describe("useAllPages", () => {
    it("requests page after page and returns every row once the last one arrived", async () => {
        serve(5);
        const {result} = renderHook(() => useAllPages<Item>(REQUEST, {filter: {a: 1}}, 1, {pageSize: 2}));
        expect(result.current.loading).toBe(true);
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.rows.map((row) => row._id)).toEqual(["0", "1", "2", "3", "4"]);
        expect(result.current.total).toBe(5);
        expect(result.current.truncated).toBe(false);
        expect(apiClientMock.mock.calls.map(([config]) => config.data)).toEqual([
            {filter: {a: 1}, offset: 0, limit: 2},
            {filter: {a: 1}, offset: 2, limit: 2},
            {filter: {a: 1}, offset: 4, limit: 2},
        ]);
    });

    it("stops at maxRows and says the list was cut", async () => {
        serve(10);
        const {result} = renderHook(() => useAllPages<Item>(REQUEST, {}, 1, {pageSize: 2, maxRows: 4}));
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.rows).toHaveLength(4);
        expect(result.current.truncated).toBe(true);
    });

    it("waits for a fetchCount above zero and reloads from the first page when it changes", async () => {
        serve(3);
        const {result, rerender} = renderHook(({count}) => useAllPages<Item>(REQUEST, {}, count, {pageSize: 2}), {initialProps: {count: 0}});
        expect(result.current.loading).toBe(false);
        expect(apiClientMock).not.toHaveBeenCalled();
        rerender({count: 1});
        await waitFor(() => expect(result.current.rows).toHaveLength(3));
        rerender({count: 2});
        expect(result.current.loading).toBe(true);
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.rows).toHaveLength(3);
        expect(apiClientMock).toHaveBeenCalledTimes(4);
    });

    it("ends with no rows and the error when a page fails", async () => {
        apiClientMock
            .mockResolvedValueOnce({data: {data: items(0, 2), total: 4}})
            .mockRejectedValueOnce({response: {status: 500, data: {message: "down"}}});
        const {result} = renderHook(() => useAllPages<Item>(REQUEST, {}, 1, {pageSize: 2}));
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.rows).toEqual([]);
        expect(result.current.error).toMatchObject({message: "down", status: 500});
    });
});
