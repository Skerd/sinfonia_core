import type {
    HttpError,
    HttpRequest,
    PropsPath,
    RequestPayload,
    ResolveLanguageKey,
} from "@coreModule/helpers/types/httpRequest.types.ts";
import {SESSION_EXPIRED_ERROR_CODES} from "@coreModule/helpers/apiClient/sessionExpiredErrorCodes.ts";

/**
 * Pure request/toast builders used by `useHttpRequest`. Kept free of React so they can be unit-tested.
 *
 * Body precedence (lowest → highest), identical for JSON and multipart:
 *   httpRequest.data < jsonData (multipart only) < requestData < addToBody
 */

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value) &&
    !(value instanceof FormData) && !(value instanceof Blob) && !(value instanceof Date);

const appendFormDataValue = (formData: FormData, key: string, value: unknown): void => {
    if (value == null) {
        return;
    }
    if (value instanceof Blob) {
        formData.append(key, value);
        return;
    }
    if (value instanceof Date) {
        formData.append(key, value.toISOString());
        return;
    }
    if (Array.isArray(value) || isPlainObject(value)) {
        formData.append(key, JSON.stringify(value));
        return;
    }
    formData.append(key, String(value));
};

export const getNestedValue = (source: unknown, path: PropsPath): unknown => {
    const segments = Array.isArray(path) ? path : path.split(".");
    return segments.reduce<unknown>((current, segment) => {
        if (current == null || typeof current !== "object") {
            return undefined;
        }
        return (current as Record<string, unknown>)[segment];
    }, source);
};

const toHeaderValue = (value: unknown): string => {
    if (value == null) {
        return "";
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === "object") {
        return JSON.stringify(value);
    }
    return String(value);
};

/** Appends one encoded path segment per `addToPath` entry; empty values (`undefined`, `null`, `""`) are skipped. */
export const buildUrl = (requestConfig: HttpRequest, runtimeProps: unknown, url: string): string => {
    const segments = (requestConfig.addToPath ?? [])
        .map((p) => getNestedValue(runtimeProps, p.whatToGet))
        .filter((value) => value != null && value !== "")
        .map((value) => "/" + encodeURIComponent(String(value)));
    return url + segments.join("");
};

/** Resolves `addToBody` into a flat object. `whereToPut: ""` spreads an object value (or keys a scalar by `whatToGet`). */
const resolveAddToBody = (requestConfig: HttpRequest, runtimeProps: unknown): Record<string, unknown> => {
    const built: Record<string, unknown> = {};
    for (const p of requestConfig.addToBody ?? []) {
        const value = getNestedValue(runtimeProps, p.whatToGet);
        if (value === undefined) {
            continue;
        }
        if (p.whereToPut === "") {
            if (isPlainObject(value)) {
                Object.assign(built, value);
            } else {
                built[Array.isArray(p.whatToGet) ? p.whatToGet.join(".") : p.whatToGet] = value;
            }
        } else {
            built[p.whereToPut] = value;
        }
    }
    return built;
};

export const buildBody = (
    requestConfig: HttpRequest,
    runtimeProps: unknown,
    requestData: RequestPayload,
    jsonData?: Record<string, unknown> | null,
): RequestPayload => {
    const staticData = requestConfig.data ?? {};
    const fromProps = resolveAddToBody(requestConfig, runtimeProps);

    if (!(requestData instanceof FormData)) {
        return {...staticData, ...requestData, ...fromProps};
    }

    const formData = new FormData();
    for (const [key, value] of requestData.entries()) {
        formData.append(key, value);
    }
    // Lower-precedence sources only fill keys the form did not provide.
    const defaults: Record<string, unknown> = {...staticData, ...(isPlainObject(jsonData) ? jsonData : {})};
    for (const [key, value] of Object.entries(defaults)) {
        if (!formData.has(key)) {
            appendFormDataValue(formData, key, value);
        }
    }
    // addToBody wins, same as the JSON branch.
    for (const [key, value] of Object.entries(fromProps)) {
        formData.delete(key);
        appendFormDataValue(formData, key, value);
    }
    return formData;
};

export const buildHeaders = (requestConfig: HttpRequest, runtimeProps: unknown, isFormData: boolean): Record<string, string> => {
    const headers: Record<string, string> = {};
    for (const p of requestConfig.addToHeader ?? []) {
        headers[p.whereToPut] = toHeaderValue(getNestedValue(runtimeProps, p.whatToGet));
    }
    Object.assign(headers, requestConfig.extraHeader);

    // Multipart: the browser must set Content-Type itself so it can add the boundary.
    if (isFormData) {
        for (const key of Object.keys(headers)) {
            if (key.toLowerCase() === "content-type") {
                delete headers[key];
            }
        }
    }
    return headers;
};

export type RequestToastMessages = {
    loading?: string;
    success?: (data: unknown) => string;
    error?: (error: Partial<HttpError>) => string;
};

/** Only stages whose `axios.<stage>` language key exists get a toast. */
export const buildToastMessages = (requestConfig: HttpRequest, resolveLanguageKey?: ResolveLanguageKey): RequestToastMessages => {
    if (!resolveLanguageKey) {
        return {};
    }
    const messages: RequestToastMessages = {};

    if (resolveLanguageKey("axios.start", true)) {
        messages.loading = String(resolveLanguageKey("axios.start.title") || "");
    }
    if (resolveLanguageKey("axios.success", true)) {
        messages.success = (data) => {
            const {onSuccessMessage} = requestConfig;
            // Prefer language-file copy over server `message` (which is often English-only).
            if (onSuccessMessage && isPlainObject(data) && data[onSuccessMessage.if] === onSuccessMessage.condition) {
                return String(resolveLanguageKey(`axios.${onSuccessMessage.message}.title`) || "");
            }
            return String(resolveLanguageKey("axios.success.title") || "");
        };
    }
    if (resolveLanguageKey("axios.error", true)) {
        messages.error = (requestError) => formatHttpErrorMessage(requestError, resolveLanguageKey);
    }
    return messages;
};

export const formatHttpErrorMessage = (requestError: Partial<HttpError>, resolveLanguageKey?: ResolveLanguageKey): string => {
    const title = String(resolveLanguageKey?.("axios.error.title") || "");
    let serverError = requestError.message || "";
    if (requestError.extraMessage) {
        serverError += " [ " + requestError.extraMessage + " ]";
    }
    if (!serverError) {
        return title;
    }
    return title ? `${title}: ${serverError}` : serverError;
};

/** Session expiry is handled by AuthenticationProvider's setup screen, so it never gets an error toast. */
export const isSessionExpiredError = (status: number | undefined, errorCode: string | undefined): boolean =>
    status === 401 || (!!errorCode && SESSION_EXPIRED_ERROR_CODES.has(errorCode));

/** A bare 401/403 (no server message or code) is settled silently. */
export const shouldToastError = (error: Partial<HttpError>, hideIfError: boolean | undefined): boolean => {
    if (hideIfError || isSessionExpiredError(error.status, error.error_code)) {
        return false;
    }
    const isBareAuthError = (error.status === 401 || error.status === 403) && !error.message && !error.error_code;
    return !isBareAuthError;
};
