import {beforeEach, describe, expect, it, vi} from "vitest";

const {requestMock, toastError} = vi.hoisted(() => ({requestMock: vi.fn(), toastError: vi.fn()}));
vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: {request: requestMock}}));
vi.mock("sonner", () => ({toast: {error: toastError}}));

const {requestFromApi} = await import("../requestFromApi.ts");

beforeEach(() => {
    requestMock.mockReset();
    toastError.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("requestFromApi", () => {
    it("returns the response body and passes the request through", async () => {
        requestMock.mockResolvedValueOnce({data: {ok: true}});
        const controller = new AbortController();
        await expect(requestFromApi({method: "post", url: "/api/x", data: {_id: "1"}, headers: {h: "v"}, signal: controller.signal}))
            .resolves.toEqual({ok: true});
        expect(requestMock.mock.calls[0][0]).toMatchObject({method: "post", url: "/api/x", data: {_id: "1"}, headers: {h: "v"}, signal: controller.signal});
    });

    it("toasts the translated server message and rethrows", async () => {
        const failure = {response: {status: 400, data: {message: "Bad input"}}};
        requestMock.mockRejectedValueOnce(failure);
        const t = (key: string) => (key === "axios.error.title" ? "Failed" : key);
        await expect(requestFromApi({method: "patch", url: "/api/x", resolveLanguageKey: t})).rejects.toBe(failure);
        expect(toastError).toHaveBeenCalledWith("Failed: Bad input");
    });

    it("rethrows without a toast when silent, on an expired session, or when aborted", async () => {
        requestMock.mockRejectedValueOnce({response: {status: 500, data: {message: "down"}}});
        await expect(requestFromApi({method: "get", url: "/api/x", silent: true})).rejects.toBeTruthy();
        requestMock.mockRejectedValueOnce({response: {status: 401, data: {}}});
        await expect(requestFromApi({method: "get", url: "/api/x"})).rejects.toBeTruthy();
        const controller = new AbortController();
        controller.abort();
        requestMock.mockRejectedValueOnce(Object.assign(new Error("canceled"), {name: "CanceledError", code: "ERR_CANCELED"}));
        await expect(requestFromApi({method: "get", url: "/api/x", signal: controller.signal})).rejects.toBeTruthy();
        expect(toastError).not.toHaveBeenCalled();
    });
});
