import {toast} from "sonner";
import {useEffect, useRef, useState} from 'react';
import axios from "axios";
import apiClient from "@baseModule/helpers/apiClient/apiClient.ts";
import {
    buildBody,
    buildHeaders,
    buildToastMessages,
    buildUrl,
    isPlainObject,
    shouldToastError,
} from "@baseModule/helpers/general/httpRequestBuilders.ts";
import type {
    HttpError,
    HttpRequest,
    HttpRequestLifecycleFunctions,
    HttpRequestRuntimeProps,
    HttpRequestState,
    RequestPayload,
} from "@baseModule/helpers/types/httpRequest.types.ts";

export type * from "@baseModule/helpers/types/httpRequest.types.ts";

const optionalString = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);

/** Normalises an axios error body (JSON or, for blob responses, a JSON-encoded Blob) into `HttpError`. */
const readErrorBody = async (err: unknown): Promise<HttpError> => {
    // Read structurally: interceptors may reject with axios-shaped plain objects, not `AxiosError` instances.
    const response = (err as { response?: { data?: unknown; status?: number } } | null)?.response;
    let rawData: unknown = response?.data;
    if (rawData instanceof Blob) {
        try { rawData = JSON.parse(await rawData.text()); } catch { rawData = {}; }
    }
    const body = isPlainObject(rawData) ? rawData : {};
    return {
        ...body,
        error: optionalString(body.error),
        message: optionalString(body.message),
        extraMessage: optionalString(body.extraMessage),
        error_code: optionalString(body.error_code),
        availableIn: typeof body.availableIn === "number" ? body.availableIn : undefined,
        status: response?.status,
    };
};

/**
 * Generic request hook with toast/lifecycle integration.
 *
 * Contract:
 * - Request execution is driven by `fetchCount` increments (must be > 0).
 * - If a new request starts, the previous one is aborted (AbortController) and its toast dismissed.
 * - Response writes are guarded by request id to avoid stale async updates.
 * - Default auth/context headers are NOT built here; `apiClient` injects them globally.
 * - After a `rate_limit_exceeded` error, requests are held until `availableIn` elapses. A request
 *   triggered during the cooldown is sent once it ends; the failed request itself is never replayed.
 *
 * Payload helpers (see `httpRequestBuilders.ts` for precedence):
 * - `addToPath` appends encoded URL segments from `props`.
 * - `addToBody` maps values from `props` into body/form-data.
 * - `addToHeader` and `extraHeader` are reserved for per-request headers.
 *
 * Notes:
 * - For multipart requests, never set `Content-Type` manually; browser sets boundary.
 * - Requests are held while `inViewPort` is false and sent once it turns true.
 */
export default function useHttpRequest<TData = unknown>(
    httpRequest: HttpRequest,
    requestData: RequestPayload = {},
    fetchCount: number,
    inViewPort: boolean = true,
    componentHttpRequestLifecycleFunctions: HttpRequestLifecycleFunctions<TData> = {},
    props: HttpRequestRuntimeProps<TData> = {}
): HttpRequestState<TData> {

    const [response, setResponse] = useState<TData | null>(null);
    const [error, setError] = useState<HttpError | null>(null);
    const [loading, setLoading] = useState<boolean>(fetchCount > 0 && inViewPort);
    // Bumped when a rate-limit cooldown ends and a request was deferred during it.
    const [deferredRequestTick, setDeferredRequestTick] = useState(0);

    const rateLimitUntilRef = useRef(0);
    const deferredDuringRateLimitRef = useRef(false);
    const rateLimitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const requestIdRef = useRef(0);
    const latestValuesRef = useRef({
        httpRequest,
        requestData,
        componentHttpRequestLifecycleFunctions,
        props,
    });

    useEffect(() => {
        latestValuesRef.current = {
            httpRequest,
            requestData,
            componentHttpRequestLifecycleFunctions,
            props,
        };
    }, [httpRequest, requestData, componentHttpRequestLifecycleFunctions, props]);

    useEffect(() => {
        return () => {
            // Invalidate any in-flight request so its handlers only clean up its toast.
            requestIdRef.current += 1;
            abortControllerRef.current?.abort();
            abortControllerRef.current = null;
            if (rateLimitTimeoutRef.current) clearTimeout(rateLimitTimeoutRef.current);
        };
    }, []);

    const startRateLimitCooldown = (seconds: number) => {
        rateLimitUntilRef.current = Date.now() + seconds * 1000;
        if (rateLimitTimeoutRef.current) clearTimeout(rateLimitTimeoutRef.current);
        rateLimitTimeoutRef.current = setTimeout(() => {
            rateLimitUntilRef.current = 0;
            rateLimitTimeoutRef.current = null;
            if (deferredDuringRateLimitRef.current) {
                deferredDuringRateLimitRef.current = false;
                setDeferredRequestTick((tick) => tick + 1);
            }
        }, seconds * 1000);
    };

    useEffect(() => {
        if (!inViewPort || fetchCount <= 0) {
            setLoading(false);
            return;
        }
        if (Date.now() < rateLimitUntilRef.current) {
            deferredDuringRateLimitRef.current = true;
            return;
        }

        const {
            httpRequest: currentHttpRequest,
            requestData: currentRequestData,
            componentHttpRequestLifecycleFunctions: lifecycle,
            props: currentProps,
        } = latestValuesRef.current;

        // cancel any active call before starting a new one
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;
        const requestId = ++requestIdRef.current;
        const isCurrent = () => requestId === requestIdRef.current;

        const toastMessages = buildToastMessages(currentHttpRequest, currentProps.resolveLanguageKey);
        const toastId = toastMessages.loading !== undefined ? toast.loading(toastMessages.loading) : undefined;
        /** Replaces the loading toast with `message`, or just dismisses it when there is nothing to say. */
        const settleToast = (kind: "success" | "error", message?: string) => {
            if (message) {
                toast[kind](message, {id: toastId});
            } else if (toastId !== undefined) {
                toast.dismiss(toastId);
            }
        };

        setLoading(true);
        setError(null);
        lifecycle.start?.();

        const isFormDataRequest = !!currentProps.isFormData || currentRequestData instanceof FormData;
        const url = buildUrl(currentHttpRequest, currentProps, currentProps.url ?? currentHttpRequest.url);
        const data = buildBody(currentHttpRequest, currentProps, currentRequestData, currentProps.jsonData);
        const headers = buildHeaders(currentHttpRequest, currentProps, isFormDataRequest);

        currentProps.notifyPost?.({url, data, headers});

        const run = async () => {
            try {
                const res = await apiClient<TData>({
                    method: currentHttpRequest.method,
                    url,
                    data,
                    headers,
                    signal: controller.signal,
                    responseType: currentHttpRequest.responseType,
                });
                if (!isCurrent()) {
                    settleToast("success");
                    return;
                }
                setResponse(res.data);
                lifecycle.success?.(res.data);
                settleToast("success", toastMessages.success?.(res.data));
                currentProps.notifySuccess?.({data: res.data});
            } catch (err: unknown) {
                if (!isCurrent() || controller.signal.aborted || axios.isCancel(err)) {
                    settleToast("error");
                    return;
                }

                const errorBody = await readErrorBody(err);
                if (!isCurrent()) {
                    settleToast("error");
                    return;
                }

                setError(errorBody);
                if (errorBody.error_code === "rate_limit_exceeded" && errorBody.availableIn && errorBody.availableIn > 0) {
                    startRateLimitCooldown(errorBody.availableIn);
                }

                const showToast = shouldToastError(errorBody, currentProps.hideIfError);
                settleToast("error", showToast ? toastMessages.error?.(errorBody) : undefined);

                lifecycle.error?.(err);
                currentProps.notifyError?.({data: errorBody});
            } finally {
                if (isCurrent()) {
                    setLoading(false);
                }
            }
        };
        void run();
    }, [fetchCount, inViewPort, deferredRequestTick]);

    return {loading, error, data: response};
}
