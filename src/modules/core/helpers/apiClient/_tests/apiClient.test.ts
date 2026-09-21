import {beforeEach, describe, expect, it, vi} from "vitest";
import type {InternalAxiosRequestConfig} from "axios";

const {dispatchMock} = vi.hoisted(() => ({dispatchMock: vi.fn()}));

vi.mock("@coreModule/helpers/context/localStorage/authenticationStorage.ts", () => ({
    getToken: () => "secret-token",
    getDeviceId: () => "device-1",
}));
vi.mock("@coreModule/helpers/redux/store/generalStore.ts", () => ({
    store: {
        getState: () => ({language: {languageCode: "en-US"}, authentication: {user: {company: {_id: "c1"}}}}),
        dispatch: dispatchMock,
    },
}));
vi.mock("@coreModule/helpers/redux/slices/authSlice.ts", () => ({markSessionExpired: () => ({type: "expired"})}));

import apiClient, {isSameOrigin} from "@coreModule/helpers/apiClient/apiClient.ts";

/** Runs a request through the interceptors and returns the headers it would send. */
async function sentHeaders(url: string): Promise<Record<string, unknown>> {
    let captured: InternalAxiosRequestConfig | undefined;
    await apiClient.get(url, {
        adapter: async (config) => {
            captured = config;
            return {data: null, status: 200, statusText: "OK", headers: {}, config};
        },
    });
    return captured!.headers.toJSON() as Record<string, unknown>;
}

async function failWith401(url: string) {
    await apiClient
        .get(url, {
            adapter: async (config) => Promise.reject(Object.assign(new Error("401"), {
                isAxiosError: true,
                config,
                response: {status: 401, data: {}, headers: {}, config, statusText: ""},
            })),
        })
        .catch(() => undefined);
}

beforeEach(() => dispatchMock.mockReset());

describe("isSameOrigin", () => {
    it.each([
        ["/api/x", true],
        ["api/x", true],
        [`${window.location.origin}/api/x`, true],
        ["https://evil.example.com/api/x", false],
        ["//evil.example.com/x", false],
        ["http://[bad", false],
    ])("%s → %s", (url, expected) => {
        expect(isSameOrigin(url)).toBe(expected);
    });
});

describe("apiClient", () => {
    it("adds auth and tenant headers for this origin", async () => {
        expect(await sentHeaders("/api/x")).toMatchObject({
            "x-auth-token": "secret-token",
            "x-device-id": "device-1",
            language: "en-US",
            company: "c1",
        });
    });

    it("never sends them to another origin", async () => {
        const headers = await sentHeaders("https://cdn.example.com/booklet.pdf");
        expect(headers).not.toHaveProperty("x-auth-token");
        expect(headers).not.toHaveProperty("x-device-id");
        expect(headers).not.toHaveProperty("company");
    });

    it("marks the session expired only for this origin's 401", async () => {
        await failWith401("https://cdn.example.com/x");
        expect(dispatchMock).not.toHaveBeenCalled();

        await failWith401("/api/x");
        expect(dispatchMock).toHaveBeenCalledExactlyOnceWith({type: "expired"});
    });
});
