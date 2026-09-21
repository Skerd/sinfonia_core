import {act, renderHook, waitFor} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import type {HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {
    buildBody,
    buildHeaders,
    buildUrl,
    shouldToastError,
} from "@coreModule/helpers/general/httpRequestBuilders.ts";

const {apiClientMock, toastMock} = vi.hoisted(() => ({
    apiClientMock: vi.fn(),
    toastMock: {
        loading: vi.fn(() => "toast-id"),
        success: vi.fn(),
        error: vi.fn(),
        dismiss: vi.fn(),
    },
}));

vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: apiClientMock}));
vi.mock("sonner", () => ({toast: toastMock}));

import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";

const request = (overrides: Partial<HttpRequest> = {}): HttpRequest => ({method: "post", url: "/api/x", data: {}, ...overrides});

/** Resolves `axios.start|success|error` and their titles, so every toast stage is enabled. */
const resolveLanguageKey = (key: string) => (key.endsWith(".title") ? `T(${key})` : "yes");

const abortableRequest = () =>
    apiClientMock.mockImplementationOnce(({signal}: { signal: AbortSignal }) =>
        new Promise((_, reject) => {
            signal.addEventListener("abort", () => reject(Object.assign(new Error("canceled"), {code: "ERR_CANCELED"})));
        }),
    );

describe("httpRequestBuilders", () => {
    it("encodes path segments and keeps 0", () => {
        const config = request({addToPath: [{whatToGet: ["id"]}, {whatToGet: ["missing"]}, {whatToGet: ["slug"]}]});
        expect(buildUrl(config, {id: 0, slug: "a/b?c"}, "/api/x")).toBe("/api/x/0/a%2Fb%3Fc");
    });

    it("applies the same precedence to JSON and FormData bodies", () => {
        const config = request({
            data: {a: "static", b: "static", c: "static"},
            addToBody: [{whatToGet: "params.c", whereToPut: "c"}, {whatToGet: "params.nope", whereToPut: "b"}],
        });
        const props = {params: {c: "props"}};

        expect(buildBody(config, props, {b: "request", c: "request"})).toEqual({a: "static", b: "request", c: "props"});

        const form = new FormData();
        form.append("b", "request");
        form.append("c", "request");
        const multipart = buildBody(config, props, form, {a: "json"}) as FormData;
        expect(Object.fromEntries(multipart.entries())).toEqual({a: "json", b: "request", c: "props"});
        expect(multipart.getAll("c")).toEqual(["props"]);
    });

    it("strips any-case Content-Type for multipart", () => {
        const config = request({extraHeader: {"content-TYPE": "application/json", "X-A": "1"}});
        expect(buildHeaders(config, {}, true)).toEqual({"X-A": "1"});
    });

    it("suppresses error toasts for hidden, session and bare auth errors", () => {
        expect(shouldToastError({status: 400, message: "bad"}, false)).toBe(true);
        expect(shouldToastError({status: 400, message: "bad"}, true)).toBe(false);
        expect(shouldToastError({status: 401, message: "x"}, false)).toBe(false);
        expect(shouldToastError({status: 403}, false)).toBe(false);
        expect(shouldToastError({status: 403, error_code: "forbidden"}, false)).toBe(true);
    });
});

describe("useHttpRequest", () => {
    beforeEach(() => {
        apiClientMock.mockReset();
        Object.values(toastMock).forEach((fn) => fn.mockClear());
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it("dismisses the toast of a request superseded by a newer one", async () => {
        abortableRequest();
        apiClientMock.mockResolvedValueOnce({data: {ok: true}});
        const httpRequest = request();
        const props = {resolveLanguageKey};

        const {result, rerender} = renderHook(({count}) => useHttpRequest(httpRequest, {}, count, true, {}, props), {
            initialProps: {count: 1},
        });
        rerender({count: 2});

        await waitFor(() => expect(result.current.data).toEqual({ok: true}));
        expect(toastMock.loading).toHaveBeenCalledTimes(2);
        expect(toastMock.dismiss).toHaveBeenCalledTimes(1);
        expect(toastMock.success).toHaveBeenCalledTimes(1);
        expect(result.current.loading).toBe(false);
    });

    it("settles the loading toast when hideIfError is set", async () => {
        apiClientMock.mockRejectedValueOnce({response: {status: 400, data: {message: "bad"}}});
        const httpRequest = request();
        const props = {resolveLanguageKey, hideIfError: true};

        const {result} = renderHook(() => useHttpRequest(httpRequest, {}, 1, true, {}, props));

        await waitFor(() => expect(result.current.error?.status).toBe(400));
        expect(toastMock.error).not.toHaveBeenCalled();
        expect(toastMock.dismiss).toHaveBeenCalledWith("toast-id");
    });

    it("does not replay a rate-limited request, but sends one triggered during the cooldown", async () => {
        vi.useFakeTimers({shouldAdvanceTime: true});
        apiClientMock.mockRejectedValueOnce({
            response: {status: 429, data: {error_code: "rate_limit_exceeded", availableIn: 2}},
        });
        apiClientMock.mockResolvedValue({data: "later"});
        const httpRequest = request();

        const {result, rerender} = renderHook(({count}) => useHttpRequest(httpRequest, {}, count), {
            initialProps: {count: 1},
        });
        await waitFor(() => expect(result.current.error?.error_code).toBe("rate_limit_exceeded"));

        await act(async () => { vi.advanceTimersByTime(2500); });
        expect(apiClientMock).toHaveBeenCalledTimes(1);

        // Second failure, then a trigger inside the cooldown is deferred until it ends.
        apiClientMock.mockRejectedValueOnce({
            response: {status: 429, data: {error_code: "rate_limit_exceeded", availableIn: 2}},
        });
        rerender({count: 2});
        await waitFor(() => expect(apiClientMock).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(result.current.loading).toBe(false));
        rerender({count: 3});
        expect(apiClientMock).toHaveBeenCalledTimes(2);

        await act(async () => { vi.advanceTimersByTime(2500); });
        await waitFor(() => expect(result.current.data).toBe("later"));
        expect(apiClientMock).toHaveBeenCalledTimes(3);
    });
});
