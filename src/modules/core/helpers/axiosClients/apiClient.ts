import axios, {AxiosError, InternalAxiosRequestConfig} from "axios";
import {getDeviceId, getToken} from "@coreModule/helpers/context/localStorage/authenticationStorage.ts";
import {store} from "@coreModule/helpers/redux/store/generalStore.ts";
import {markSessionExpired} from "@coreModule/helpers/redux/slices/authSlice.ts";

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
 * - Default auth and tenant context headers are injected here via request interceptor.
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
    const record = data as Record<string, unknown>;
    // authMW serializes as `errorCode`; some paths use `error_code`
    if (typeof record.errorCode === "string") return record.errorCode;
    if (typeof record.error_code === "string") return record.error_code;
    return undefined;
};

const isSessionExpiredError = (error: AxiosError): boolean => {
    if (error.response?.status === 401) {
        return true;
    }
    const code = getErrorCode(error);
    return !!code && SESSION_EXPIRED_ERROR_CODES.has(code);
};

const apiClient = axios.create();

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
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
        if (isSessionExpiredError(error) && shouldHandleSessionExpiry()) {
            // Do not hard-redirect: withAuthentication shows the session-expired dialog,
            // then signs out / navigates after the delay or OK click.
            store.dispatch(markSessionExpired());
        }
        return Promise.reject(error);
    }
);

export default apiClient;
