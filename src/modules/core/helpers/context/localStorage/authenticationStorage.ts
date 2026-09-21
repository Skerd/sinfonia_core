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
import {generateUUID} from "@coreModule/helpers/general/uuid.ts";

/*
 * Persisted session credentials and device identity.
 *
 * `clearAuth` removes the session (tokens and cached user) but deliberately
 * keeps the device id: it identifies this browser to the server across
 * sign-ins, which is what lets the sessions screen mark "this device".
 */

export const AUTH_STORAGE_KEYS = {
    token: "client-ui-user-token",
    refreshToken: "client-ui-user-refreshToken",
    user: "client-ui-user",
    deviceId: "client-ui-user-deviceId"
} as const;

/** Treats an empty string as absent, so callers only ever see a usable value or null. */
const readString = (key: string): string | null => getLocalStorageValue(key) || null;

/** Writing an empty value removes the key rather than storing a blank credential. */
const writeString = (key: string, value: string): void => {
    if (value) setLocalStorageValue(key, value);
    else removeLocalStorageValue(key);
};

export const getToken = (): string | null => readString(AUTH_STORAGE_KEYS.token);
export const setToken = (token: string): void => writeString(AUTH_STORAGE_KEYS.token, token);
export const clearToken = (): void => removeLocalStorageValue(AUTH_STORAGE_KEYS.token);

export const getRefreshToken = (): string | null => readString(AUTH_STORAGE_KEYS.refreshToken);
export const setRefreshToken = (refreshToken: string): void => writeString(AUTH_STORAGE_KEYS.refreshToken, refreshToken);
export const clearRefreshToken = (): void => removeLocalStorageValue(AUTH_STORAGE_KEYS.refreshToken);

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
