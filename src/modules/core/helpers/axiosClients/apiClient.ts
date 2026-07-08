import axios, {AxiosError, InternalAxiosRequestConfig} from "axios";
import {getDeviceId, getToken} from "@coreModule/helpers/context/localStorage/authenticationStorage.ts";
import {store} from "@coreModule/helpers/redux/store/generalStore.ts";
import {signOut} from "@coreModule/helpers/redux/slices/authSlice.ts";

const AUTH_PATH_PREFIX = "/authenticate";

/**
 * Shared axios instance for all API calls in the browser app.
 *
 * Header policy:
 * - Default auth and tenant context headers are injected here via request interceptor.
 * - Feature-level hooks/components should only add request-specific headers.
 */
const shouldRedirectToLogin = (): boolean => {
    if (typeof window === "undefined") return false;
    return !window.location.pathname.startsWith(AUTH_PATH_PREFIX);
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
        if (error.response?.status === 401) {
            store.dispatch(signOut());
            if (shouldRedirectToLogin()) {
                window.location.assign("/authenticate/login");
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
