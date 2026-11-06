import type {Method, ResponseType} from "axios";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import {handleError} from "@coreModule/helpers/general/errors.ts";
import {formatHttpErrorMessage, isPlainObject, isSessionExpiredError} from "@coreModule/helpers/general/httpRequestBuilders.ts";
import type {HttpError, RequestPayload, ResolveLanguageKey} from "@coreModule/helpers/types/httpRequest.types.ts";

export type RequestFromApiOptions = {
    method: Method;
    url: string;
    /** Request body (ignored for GET). */
    data?: RequestPayload;
    /** Per-request headers; auth and company headers come from `apiClient`. */
    headers?: Record<string, string>;
    /** Aborts the request; an aborted request rejects without a toast or a log line. */
    signal?: AbortSignal;
    /** e.g. `"blob"` for a file. */
    responseType?: ResponseType;
    /** Translates the failure toast (`axios.error.title` + the server's message), like `useHttpRequest`. */
    resolveLanguageKey?: ResolveLanguageKey;
    /** No failure toast (the error is still logged and rethrown): the caller shows its own, or none. */
    silent?: boolean;
};

/** An error body read as JSON, also when the request asked for a blob. */
async function errorBody(error: unknown): Promise<Partial<HttpError>> {
    const response = (error as {response?: {data?: unknown; status?: number}} | null)?.response;
    let raw: unknown = response?.data;
    if (raw instanceof Blob) {
        try { raw = JSON.parse(await raw.text()); } catch { raw = {}; }
    }
    const body = isPlainObject(raw) ? raw : {};
    return {
        message: typeof body.message === "string" ? body.message : undefined,
        extraMessage: typeof body.extraMessage === "string" ? body.extraMessage : undefined,
        error_code: typeof body.error_code === "string" ? body.error_code : undefined,
        status: response?.status,
    };
}

/**
 * One API request as a promise, for the cases `useHttpRequest` / `withAxios` cannot cover (D75):
 * - the request must finish after the component that started it unmounts (a dialog or menu that closes);
 * - plain functions and awaited chains (request, then use the result in the next step);
 * - an abort signal owned by the caller, or a shared cache of in-flight requests;
 * - several requests settled together with one combined outcome (`Promise.all`).
 * Everywhere else, components use `withAxios` and hooks use `useHttpRequest`.
 *
 * A failure goes through `handleError`: logged, and toasted unless `silent` or the session expired
 * (`apiClient` already shows that dialog). It is then rethrown, so the caller can stop its chain.
 */
export async function requestFromApi<T>({method, url, data, headers, signal, responseType, resolveLanguageKey, silent = false}: RequestFromApiOptions): Promise<T> {
    try {
        const res = await apiClient.request<T>({method, url, data, headers, signal, responseType});
        return res.data;
    } catch (error) {
        const body = await errorBody(error);
        const showToast = !silent && !isSessionExpiredError(body.status, body.error_code);
        handleError(error, {context: `${String(method).toUpperCase()} ${url}`, showToast, signal, message: formatHttpErrorMessage(body, resolveLanguageKey) || undefined});
        throw error;
    }
}
