import {act, renderHook, waitFor} from "@testing-library/react";
import type {ReactNode} from "react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {Provider} from "react-redux";
import {combineReducers, configureStore} from "@reduxjs/toolkit";

const {apiClientMock, toastMock} = vi.hoisted(() => ({
    apiClientMock: vi.fn(),
    toastMock: Object.assign(vi.fn(), {
        error: vi.fn(),
        success: vi.fn(),
        loading: vi.fn(),
        dismiss: vi.fn(),
    }),
}));

vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: apiClientMock}));
vi.mock("sonner", () => ({toast: toastMock}));

import authenticationReducer, {signOut} from "@coreModule/helpers/redux/slices/authSlice.ts";
import languageReducer, {changeLanguage} from "@coreModule/helpers/redux/slices/languageSlice.ts";
import useSelectedLanguage from "@coreModule/helpers/hooks/useSelectedLanguage.ts";
import {ReloginProvider} from "@coreModule/helpers/context/reloginContext.tsx";
import {useRelogin} from "@coreModule/helpers/hooks/useRelogin.ts";
import enUS from "@coreModule/assets/languages/en-US/helpers/context/reloginContext.json";
import deCH from "@coreModule/assets/languages/de-CH/helpers/context/reloginContext.json";

const LANGUAGE_PATH = "src/modules/core/helpers/context/reloginContext.tsx";

const CURRENT_COMPANY = "company-current";
const OTHER_COMPANY = "company-other";
const TOKENS = {token: "new-token", refreshToken: "new-refresh"};

/** Access token whose payload company matches what the API signs. */
function accessToken(companyId: string) {
    const segment = btoa(JSON.stringify({company: {_id: companyId}})).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return `header.${segment}.sig`;
}

type Deferred = {resolve: (value: unknown) => void; reject: (error: unknown) => void};

function httpError(status: number, body: Record<string, unknown>) {
    return Object.assign(new Error(`Request failed with status code ${status}`), {
        isAxiosError: true,
        response: {status, data: body},
    });
}

/** Renders the provider for a user signed in to {@link CURRENT_COMPANY}, once its dictionary has loaded. */
async function setup(languageCode = "en-US") {
    const signedOut = authenticationReducer(undefined, signOut());
    const authentication = {
        ...signedOut,
        token: "old-token",
        refreshToken: "old-refresh",
        user: {...signedOut.user, company: {...signedOut.user.company, _id: CURRENT_COMPANY}},
    } as typeof signedOut;
    const store = configureStore({
        reducer: combineReducers({authentication: authenticationReducer, language: languageReducer}),
        preloadedState: {authentication},
    });
    store.dispatch(changeLanguage(languageCode));

    const wrapper = ({children}: {children: ReactNode}) => (
        <Provider store={store}>
            <ReloginProvider>{children}</ReloginProvider>
        </Provider>
    );
    const rendered = renderHook(() => ({relogin: useRelogin(), language: useSelectedLanguage(LANGUAGE_PATH)}), {wrapper});
    await waitFor(() => expect(rendered.result.current.language.loading).toBe(false));

    const hook = {
        get current() {
            return rendered.result.current.relogin;
        },
        rerender: rendered.rerender,
        unmount: rendered.unmount,
    };
    const trigger = (companyId: string) => act(() => hook.current.triggerRelogin(companyId));
    return {store, hook, trigger, auth: () => store.getState().authentication};
}

/** Wait until every started request has settled and React has flushed. */
async function settle(hook: Awaited<ReturnType<typeof setup>>["hook"]) {
    await waitFor(() => expect(hook.current.switching).toBe(false));
}

afterEach(() => {
    vi.restoreAllMocks();
});

beforeEach(() => {
    localStorage.clear();
    apiClientMock.mockReset();
    for (const fn of [toastMock, toastMock.error, toastMock.success, toastMock.loading, toastMock.dismiss]) fn.mockReset();
    // `handleError` logs every failure; keep the test output quiet.
    vi.spyOn(console, "error").mockImplementation(() => {});
    apiClientMock.mockResolvedValue({data: TOKENS});
});

describe("useRelogin", () => {
    it("throws outside a provider", () => {
        expect(() => renderHook(() => useRelogin())).toThrow("useRelogin must be used within a ReloginProvider");
    });

    it("keeps a stable value while idle", async () => {
        const {hook} = await setup();
        const first = hook.current;
        hook.rerender();
        expect(hook.current).toBe(first);
        expect(first.switching).toBe(false);
    });
});

describe("ReloginProvider", () => {
    it("does not request anything on mount", async () => {
        await setup();
        expect(apiClientMock).not.toHaveBeenCalled();
    });

    it("posts the company id and stores the company from the new access token", async () => {
        const token = accessToken(OTHER_COMPANY);
        apiClientMock.mockResolvedValue({data: {token, refreshToken: "new-refresh"}});
        const {hook, trigger, auth} = await setup();

        trigger(OTHER_COMPANY);
        expect(hook.current.switching).toBe(true);
        await settle(hook);

        expect(apiClientMock).toHaveBeenCalledTimes(1);
        expect(apiClientMock).toHaveBeenCalledWith(expect.objectContaining({
            method: "post",
            url: "/api/user/login/differentCompany",
            data: {companyId: OTHER_COMPANY},
            signal: expect.any(AbortSignal),
        }));
        expect(auth()).toMatchObject({token, refreshToken: "new-refresh"});
        expect(auth().user.company?._id).toBe(OTHER_COMPANY);
        expect(toastMock.error).not.toHaveBeenCalled();
    });

    it.each([
        ["an empty id", ""],
        ["the current company", CURRENT_COMPANY],
    ])("ignores %s", async (_label, companyId) => {
        const {hook, trigger} = await setup();
        trigger(companyId);
        expect(hook.current.switching).toBe(false);
        expect(apiClientMock).not.toHaveBeenCalled();
    });

    it("sends each switch and ignores a repeat of the company just adopted", async () => {
        apiClientMock.mockImplementation((config: {data?: {companyId?: string}}) => Promise.resolve({
            data: {token: accessToken(config.data?.companyId ?? ""), refreshToken: "new-refresh"},
        }));
        const {hook, trigger} = await setup();

        trigger(OTHER_COMPANY);
        await settle(hook);
        trigger("company-third");
        await settle(hook);
        trigger("company-third");
        await settle(hook);

        expect(apiClientMock.mock.calls.map(([config]) => config.data)).toEqual([
            {companyId: OTHER_COMPANY},
            {companyId: "company-third"},
        ]);
    });

    it("cancels an in-flight switch when another starts, applying only the latest", async () => {
        const pending: Deferred[] = [];
        apiClientMock.mockImplementation(() => new Promise((resolve, reject) => pending.push({resolve, reject})));
        const {hook, trigger, auth} = await setup();

        trigger(OTHER_COMPANY);
        trigger("company-third");
        expect(apiClientMock).toHaveBeenCalledTimes(2);
        expect(apiClientMock.mock.calls[0][0].signal.aborted).toBe(true);

        await act(async () => {
            pending[1].resolve({data: {token: "third-token", refreshToken: "third-refresh"}});
            pending[0].resolve({data: TOKENS});
        });
        await settle(hook);

        expect(auth().token).toBe("third-token");
    });

    describe("failures keep the user signed in", () => {
        it("prefers the server's (already translated) message", async () => {
            apiClientMock.mockRejectedValueOnce(httpError(400, {
                error_code: "company_inactive",
                message: "This company is inactive",
            }));
            const {hook, trigger, auth} = await setup();

            trigger(OTHER_COMPANY);
            await settle(hook);

            expect(toastMock.error).toHaveBeenCalledWith("This company is inactive");
            expect(auth()).toMatchObject({token: "old-token", refreshToken: "old-refresh"});
            expect(auth().user.company?._id).toBe(CURRENT_COMPANY);
        });

        it("toasts the translated fallback for a network error", async () => {
            apiClientMock.mockRejectedValueOnce(Object.assign(new Error("Network Error"), {isAxiosError: true, code: "ERR_NETWORK"}));
            const {hook, trigger, auth} = await setup();

            trigger(OTHER_COMPANY);
            await settle(hook);

            expect(toastMock.error).toHaveBeenCalledWith(enUS.switchFailed);
            expect(auth().token).toBe("old-token");
        });

        it("does not toast an expired session (apiClient handles it)", async () => {
            apiClientMock.mockRejectedValueOnce(httpError(403, {error_code: "token_verification_failed", message: "Expired"}));
            const {hook, trigger, auth} = await setup();

            trigger(OTHER_COMPANY);
            await settle(hook);

            expect(toastMock.error).not.toHaveBeenCalled();
            expect(auth().token).toBe("old-token");
        });

        it("reports a response without tokens", async () => {
            apiClientMock.mockResolvedValueOnce({data: {token: "only-access"}});
            const {hook, trigger, auth} = await setup();

            trigger(OTHER_COMPANY);
            await settle(hook);

            expect(toastMock.error).toHaveBeenCalledWith(enUS.switchFailed);
            expect(auth()).toMatchObject({token: "old-token", refreshToken: "old-refresh"});
        });

        it("uses the selected language", async () => {
            apiClientMock.mockRejectedValueOnce(httpError(500, {}));
            const {hook, trigger} = await setup("de-CH");

            trigger(OTHER_COMPANY);
            await settle(hook);

            expect(toastMock.error).toHaveBeenCalledWith(deCH.switchFailed);
            expect(deCH.switchFailed).not.toBe(enUS.switchFailed);
        });

        it("allows retrying after a failure", async () => {
            apiClientMock.mockRejectedValueOnce(httpError(429, {error_code: "rate_limit_exceeded", message: "Slow down"}));
            const {hook, trigger, auth} = await setup();

            trigger(OTHER_COMPANY);
            await settle(hook);
            trigger(OTHER_COMPANY);
            await settle(hook);

            expect(apiClientMock).toHaveBeenCalledTimes(2);
            expect(auth().token).toBe(TOKENS.token);
        });
    });

    it("drops a response that arrives after unmount", async () => {
        let deferred!: Deferred;
        apiClientMock.mockImplementationOnce(() => new Promise((resolve, reject) => (deferred = {resolve, reject})));
        const {hook, trigger, auth} = await setup();

        trigger(OTHER_COMPANY);
        hook.unmount();
        await act(async () => deferred.resolve({data: TOKENS}));

        expect(auth().token).toBe("old-token");
    });
});
