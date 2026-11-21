import axios, {AxiosError, InternalAxiosRequestConfig} from "axios";
import {store} from "@coreModule/helpers/redux/store/generalStore.ts";
import {markSessionExpired} from "@coreModule/helpers/redux/slices/authSlice.ts";
import {SESSION_EXPIRED_ERROR_CODES} from "@coreModule/helpers/apiClient/sessionExpiredErrorCodes.ts";
import {contextHeaders} from "@coreModule/helpers/apiClient/contextHeaders.ts";
import {noteApiWrite} from "@coreModule/helpers/apiClient/apiWrites.ts";

const AUTH_PATH_PREFIX = "/authenticate";

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

    for (const [name, value] of Object.entries(contextHeaders())) {
        // A request that names its site company itself (a prefetch of another company's page) keeps it.
        if (name === "x-site-company" && headers[name]) continue;
        headers[name] = value;
    }

    nextConfig.headers = headers;
    return nextConfig;
});

apiClient.interceptors.response.use(
    (response) => {
        // A write changes what kept answers say (see apiWrites.ts); a cached read sent as POST does not.
        if ((response.config.method ?? "get").toLowerCase() !== "get" && !response.config.cachedRead) noteApiWrite();
        return response;
    },
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
