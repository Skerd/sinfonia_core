import {beforeEach, describe, expect, it} from "vitest";
import {configureStore} from "@reduxjs/toolkit";
import authenticationReducer, {
    logIn,
    markSessionExpired,
    signOut,
    updateRefreshToken,
    updateTimezone,
    updateToken,
    updateUserData,
    updateUserValue,
} from "@coreModule/helpers/redux/slices/authSlice.ts";
import {authPersistence} from "@coreModule/helpers/redux/listeners/authPersistence.ts";
import {
    getRefreshToken,
    getToken,
    getUser,
    setToken,
    setUser,
} from "@coreModule/helpers/context/localStorage/authenticationStorage.ts";
import type {ValidateTokenFormResponseType} from "armonia/src/modules/core/api/user/public/validateToken/validateToken.form.response.type.ts";

const USER: ValidateTokenFormResponseType = {
    id: "u1",
    username: "user",
    name: "Ada",
    surname: "Lovelace",
    email: "ada@example.com",
    timezone: "Europe/Zurich",
    permissions: [],
    maxClearance: 1,
    isPlatformAdmin: false,
    company: {_id: "c1", name: "Company", modules: ["core"]},
};

const createStore = () => configureStore({
    reducer: {authentication: authenticationReducer},
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(authPersistence.middleware),
});

const signedInStore = () => {
    const store = createStore();
    store.dispatch(logIn({token: "token-a", refreshToken: "refresh-a"}));
    store.dispatch(updateUserData(USER));
    return store;
};

describe("authPersistence", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("persists the token pair and user after sign-in", () => {
        signedInStore();
        expect(getToken()).toBe("token-a");
        expect(getRefreshToken()).toBe("refresh-a");
        expect(getUser()).toEqual(USER);
    });

    it("writes storage before dispatch returns", () => {
        const store = signedInStore();
        store.dispatch(updateToken("token-b"));
        expect(getToken()).toBe("token-b");
        store.dispatch(updateRefreshToken("refresh-b"));
        expect(getRefreshToken()).toBe("refresh-b");
    });

    it("persists profile patches", () => {
        const store = signedInStore();
        store.dispatch(updateTimezone("UTC"));
        store.dispatch(updateUserValue({field: "phoneNumber", value: "+41 00"}));
        expect(getUser()).toMatchObject({timezone: "UTC", phoneNumber: "+41 00"});
    });

    it("clears storage on sign-out", () => {
        const store = signedInStore();
        store.dispatch(signOut());
        expect(getToken()).toBeNull();
        expect(getRefreshToken()).toBeNull();
        expect(getUser()).toBeNull();
    });

    it("clears storage on sign-out even when the state is already empty", () => {
        const store = createStore();
        setUser(USER);
        store.dispatch(signOut());
        store.dispatch(signOut());
        expect(getUser()).toBeNull();
    });

    it("clears storage when the session expires", () => {
        const store = signedInStore();
        store.dispatch(markSessionExpired());
        expect(store.getState().authentication.sessionExpired).toBe(true);
        expect(getToken()).toBeNull();
        expect(getUser()).toBeNull();
    });

    it("clears storage when sign-in returns no tokens", () => {
        const store = signedInStore();
        store.dispatch(logIn({token: "", refreshToken: ""}));
        expect(getToken()).toBeNull();
        expect(getUser()).toBeNull();
    });

    it("seeds the initial state from storage", () => {
        setToken("stored-token");
        setUser(USER);
        const {authentication} = createStore().getState();
        expect(authentication.token).toBe("stored-token");
        expect(authentication.user).toEqual(USER);
    });

    it("keeps reducers free of storage writes", () => {
        authenticationReducer(undefined, logIn({token: "token-a", refreshToken: "refresh-a"}));
        expect(getToken()).toBeNull();
    });
});
