import axios, {AxiosError, InternalAxiosRequestConfig} from "axios";
import {getDeviceId, getToken} from "@baseModule/helpers/context/localStorage/authenticationStorage.ts";
import {store} from "@baseModule/helpers/redux/store/generalStore.ts";
import {markSessionExpired} from "@baseModule/helpers/redux/slices/authSlice.ts";

const AUTH_PATH_PREFIX = "/authenticate";

/**
 * Backend auth failures for expired/invalid sessions use these codes.
 * Note: maestro returns HTTP 403 (not 401) for `token_verification_failed` / `no_token`.
 * `session_not_found` defaults to HTTP 400.
 */
const SESSION_EXPIRED_ERROR_CODES = new Set([
    "token_verification_failed",
    "no_token",
    "session_not_found",
]);

/**
 * Shared axios instance for all API calls in the browser app.
 *
 * Header policy:
 * - Default auth and tenant context headers are injected here via request interceptor, and only
 *   for this app's own origin: an absolute URL elsewhere never receives the token.
 * - Feature-level hooks/components should only add request-specific headers.
 */
const shouldHandleSessionExpiry = (): boolean => {
    if (typeof window === "undefined") return false;
    return !window.location.pathname.startsWith(AUTH_PATH_PREFIX);
};

const getErrorCode = (error: AxiosError): string | undefined => {
    const data = error.response?.data;
    if (!data || typeof data !== "object") {
        return undefined;
    }
    const errorCode = (data as Record<string, unknown>).error_code;
    return typeof errorCode === "string" ? errorCode : undefined;
};

const isSessionExpiredError = (error: AxiosError): boolean => {
    if (error.response?.status === 401) {
        return true;
    }
    const code = getErrorCode(error);
    return !!code && SESSION_EXPIRED_ERROR_CODES.has(code);
};

/** Whether `url` (absolute or relative to the page) points at this app's origin. */
export function isSameOrigin(url: string): boolean {
    if (typeof window === "undefined") return true;
    try {
        return new URL(url, window.location.href).origin === window.location.origin;
    } catch {
        return false;
    }
}

const apiClient = axios.create();

const targetsOwnOrigin = (config: InternalAxiosRequestConfig | undefined): boolean =>
    !!config && isSameOrigin(apiClient.getUri(config));

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (!targetsOwnOrigin(config)) {
        return config;
    }
    const nextConfig = config;
    const headers = nextConfig.headers || {};
    const state = store.getState();

    const token = getToken();
    const deviceId = getDeviceId();
    const languageCode = state.language?.languageCode;
    const companyId = state.authentication?.user?.company?._id;

    if (token) {
        headers["x-auth-token"] = token + "";
    }
    if (deviceId) {
        headers["x-device-id"] = deviceId;
    }
    if (languageCode) {
        headers["language"] = languageCode;
    }
    if (companyId) {
        headers["company"] = companyId;
    }

    nextConfig.headers = headers;
    return nextConfig;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        // Another origin's 401 says nothing about our session.
        if (isSessionExpiredError(error) && targetsOwnOrigin(error.config) && shouldHandleSessionExpiry()) {
            // Do not hard-redirect: AuthenticationProvider shows the session setup screen.
            store.dispatch(markSessionExpired());
        }
        return Promise.reject(error);
    }
);

export default apiClient;
