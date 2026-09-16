import {act, renderHook} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import {
    type PaginatedResponse,
    type UseInfiniteScrollOptions,
    useInfiniteScroll,
} from "@baseModule/helpers/hooks/useInfiniteScroll.ts";

type Item = {_id?: string; name: string};

const item = (id: string, name = id): Item => ({_id: id, name});
const page = (items: Item[], total: number): PaginatedResponse<Item> => ({data: items, total});

/** Renders the hook with a spy `onFilterChange`; `update` rerenders with merged props. */
function setup(overrides: Partial<UseInfiniteScrollOptions<Item>> = {}) {
    const onFilterChange = vi.fn();
    let props: UseInfiniteScrollOptions<Item> = {data: null, loading: false, onFilterChange, limit: 2, ...overrides};
    const view = renderHook((current: UseInfiniteScrollOptions<Item>) => useInfiniteScroll(current), {initialProps: props});
    const update = (next: Partial<UseInfiniteScrollOptions<Item>>) => {
        props = {...props, ...next};
        view.rerender(props);
    };
    /** Simulates a request cycle: loading, then a fresh response object. */
    const respond = (response: PaginatedResponse<Item>) => {
        update({loading: true});
        update({loading: false, data: response});
    };
    return {...view, onFilterChange, update, respond};
}

describe("useInfiniteScroll", () => {
    it("requests the first chunk once on mount and replaces items with the response", () => {
        const {result, onFilterChange, respond, update} = setup();
        expect(onFilterChange).toHaveBeenCalledTimes(1);
        expect(onFilterChange).toHaveBeenCalledWith({offset: 0, limit: 2});

        respond(page([item("a"), item("b")], 5));
        update({});

        expect(onFilterChange).toHaveBeenCalledTimes(1);
        expect(result.current.accumulatedItems.map((i) => i._id)).toEqual(["a", "b"]);
        expect(result.current.total).toBe(5);
        expect(result.current.hasMoreData).toBe(true);
        expect(result.current.canLoadMore).toBe(true);
    });

    it("ignores data that was already present before its request was sent", () => {
        const {result} = setup({data: page([item("old")], 1)});
        expect(result.current.accumulatedItems).toEqual([]);
        expect(result.current.canLoadMore).toBe(false);
    });

    it("loads the next chunk once, even when loadMore is called repeatedly", () => {
        const {result, onFilterChange, respond} = setup();
        respond(page([item("a"), item("b")], 5));

        act(() => {
            result.current.loadMore();
            result.current.loadMore();
        });

        expect(result.current.offset).toBe(2);
        expect(onFilterChange).toHaveBeenLastCalledWith({offset: 2, limit: 2});
        expect(onFilterChange).toHaveBeenCalledTimes(2);
        // Pending until the offset-2 response arrives, even though `loading` has not flipped yet.
        expect(result.current.canLoadMore).toBe(false);
        act(() => result.current.loadMore());
        expect(result.current.offset).toBe(2);

        respond(page([item("c"), item("d")], 5));
        expect(result.current.accumulatedItems.map((i) => i._id)).toEqual(["a", "b", "c", "d"]);
        expect(result.current.canLoadMore).toBe(true);
    });

    it("does not load more while loading or when everything is loaded", () => {
        const {result, respond, update} = setup();
        respond(page([item("a"), item("b")], 2));
        expect(result.current.hasMoreData).toBe(false);
        act(() => result.current.loadMore());
        expect(result.current.offset).toBe(0);

        const second = setup();
        second.respond(page([item("a"), item("b")], 5));
        second.update({loading: true});
        expect(second.result.current.canLoadMore).toBe(false);
        act(() => second.result.current.loadMore());
        expect(second.result.current.offset).toBe(0);
        void update;
    });

    it("merges later chunks by id: shifted duplicates update in place instead of repeating", () => {
        const {result, respond} = setup();
        respond(page([item("a"), item("b")], 5));
        act(() => result.current.loadMore());

        respond(page([item("b", "b v2"), item("c")], 5));

        expect(result.current.accumulatedItems).toEqual([item("a"), item("b", "b v2"), item("c")]);
    });

    it("refetches the current offset on forceReload and applies changed content with the same ids", () => {
        const {result, onFilterChange, respond, update} = setup({forceReload: 0});
        respond(page([item("a", "unread"), item("b")], 2));

        update({forceReload: 1});
        expect(onFilterChange).toHaveBeenCalledTimes(2);
        expect(onFilterChange).toHaveBeenLastCalledWith({offset: 0, limit: 2});

        respond(page([item("a", "read"), item("b")], 2));
        expect(result.current.accumulatedItems[0]).toEqual(item("a", "read"));
    });

    it("keeps distinct items that have no _id", () => {
        const {result, respond} = setup();
        const first = {name: "x"};
        const second = {name: "y"};
        respond(page([first, second], 4));
        act(() => result.current.loadMore());
        respond(page([{name: "z"}], 4));

        expect(result.current.accumulatedItems).toHaveLength(3);
    });

    it("handleReset clears items and refetches offset 0, even when already at offset 0", () => {
        const {result, onFilterChange, respond} = setup();
        respond(page([item("a")], 1));

        act(() => result.current.handleReset());

        expect(result.current.accumulatedItems).toEqual([]);
        expect(result.current.total).toBe(0);
        expect(onFilterChange).toHaveBeenCalledTimes(2);
        expect(onFilterChange).toHaveBeenLastCalledWith({offset: 0, limit: 2});

        respond(page([item("fresh")], 1));
        expect(result.current.accumulatedItems.map((i) => i._id)).toEqual(["fresh"]);
    });

    it("does nothing while disabled and requests once enabled", () => {
        const {result, onFilterChange, update} = setup({enabled: false});
        expect(onFilterChange).not.toHaveBeenCalled();

        update({data: page([item("ignored")], 1)});
        expect(result.current.accumulatedItems).toEqual([]);

        update({enabled: true});
        expect(onFilterChange).toHaveBeenCalledWith({offset: 0, limit: 2});
    });

    it("uses the latest onFilterChange without refetching when it changes", () => {
        const {onFilterChange, update, result, respond} = setup();
        const next = vi.fn();
        update({onFilterChange: next});
        expect(onFilterChange).toHaveBeenCalledTimes(1);
        expect(next).not.toHaveBeenCalled();

        respond(page([item("a"), item("b")], 4));
        act(() => result.current.loadMore());
        expect(next).toHaveBeenCalledWith({offset: 2, limit: 2});
    });
});
