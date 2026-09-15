import {act, renderHook, waitFor} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";

const {apiClientMock} = vi.hoisted(() => ({apiClientMock: vi.fn()}));

vi.mock("@baseModule/helpers/apiClient/apiClient.ts", () => ({default: apiClientMock}));
vi.mock("sonner", () => ({toast: {loading: vi.fn(), success: vi.fn(), error: vi.fn(), dismiss: vi.fn()}}));

import {useEntityCardFetch, type UseEntityCardFetchOptions} from "@baseModule/helpers/hooks/useEntityCardFetch.ts";

type Row = {_id: string; name: string};
type Props = UseEntityCardFetchOptions<Row>;

/** A request whose outcome the test decides later. */
function deferred() {
    let resolve!: (value: unknown) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    apiClientMock.mockImplementationOnce(() => promise);
    return {
        respond: async (data: unknown) => act(async () => { resolve({data}); }),
        fail: async (status: number, message: string) => act(async () => { reject({response: {status, data: {message}}}); }),
    };
}

function setup(initial: Partial<Props> = {}) {
    const onSuccess = vi.fn();
    let props: Props = {fetchId: "a", singleUrl: "/api/cities/single", onSuccess, ...initial};
    const view = renderHook((current: Props) => useEntityCardFetch<Row>(current), {initialProps: props});
    const update = (next: Partial<Props>) => {
        props = {...props, ...next};
        view.rerender(props);
    };
    return {...view, onSuccess, update};
}

const requestedIds = () => apiClientMock.mock.calls.map(([config]) => (config as {data: {_id?: string}}).data._id);

describe("useEntityCardFetch", () => {
    beforeEach(() => {
        apiClientMock.mockReset();
    });

    it.each([
        ["no fetchId", {fetchId: undefined}],
        ["no singleUrl", {singleUrl: undefined}],
    ])("does not request with %s, and retry does nothing", (_label, overrides) => {
        const {result} = setup(overrides);

        expect(result.current).toMatchObject({loading: false, error: null});
        act(() => result.current.retry());
        expect(apiClientMock).not.toHaveBeenCalled();
    });

    it("posts {_id} to singleUrl once and hands the row to onSuccess", async () => {
        const request = deferred();
        const {result, onSuccess, update} = setup();

        expect(result.current.loading).toBe(true);
        expect(apiClientMock).toHaveBeenCalledTimes(1);
        expect(apiClientMock.mock.calls[0][0]).toMatchObject({method: "POST", url: "/api/cities/single", data: {_id: "a"}});

        await request.respond({_id: "a", name: "Basel"});

        expect(onSuccess).toHaveBeenCalledWith({_id: "a", name: "Basel"});
        expect(result.current).toMatchObject({loading: false, error: null});

        update({});
        expect(apiClientMock).toHaveBeenCalledTimes(1);
    });

    it("does not call onSuccess for an empty response", async () => {
        const request = deferred();
        const {result, onSuccess} = setup();

        await request.respond(null);

        expect(onSuccess).not.toHaveBeenCalled();
        expect(result.current.loading).toBe(false);
    });

    it("exposes the error and loads again on retry", async () => {
        const first = deferred();
        const {result, onSuccess} = setup();
        await first.fail(404, "Not found");

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toMatchObject({status: 404, message: "Not found"});

        const second = deferred();
        act(() => result.current.retry());
        await waitFor(() => expect(apiClientMock).toHaveBeenCalledTimes(2));
        await second.respond({_id: "a", name: "Basel"});

        expect(result.current).toMatchObject({loading: false, error: null});
        expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it("loads the new id when it changes, without showing the previous id's error", async () => {
        const first = deferred();
        const {result, onSuccess, update} = setup();
        await first.fail(500, "boom");
        expect(result.current.error).not.toBeNull();

        const second = deferred();
        update({fetchId: "b"});

        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(true);
        expect(requestedIds()).toEqual(["a", "b"]);

        await second.respond({_id: "b", name: "Bern"});
        expect(onSuccess).toHaveBeenCalledWith({_id: "b", name: "Bern"});
        expect(result.current).toMatchObject({loading: false, error: null});
    });

    it("ignores a response that arrives after fetching was turned off", async () => {
        const request = deferred();
        const {result, onSuccess, update} = setup();

        update({fetchId: undefined});
        expect(result.current).toMatchObject({loading: false, error: null});

        await request.respond({_id: "a", name: "Basel"});
        expect(onSuccess).not.toHaveBeenCalled();
    });

    it("loads again when fetching turns back on for the same id", async () => {
        const first = deferred();
        const {update} = setup();
        await first.respond({_id: "a", name: "Basel"});

        update({fetchId: undefined});
        const second = deferred();
        update({fetchId: "a"});

        await waitFor(() => expect(requestedIds()).toEqual(["a", "a"]));
        await second.respond({_id: "a", name: "Basel"});
    });

    it("uses the latest onSuccess without refetching, and keeps retry stable", async () => {
        const request = deferred();
        const {result, update, onSuccess} = setup();
        const retry = result.current.retry;
        const latest = vi.fn();

        update({onSuccess: latest});
        expect(result.current.retry).toBe(retry);
        expect(apiClientMock).toHaveBeenCalledTimes(1);

        await request.respond({_id: "a", name: "Basel"});
        expect(onSuccess).not.toHaveBeenCalled();
        expect(latest).toHaveBeenCalledWith({_id: "a", name: "Basel"});
    });
});
