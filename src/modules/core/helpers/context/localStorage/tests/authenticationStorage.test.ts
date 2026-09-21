import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import type {ValidateTokenFormResponseType} from "armonia/src/modules/core/api/user/public/validateToken/validateToken.form.response.type.ts";
import {
    AUTH_STORAGE_KEYS,
    clearAuth,
    ensureDeviceId,
    getDeviceId,
    getRefreshToken,
    getToken,
    getUser,
    setDeviceId,
    setRefreshToken,
    setToken,
    setUser,
} from "@coreModule/helpers/context/localStorage/authenticationStorage.ts";
import {resetLocalStorageMemoryFallback} from "@coreModule/helpers/context/localStorage/localStorageProvider.ts";

const user = {
    id: "u1",
    username: "ada",
    name: "Ada",
    surname: "Lovelace",
    email: "ada@example.com",
    timezone: "Europe/Zurich",
    permissions: [],
    maxClearance: 1,
    company: {_id: "c1", name: "Analytical"},
} as unknown as ValidateTokenFormResponseType;

beforeEach(() => {
    localStorage.clear();
    resetLocalStorageMemoryFallback();
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe("tokens", () => {
    it("store and read the access and refresh tokens under their keys", () => {
        setToken("access");
        setRefreshToken("refresh");

        expect(getToken()).toBe("access");
        expect(getRefreshToken()).toBe("refresh");
        expect(localStorage.getItem(AUTH_STORAGE_KEYS.token)).toBe("access");
        expect(localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken)).toBe("refresh");
    });

    it("treat empty values as absent", () => {
        localStorage.setItem(AUTH_STORAGE_KEYS.token, "");
        expect(getToken()).toBeNull();

        setRefreshToken("refresh");
        setRefreshToken("");
        expect(getRefreshToken()).toBeNull();
        expect(localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken)).toBeNull();
    });
});

describe("user", () => {
    it("round-trips the cached user", () => {
        setUser(user);

        expect(getUser()).toEqual(user);
    });

    it("returns null when nothing is cached", () => {
        expect(getUser()).toBeNull();
    });

    it.each([["null"], ["42"], [`"ada"`], ["[]"]])("rejects a non-object cached value (%s)", (raw) => {
        localStorage.setItem(AUTH_STORAGE_KEYS.user, raw);

        expect(getUser()).toBeNull();
    });

    it("drops a corrupt cached value", () => {
        localStorage.setItem(AUTH_STORAGE_KEYS.user, "{broken");

        expect(getUser()).toBeNull();
        expect(localStorage.getItem(AUTH_STORAGE_KEYS.user)).toBeNull();
    });
});

describe("device id", () => {
    it("creates a device id once and then reuses it", () => {
        const first = ensureDeviceId();

        expect(first).toMatch(/^[0-9a-f-]{36}$/);
        expect(getDeviceId()).toBe(first);
        expect(ensureDeviceId()).toBe(first);
    });

    it("keeps an existing device id", () => {
        setDeviceId("existing");

        expect(ensureDeviceId()).toBe("existing");
    });

    it("works outside secure contexts, where crypto.randomUUID is missing", () => {
        vi.stubGlobal("crypto", {getRandomValues: globalThis.crypto.getRandomValues.bind(globalThis.crypto)});

        const id = ensureDeviceId();

        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
        expect(getDeviceId()).toBe(id);
    });

    it("stays stable for the page's life when storage is blocked", () => {
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new DOMException("blocked", "SecurityError"); });
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("blocked", "SecurityError"); });

        const id = ensureDeviceId();

        expect(ensureDeviceId()).toBe(id);
        expect(getDeviceId()).toBe(id);
    });
});

describe("clearAuth", () => {
    it("removes the session but keeps the device id", () => {
        setToken("access");
        setRefreshToken("refresh");
        setUser(user);
        const deviceId = ensureDeviceId();

        clearAuth();

        expect(getToken()).toBeNull();
        expect(getRefreshToken()).toBeNull();
        expect(getUser()).toBeNull();
        expect(getDeviceId()).toBe(deviceId);
    });
});
