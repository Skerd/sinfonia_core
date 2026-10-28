import {
    ValidateTokenFormResponseType
} from "armonia/src/modules/core/api/user/public/validateToken/validateToken.form.response.type.ts";
import {
    getLocalStorageJson,
    getLocalStorageValue,
    removeLocalStorageValue,
    setLocalStorageJson,
    setLocalStorageValue
} from "@coreModule/helpers/context/localStorage/localStorageProvider.ts";
import {getCookie, removeCookie, setCookie} from "@coreModule/helpers/context/cookies/cookies.ts";
import {env} from "@coreModule/helpers/environment/env.ts";
import {generateUUID} from "@coreModule/helpers/general/uuid.ts";

/*
 * Persisted session credentials and device identity.
 *
 * `clearAuth` removes the session (tokens and cached user) but deliberately
 * keeps the device id: it identifies this browser to the server across
 * sign-ins, which is what lets the sessions screen mark "this device".
 *
 * The portal shares one session across its zone (the apex and every company
 * site), so its build keeps the credentials in a cookie on the zone; every
 * other app keeps them in this host's localStorage. The cached user always
 * stays per host.
 */

export const AUTH_STORAGE_KEYS = {
    token: "client-ui-user-token",
    refreshToken: "client-ui-user-refreshToken",
    user: "client-ui-user",
    deviceId: "client-ui-user-deviceId"
} as const;

const ZONE = env.VITE_PORTAL_ROOT_DOMAIN;
/** The server decides when a session ends; the cookie only has to outlive it. */
const ZONE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const credentials: {get(key: string): string | null; set(key: string, value: string): void; remove(key: string): void} = ZONE
    ? {
        get: (key) => getCookie(key) ?? null,
        set: (key, value) => setCookie(key, value, {domain: ZONE, maxAge: ZONE_COOKIE_MAX_AGE}),
        remove: (key) => removeCookie(key, {domain: ZONE}),
    }
    : {
        get: getLocalStorageValue,
        set: (key, value) => { setLocalStorageValue(key, value); },
        remove: removeLocalStorageValue,
    };

/** Treats an empty string as absent, so callers only ever see a usable value or null. */
const readString = (key: string): string | null => credentials.get(key) || null;

/** Writing an empty value removes the key rather than storing a blank credential. */
const writeString = (key: string, value: string): void => {
    if (value) credentials.set(key, value);
    else credentials.remove(key);
};

export const getToken = (): string | null => readString(AUTH_STORAGE_KEYS.token);
export const setToken = (token: string): void => writeString(AUTH_STORAGE_KEYS.token, token);
export const clearToken = (): void => credentials.remove(AUTH_STORAGE_KEYS.token);

export const getRefreshToken = (): string | null => readString(AUTH_STORAGE_KEYS.refreshToken);
export const setRefreshToken = (refreshToken: string): void => writeString(AUTH_STORAGE_KEYS.refreshToken, refreshToken);
export const clearRefreshToken = (): void => credentials.remove(AUTH_STORAGE_KEYS.refreshToken);

export const getDeviceId = (): string | null => readString(AUTH_STORAGE_KEYS.deviceId);
export const setDeviceId = (deviceId: string): void => writeString(AUTH_STORAGE_KEYS.deviceId, deviceId);

/**
 * Returns this browser's device id, creating and persisting one on first use.
 * Safe to call on every render.
 */
export const ensureDeviceId = (): string => {
    const existing = getDeviceId();
    if (existing) return existing;
    // generateUUID rather than crypto.randomUUID: the latter is missing outside
    // secure contexts, e.g. the dev server opened over the LAN via plain http.
    const created = generateUUID();
    setDeviceId(created);
    return created;
};

/**
 * Only checks that the stored value is an object; the fields are filled in by
 * whatever the server returned when it was saved.
 */
const isStoredUser = (value: unknown): value is ValidateTokenFormResponseType =>
    typeof value === "object" && value !== null && !Array.isArray(value);

export const getUser = (): ValidateTokenFormResponseType | null => getLocalStorageJson(AUTH_STORAGE_KEYS.user, isStoredUser);
export const setUser = (user: ValidateTokenFormResponseType): void => {
    setLocalStorageJson(AUTH_STORAGE_KEYS.user, user);
};
export const clearUser = (): void => removeLocalStorageValue(AUTH_STORAGE_KEYS.user);

/** Signs this browser out locally. Keeps the device id (see file header). */
export const clearAuth = (): void => {
    clearToken();
    clearRefreshToken();
    clearUser();
};
