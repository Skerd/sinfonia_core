import {describe, expect, it} from "vitest";
import type {ReactNode} from "react";
import {renderHook} from "@testing-library/react";
import {Provider} from "react-redux";
import {configureStore} from "@reduxjs/toolkit";
import {useActionAccess} from "../useActionAccess.ts";

function wrapperWith(permissions: string[]) {
    const store = configureStore({reducer: {authentication: () => ({user: {permissions}})}});
    return ({children}: {children: ReactNode}) => <Provider store={store}>{children}</Provider>;
}

describe("useActionAccess", () => {
    it("reads maestro's action tag for the scope", () => {
        const wrapper = wrapperWith(["users[action:others:unlockActivation]", "channels[action:self:answerWebsiteChats]"]);
        expect(renderHook(() => useActionAccess("users", "unlockActivation", "others"), {wrapper}).result.current).toBe(true);
        expect(renderHook(() => useActionAccess("channels", "answerWebsiteChats"), {wrapper}).result.current).toBe(true);
    });

    it("does not let one scope stand in for the other", () => {
        const wrapper = wrapperWith(["users[action:self:unlockActivation]", "users[write:others:requests]"]);
        expect(renderHook(() => useActionAccess("users", "unlockActivation", "others"), {wrapper}).result.current).toBe(false);
    });
});
