import {
    ValidateTokenFormResponseType
} from "armonia/src/modules/core/api/user/public/validateToken/validateToken.form.response.type.ts";
import {
    getLocalStorageValue,
    removeLocalStorageValue,
    setLocalStorageValue
} from "@coreModule/helpers/context/localStorage/localStorageProvider.ts";

const STORAGE_KEYS = {
    token: "token",
    refreshToken: "refreshToken",
    user: "user",
    deviceId: "deviceId",
    impersonate: "impersonate",
} as const;

export const getToken = (): string | null => getLocalStorageValue(STORAGE_KEYS.token);
export const setToken = (token: string): void => setLocalStorageValue(STORAGE_KEYS.token, token);
export const clearToken = (): void => removeLocalStorageValue(STORAGE_KEYS.token);

export const getRefreshToken = (): string | null => getLocalStorageValue(STORAGE_KEYS.refreshToken);
export const setRefreshToken = (refreshToken: string): void => setLocalStorageValue(STORAGE_KEYS.refreshToken, refreshToken);
export const clearRefreshToken = (): void => removeLocalStorageValue(STORAGE_KEYS.refreshToken);

export const getDeviceId = (): string | null => getLocalStorageValue(STORAGE_KEYS.deviceId);
export const setDeviceId = (deviceId: string): void => setLocalStorageValue(STORAGE_KEYS.deviceId, deviceId);

export const getUser = (): ValidateTokenFormResponseType | null => {
    const raw = getLocalStorageValue(STORAGE_KEYS.user);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as ValidateTokenFormResponseType;
    } catch {
        return null;
    }
};

export const setUser = (user: ValidateTokenFormResponseType): void => {
    setLocalStorageValue(STORAGE_KEYS.user, JSON.stringify(user));
};

export const clearUser = (): void => removeLocalStorageValue(STORAGE_KEYS.user);

export const clearAuth = (): void => {
    clearToken();
    clearRefreshToken();
    clearUser();
};
