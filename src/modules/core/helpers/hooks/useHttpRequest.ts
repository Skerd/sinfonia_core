import {toast} from "sonner";
import {useEffect, useRef, useState} from 'react';
import {Method} from "axios";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";

export type HttpRequestUrlBuilder = {
    whatToGet: string[]
}
export type HttpRequestBodyBuilder = {
    whatToGet: string,
    whereToPut: string
}
export type HttpRequestHeaderBuilder = {
    whatToGet: string,
    whereToPut: string
}
type RuntimeProps = Record<string, unknown> & {
    url?: string;
    jsonData?: Record<string, unknown> | null;
    isFormData?: boolean;
    resolveLanguageKey?: (key: string, returnUndefinedIfNeeded?: boolean) => string;
    notifyPost?: (data: { url: string; data: RequestPayload; headers: Record<string, string> }) => void;
    notifySuccess?: (data: { data: unknown }) => void;
    notifyError?: (data: { data: unknown }) => void;
    hideIfError?: boolean;
};
export type RequestPayload = Record<string, unknown> | FormData;
export type HttpRequest = {
    method: Method,
    url: string,
    data: Record<string, unknown>,
    addToPath?: HttpRequestUrlBuilder[],
    addToBody?: HttpRequestBodyBuilder[]
    addToHeader?: HttpRequestHeaderBuilder[],
    extraHeader?: { [key: string]: string },
    onlyCallWhenInViewPort?: boolean,
    alwaysRefreshWhenMovedViewPort?: boolean,
    onSuccessMessage?: {
        if: string,
        condition: unknown,
        message: string
    },
    responseType?: string,
}
export type HttpError = {
    error: string,
    errorAl: string,
    extraMessage: string,

    message: string,
    error_code: string,
    status?: number,
    availableIn?: number
}
export type HttpRequestResponseType = {
    loading: boolean,
    error: HttpError | null,
    data: unknown
}

export type HttpRequestLifecycleFunctions<TData> = {
    start?: () => void;
    error?: (error: unknown) => void;
    success?: (data: TData) => void;
}

type HttpRequestResponseState<TData> = {
    loading: boolean;
    error: HttpError | null;
    data: TData | null;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof FormData) && !(value instanceof Blob) && !(value instanceof File) && !(value instanceof Date);

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

const getNestedValue = (source: RuntimeProps, path: string[] | string): unknown => {
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

/**
 * Generic request hook with toast/lifecycle integration.
 *
 * Contract:
 * - Request execution is driven by `fetchCount` increments (must be > 0).
 * - If a new request starts, the previous one is aborted (AbortController).
 * - Response writes are guarded by request id to avoid stale async updates.
 * - Default auth/context headers are NOT built here; `apiClient` injects them globally.
 *
 * Payload helpers:
 * - `addToPath` appends dynamic URL segments from `props`.
 * - `addToBody` maps values from `props` into body/form-data.
 * - `addToHeader` and `extraHeader` are reserved for per-request headers.
 *
 * Notes:
 * - For multipart requests, never set `Content-Type` manually; browser sets boundary.
 * - `onlyCallWhenInViewPort` exists in `HttpRequest` for backward compatibility but
 *   execution gating in this hook is controlled by the `inViewPort` function argument.
 */
export default function useHttpRequest<TData = unknown>(
    httpRequest: HttpRequest,
    requestData: RequestPayload = {},
    fetchCount: number,
    inViewPort: boolean = true,
    componentHttpRequestLifecycleFunctions: HttpRequestLifecycleFunctions<TData> = {},
    props: RuntimeProps = {}
): HttpRequestResponseState<TData> {

    const [response, setResponse] = useState<TData | null>(null);
    const [error, setError] = useState<HttpError | null>(null);
    const [loading, setLoading] = useState<boolean>(fetchCount > 0 && inViewPort);

    const [innerFetchCount, setInnerFetchCount] = useState(fetchCount);
    const [rateLimitUntil, setRateLimitUntil] = useState<number>(0);
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
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
            if (rateLimitTimeoutRef.current) clearTimeout(rateLimitTimeoutRef.current);
        };
    }, []);

    const buildUrl = (requestConfig: HttpRequest, runtimeProps: RuntimeProps, url: string): string => {
        const {addToPath} = requestConfig;
        let additions = "";
        if (!!addToPath) {
            for (let i = 0; i < addToPath.length; i++) {
                const p = addToPath[i];
                const curr = getNestedValue(runtimeProps, p.whatToGet);
                if (!!curr) {
                    additions = additions + "/" + curr;
                }
            }
        }
        return url + additions;
    }
    const buildBody = (requestConfig: HttpRequest, runtimeProps: RuntimeProps, data: Record<string, unknown>, nextRequestData: RequestPayload): RequestPayload => {
        // If requestData is FormData, handle it specially
        if (nextRequestData instanceof FormData) {
            const formData = new FormData();

            // Copy all entries from requestData
            for (const [key, value] of nextRequestData.entries()) {
                formData.append(key, value);
            }

            // Add JSON data from props.jsonData if it exists (from onFormDataChange with jsonData)
            const jsonData = runtimeProps.jsonData;
            if (isPlainObject(jsonData)) {
                for (const key in jsonData) {
                    if (jsonData.hasOwnProperty(key)) {
                        const value = jsonData[key];
                        appendFormDataValue(formData, key, value);
                    }
                }
            }

            // Add data from httpRequest.data if it exists
            if (data) {
                for (const key in data) {
                    if (data.hasOwnProperty(key)) {
                        const value = data[key];
                        // Check if key already exists in formData (don't overwrite)
                        if (!formData.has(key)) {
                            appendFormDataValue(formData, key, value);
                        }
                    }
                }
            }

            // Handle addToBody for FormData
            const {addToBody} = requestConfig;
            if (!!addToBody) {
                for (let i = 0; i < addToBody.length; i++) {
                    const p = addToBody[i];
                    const value = getNestedValue(runtimeProps, p.whatToGet);
                    if (value !== undefined && value !== null) {
                        if (p.whereToPut === "") {
                            // If whereToPut is empty, spread the object properties
                            if (isPlainObject(value)) {
                                for (const key in value) {
                                    if (value.hasOwnProperty(key)) {
                                        // Check if key already exists (don't overwrite)
                                        if (!formData.has(key)) {
                                            appendFormDataValue(formData, key, value[key]);
                                        }
                                    }
                                }
                            } else {
                                // Check if key already exists (don't overwrite)
                                if (!formData.has(p.whatToGet)) {
                                    appendFormDataValue(formData, p.whatToGet, value);
                                }
                            }
                        } else {
                            // Check if key already exists (don't overwrite)
                            if (!formData.has(p.whereToPut)) {
                                appendFormDataValue(formData, p.whereToPut, value);
                            }
                        }
                    }
                }
            }

            return formData;
        }

        // Regular object handling
        let builtBody: Record<string, unknown> = {};
        const {addToBody} = requestConfig;
        if (!!addToBody) {
            for (let i = 0; i < addToBody.length; i++) {
                const p = addToBody[i];
                const value = getNestedValue(runtimeProps, p.whatToGet);
                if (p.whereToPut === "" && isPlainObject(value)) {
                    builtBody = {
                        ...builtBody,
                        ...value
                    }
                } else {
                    builtBody[p.whereToPut] = value;
                }
            }
        }

        return {
            ...(data || {}),
            ...(nextRequestData instanceof FormData ? {} : nextRequestData),
            ...builtBody
        }
    }
    const buildHeader = (requestConfig: HttpRequest, runtimeProps: RuntimeProps, isFormData: boolean = false): Record<string, string> => {
        const builtHeader: Record<string, string> = {};
        const {addToHeader} = requestConfig;
        if (!!addToHeader) {
            for (let i = 0; i < addToHeader.length; i++) {
                const p = addToHeader[i];
                builtHeader[p.whereToPut] = toHeaderValue(getNestedValue(runtimeProps, p.whatToGet));
            }
        }

        const headers: Record<string, string> = {
            ...builtHeader,
            ...(requestConfig.extraHeader || {}),
        };

        // Don't set Content-Type for FormData - let browser set it with boundary
        if (isFormData) {
            // Remove Content-Type if it exists in extraHeader, browser will set it automatically
            delete headers["Content-Type"];
            delete headers["content-type"];
        }

        return headers;
    }

    const configureToast = (requestConfig: HttpRequest, runtimeProps: RuntimeProps) => {
        const toastConfig: Record<string, string | ((value: unknown) => string | null)> = {}

        if (!!runtimeProps.resolveLanguageKey && runtimeProps?.resolveLanguageKey("axios.start", true)) {
            toastConfig["loading"] = String(runtimeProps.resolveLanguageKey("axios.start.title") || "");
        }
        if (!!runtimeProps.resolveLanguageKey && runtimeProps?.resolveLanguageKey("axios.success", true)) {
            toastConfig["success"] = (data) => {
                let messageToReturn = String(runtimeProps.resolveLanguageKey?.("axios.success.title") || "");
                const responseData = isPlainObject(data) ? data : {};
                if (typeof responseData.message === "string" && responseData.message.trim()) {
                    messageToReturn = responseData.message.trim();
                }
                if (requestConfig.onSuccessMessage) {
                    if (responseData[requestConfig.onSuccessMessage.if] === requestConfig.onSuccessMessage.condition) {
                        messageToReturn = String(runtimeProps.resolveLanguageKey?.(`axios.${requestConfig.onSuccessMessage.message}.title`) || "");
                    }
                }
                return messageToReturn;
            };
        }
        if (!!runtimeProps.resolveLanguageKey && runtimeProps?.resolveLanguageKey("axios.error", true)) {
            toastConfig["error"] = (err) => {
                console.log(err);
                const requestError = (isPlainObject(err) ? err : {}) as Partial<HttpError>;
                let message = String(runtimeProps.resolveLanguageKey?.("axios.error.title") || "");
                let serverError = requestError.message || "";
                console.log(requestError, serverError);
                if (!!requestError.extraMessage) {
                    serverError = serverError + " [ " + requestError.extraMessage + " ]";
                }
                if (!!serverError) {
                    message = (!!message ? (message + ": ") : "") + serverError;
                }
                if (requestError.status === 403) {
                    // return null;
                }
                // if( !!err.content && Array.isArray(err.content) ){
                // err.content.forEach( (errC: any) => {
                //     toast.error(errC.message);
                // })
                // }
                return message;
            }
        }
        return toastConfig;
    }

    useEffect(() => {
        if (!inViewPort || fetchCount <= 0) {
            setLoading(false);
            return;
        }
        if (Date.now() < rateLimitUntil) {
            return; // this instance is rate-limited; effect re-runs when rateLimitUntil is cleared
        }

        const {
            httpRequest: currentHttpRequest,
            requestData: currentRequestData,
            componentHttpRequestLifecycleFunctions: currentLifecycleFunctions,
            props: currentProps,
        } = latestValuesRef.current;

        if (innerFetchCount === fetchCount && currentHttpRequest.alwaysRefreshWhenMovedViewPort) {
            return;
        }

        // cancel any active call before starting a new one
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        let toastResolve: (value: unknown) => void = () => undefined;
        let toastReject: (reason?: unknown) => void = () => undefined;
        const requestToastPromise = new Promise<unknown>((resolve, reject) => {
            toastResolve = resolve;
            toastReject = reject;
        });
        toast.promise(requestToastPromise, configureToast(currentHttpRequest, currentProps));

        const childStart = currentLifecycleFunctions?.start || (() => undefined);
        const childError = currentLifecycleFunctions?.error || (() => undefined);
        const childSuccess = currentLifecycleFunctions?.success || (() => undefined);

        setLoading(true);
        setError(null);
        // setResponse(null);

        childStart();
        const controller = new AbortController();
        abortControllerRef.current = controller;
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;

        setInnerFetchCount(fetchCount);
        const {method, url, data} = currentHttpRequest;
        const effectiveUrl = currentProps?.url ?? url;

        const isFormDataRequest = currentProps.isFormData || (currentRequestData instanceof FormData);
        const axiosUrl = buildUrl(currentHttpRequest, currentProps, effectiveUrl);
        const axiosData = buildBody(currentHttpRequest, currentProps, data, currentRequestData);
        const axiosHeaders = buildHeader(currentHttpRequest, currentProps, isFormDataRequest);

        if (!!currentProps.notifyPost) {
            currentProps.notifyPost({
                url: axiosUrl,
                data: axiosData,
                headers: axiosHeaders,
            });
        }

        apiClient({
            method,
            url: axiosUrl,
            data: axiosData,
            headers: axiosHeaders,
            signal: controller.signal,
            ...(currentHttpRequest.responseType ? {responseType: currentHttpRequest.responseType} : {}),
        })
            .then((res) => {
                if (requestId !== requestIdRef.current) {
                    return;
                }
                const responseData = res.data as TData;
                setResponse(responseData);
                childSuccess(responseData);
                toastResolve(responseData);
                if (!!currentProps.notifySuccess) {
                    currentProps.notifySuccess({
                        data: responseData
                    });
                }
            })
            .catch(async (err: unknown) => {
                if (requestId !== requestIdRef.current) {
                    return;
                }
                const isCanceled = !!(err as { code?: string })?.code && (err as {
                    code?: string
                }).code === "ERR_CANCELED";
                if (isCanceled) {
                    // settle loading toast without surfacing an error message
                    toastReject({status: 403});
                    return;
                }

                const axiosLikeError = err as { response?: { data?: unknown; status?: number } };
                let rawData = axiosLikeError?.response?.data;
                if (rawData instanceof Blob) {
                    try { rawData = JSON.parse(await rawData.text()); } catch { rawData = {}; }
                }
                const responseData = (isPlainObject(rawData) ? rawData : {}) as Partial<HttpError>;
                const status = axiosLikeError?.response?.status;
                setError({...responseData, status} as HttpError);
                if (
                    responseData?.error_code === "rate_limit_exceeded" &&
                    typeof responseData?.availableIn === "number" &&
                    responseData.availableIn > 0
                ) {
                    const until = Date.now() + responseData.availableIn * 1000;
                    setRateLimitUntil(until);
                    if (rateLimitTimeoutRef.current) clearTimeout(rateLimitTimeoutRef.current);
                    rateLimitTimeoutRef.current = setTimeout(() => {
                        setRateLimitUntil(0);
                        rateLimitTimeoutRef.current = null;
                    }, responseData.availableIn * 1000);
                }
                if (!currentProps.hideIfError) {
                    toastReject({...responseData, status});
                }
                childError(err);

                if (!!currentProps.notifyError) {
                    currentProps.notifyError({
                        data: responseData
                    });
                }
            })
            .finally(() => {
                if (requestId !== requestIdRef.current) {
                    return;
                }
                setLoading(false);
            });

    }, [fetchCount, inViewPort, rateLimitUntil]);

    return {loading, error, data: response};
}