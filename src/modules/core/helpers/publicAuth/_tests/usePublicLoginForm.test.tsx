import {act, renderHook} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import {Provider} from "react-redux";
import {combineReducers, configureStore} from "@reduxjs/toolkit";
import {createRef, type ReactNode} from "react";
import authenticationReducer from "@coreModule/helpers/redux/slices/authSlice.ts";
import type {WithAxiosLifecycleRef} from "@coreModule/helpers/hocs/withAxios.tsx";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {usePublicLoginForm, type PublicLoginResponse} from "../usePublicLoginForm.ts";

const resolveLanguageKey = ((key: string) => key) as ResolveLanguageKey;
const submitEvent = {preventDefault: () => undefined} as React.FormEvent;

function setup(busy = false) {
    const store = configureStore({reducer: combineReducers({authentication: authenticationReducer})});
    const innerRef = createRef<WithAxiosLifecycleRef<PublicLoginResponse>>();
    const onFilterChange = vi.fn();
    const onLoggedIn = vi.fn();
    const wrapper = ({children}: {children: ReactNode}) => <Provider store={store}>{children}</Provider>;
    const {result} = renderHook(
        () => usePublicLoginForm({resolveLanguageKey, languageCode: "en-US", onFilterChange, innerRef, busy, onLoggedIn}),
        {wrapper},
    );
    return {store, innerRef, onFilterChange, onLoggedIn, result};
}

describe("usePublicLoginForm", () => {
    it("shows field errors and sends nothing when the form is invalid", () => {
        const {result, onFilterChange} = setup();
        act(() => result.current.handleSubmit(submitEvent));
        expect(onFilterChange).not.toHaveBeenCalled();
        expect(result.current.fieldErrors.username).toBeTruthy();
    });

    it("posts trimmed credentials", () => {
        const {result, onFilterChange} = setup();
        act(() => {
            result.current.setUsername("  buyer@example.com ");
            result.current.setPassword("secret");
        });
        act(() => result.current.handleSubmit(submitEvent));
        expect(onFilterChange).toHaveBeenCalledWith({username: "buyer@example.com", password: "secret"});
    });

    it("does nothing while busy", () => {
        const {result, onFilterChange} = setup(true);
        act(() => {
            result.current.setUsername("buyer@example.com");
            result.current.setPassword("secret");
        });
        act(() => result.current.handleSubmit(submitEvent));
        expect(onFilterChange).not.toHaveBeenCalled();
    });

    it("asks for the MFA code, then stores the session and hands over navigation", () => {
        const {result, innerRef, store, onLoggedIn} = setup();
        act(() => innerRef.current?.success?.({mfaActivated: true} as PublicLoginResponse));
        expect(result.current.needsMfa).toBe(true);

        act(() => innerRef.current?.success?.({token: "t", refreshToken: "r"} as PublicLoginResponse));
        expect(store.getState().authentication.token).toBe("t");
        expect(onLoggedIn).toHaveBeenCalledTimes(1);
    });

    it("drops back to email and password when the request fails", () => {
        const {result, innerRef} = setup();
        act(() => innerRef.current?.success?.({mfaActivated: true} as PublicLoginResponse));
        act(() => result.current.setMfaCode("123456"));
        act(() => innerRef.current?.error?.(new Error("bad code")));
        expect(result.current.needsMfa).toBe(false);
        expect(result.current.mfaCode).toBe("");
    });
});
