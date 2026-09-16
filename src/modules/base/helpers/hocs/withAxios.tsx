import {toast} from "sonner";
import {ComponentType, RefObject, useCallback, useMemo, useRef, useState} from 'react';
import JsonView from "@uiw/react-json-view";
import {replaceFilesWithIds} from "@coreModule/helpers/media/uploadFilesForSubmit.ts";
import {getClientConfig} from "@coreModule/helpers/general";
import useHttpRequest, {
    HttpError,
    HttpRequest,
    HttpRequestDebugInfo,
    HttpRequestLifecycleFunctions,
    HttpRequestRuntimeProps,
    RequestPayload
} from "@baseModule/helpers/hooks/useHttpRequest.ts";
import withLanguage, {WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";

const config = getClientConfig();

/** Language-file key: must stay the original source path even if these components move. */
const WITH_AXIOS_LANGUAGE_PATH = "src/modules/core/helpers/hocs/withAxios.tsx";

type AxiosRequestToastProps = WithLanguageType & {
    url: string;
    headers: Record<string, string>;
    response: unknown;
    requestData?: unknown;
    isError?: boolean;
    httpRequest: string;
};

function AxiosRequestToast({
    url,
    headers,
    response,
    requestData,
    isError = false,
    httpRequest,
    resolveLanguageKey,
}: AxiosRequestToastProps) {
    return (
        <div className="min-w-xs max-w-xs overflow-auto min-h-[20vh] max-h-[20vh]">
            <div className="flex items-center gap-x-1">
                <p className="uppercase font-semibold">[{httpRequest}]</p>
                {
                    isError ?
                    <p className="text-destructive uppercase font-semibold">[{resolveLanguageKey("error")}]</p>
                    :
                    <p className="text-green-600 uppercase font-semibold">[{resolveLanguageKey("success")}]</p>
                }
                <p>
                    {resolveLanguageKey("requestInfo")}:
                </p>
            </div>
            <JsonView
                value={{
                    url: url,
                    headers: headers ?? {},
                    requestData: requestData ?? {},
                    response: response ?? {}
                }}
                collapsed={1}
            />
        </div>
    );
}

const LocalizedAxiosRequestToast = withLanguage(WITH_AXIOS_LANGUAGE_PATH)(AxiosRequestToast);

type InitialLoadErrorProps = WithLanguageType & {
    error: HttpError;
    onRetry: () => void;
};

/** Shown in place of the wrapped component when its first load fails (it has no data to render yet). */
function InitialLoadError({error, onRetry, resolveLanguageKey}: InitialLoadErrorProps) {
    return (
        <SimpleError
            title={resolveLanguageKey("loadFailedTitle")}
            description={resolveLanguageKey("loadFailedDescription")}
            error={error}
            onClick={onRetry}
        />
    );
}

const LocalizedInitialLoadError = withLanguage(WITH_AXIOS_LANGUAGE_PATH)(InitialLoadError);

type DebugToastState = HttpRequestDebugInfo & {
    response: unknown;
    isError: boolean;
};

/**
 * Request/response inspector toasts, gated by `config.debugging`. Returns no callbacks when debugging
 * is off, so production requests skip the bookkeeping entirely.
 */
function useRequestDebugToast(method: string): Pick<HttpRequestRuntimeProps, "notifyPost" | "notifySuccess" | "notifyError"> {
    const toastIdRef = useRef<string | number | undefined>(undefined);
    const stateRef = useRef<DebugToastState>({url: "", data: {}, headers: {}, response: null, isError: false});

    return useMemo(() => {
        const {enableFormPostInfo, enableFormResponseSuccessInfo, enableFormResponseErrorInfo} = config.debugging;

        const show = (patch: Partial<DebugToastState>) => {
            const snapshot = {...stateRef.current, ...patch};
            stateRef.current = snapshot;
            toastIdRef.current = toast(
                <LocalizedAxiosRequestToast
                    key={`${method}-${snapshot.isError}-${snapshot.response == null ? "pending" : "done"}`}
                    url={snapshot.url}
                    headers={snapshot.headers}
                    response={snapshot.response}
                    requestData={snapshot.data}
                    isError={snapshot.isError}
                    httpRequest={method}
                />,
                {id: toastIdRef.current}
            );
        };

        return {
            notifyPost: enableFormPostInfo
                ? (info) => show({...info, response: null, isError: false})
                : undefined,
            notifySuccess: enableFormPostInfo || enableFormResponseSuccessInfo
                ? ({data}) => show({response: data, isError: false})
                : undefined,
            notifyError: enableFormPostInfo || enableFormResponseErrorInfo
                ? ({data}) => show({response: data, isError: true})
                : undefined,
        };
    }, [method]);
}

/**
 * Combines multipart payload and optional JSON metadata.
 * Useful when uploading files while also sending structured values.
 */
export type FormDataWithJson = {
    formData: FormData,
    jsonData?: Record<string, unknown>
}

const isFormDataWithJson = (input: unknown): input is FormDataWithJson => {
    return typeof input === "object" && input !== null && "formData" in input && input.formData instanceof FormData;
}

/**
 * Optional lifecycle callbacks exposed to wrapped components through `innerRef`.
 * The callbacks are invoked by `useHttpRequest` lifecycle events.
 */
export type WithAxiosLifecycleRef<ResponseType> = {
    start?: () => void;
    error?: (error: unknown) => void;
    success?: (data: ResponseType) => void;
}

/**
 * Props injected by `withAxios`. Mutators have stable identities.
 *
 * - `onFilterChange`: replaces the request payload and sends it.
 * - `onFormDataChange`: supports FormData-only, FormData+JSON, or object payloads.
 * - `onPost`: like `onFilterChange`, but first uploads nested `File`s and swaps them for ids.
 */
export type WithAxiosType<ResponseType = unknown, PostType extends Record<string, unknown> = Record<string, unknown>> = {
    onFilterChange: (data: PostType | FormData) => void,
    onFormDataChange: (input: FormData | FormDataWithJson | PostType) => void,
    /** Resolves once the request is sent (after file uploads); rejects if an upload fails. */
    onPost: (data: PostType | FormData) => Promise<void>,
    data: ResponseType | null,
    loading: boolean,
    innerRef: RefObject<WithAxiosLifecycleRef<ResponseType> | null>,
    error: HttpError | null,
    /** Re-sends the current payload. */
    justForceRefresh: () => void
}

type WithAxiosBaseProps<PostType extends Record<string, unknown>> = {
    /** Initial payload, read once on mount. Use `onFilterChange` to change it afterwards. */
    filter?: PostType | FormData;
}

type WithAxiosInjectedProps<ResponseType, PostType extends Record<string, unknown>, DataKey extends string = "data"> =
    Omit<WithAxiosType<ResponseType, PostType>, "data"> & { [K in DataKey]: ResponseType | null } & {
    /** Returns the payload of the latest request (read by `withDebug`). */
    getLatestFormData: () => RequestPayload;
    /** Static request metadata (read by `withDebug`). */
    withAxios: {
        httpRequest: HttpRequest;
        childPost: boolean;
    };
};

type RequestState = {
    payload: RequestPayload;
    /** Extra multipart fields; only set alongside a `FormData` payload. */
    jsonData: Record<string, unknown> | null;
}

function hasNestedFile(value: unknown): boolean {
    if (value instanceof File) return true;
    if (Array.isArray(value)) return value.some(hasNestedFile);
    if (typeof value === "object" && value !== null) {
        return Object.values(value as Record<string, unknown>).some(hasNestedFile);
    }
    return false;
}

/**
 * Higher-order component that wires request state and request mutators into the wrapped component.
 *
 * Behavior:
 * - Starts fetching immediately by default.
 * - When `childPost` is true, waits until one of the mutators triggers a fetch, and renders the
 *   wrapped component right away. Otherwise the wrapped component renders once data has arrived,
 *   and a failed first load shows a retryable error instead.
 * - Every mutator call sends a request; a newer call supersedes an older one still in flight
 *   (including one still uploading files).
 */
const withAxios =
    <ResponseType = unknown, PostType extends Record<string, unknown> = Record<string, unknown>, DataKey extends string = "data">(
        httpRequest: HttpRequest,
        childPost: boolean = false,
        /** Prop name the response is injected under (e.g. `"modelData"` when the component already has a `data` prop). */
        dataPath: DataKey = "data" as DataKey,
    ) =>
        <TProps extends object>(WrappedComponent: ComponentType<TProps & WithAxiosInjectedProps<ResponseType, PostType, DataKey>>): ComponentType<TProps & WithAxiosBaseProps<PostType>> => {

            const withAxiosMeta = {httpRequest, childPost};

            function EnhancedComponent_WithAxios(props: TProps & WithAxiosBaseProps<PostType>) {
                const {filter, ...restProps} = props;

                const forwardedRef = useRef<WithAxiosLifecycleRef<ResponseType> | null>(null);
                const [request, setRequest] = useState<RequestState>(() => ({payload: filter ?? {}, jsonData: null}));
                const [fetchCount, setFetchCount] = useState<number>(childPost ? 0 : 1);
                /** Highest `fetchCount` whose request has actually started; lower means a request is queued. */
                const [startedFetchCount, setStartedFetchCount] = useState<number>(0);
                const [pendingUploads, setPendingUploads] = useState<number>(0);
                const submissionIdRef = useRef(0);

                const debugCallbacks = useRequestDebugToast(httpRequest.method);

                const submit = useCallback((payload: RequestPayload, jsonData: Record<string, unknown> | null = null) => {
                    submissionIdRef.current += 1;
                    setRequest({payload: payload instanceof FormData ? payload : {...payload}, jsonData});
                    setFetchCount((count) => count + 1);
                }, []);

                const onFilterChange = useCallback((newFilter: PostType | FormData) => submit(newFilter), [submit]);

                const onFormDataChange = useCallback((input: FormData | FormDataWithJson | PostType) => {
                    if (isFormDataWithJson(input)) {
                        submit(input.formData, input.jsonData ?? null);
                    } else {
                        submit(input);
                    }
                }, [submit]);

                const onPost = useCallback(async (data: PostType | FormData) => {
                    if (data instanceof FormData || !hasNestedFile(data)) {
                        submit(data);
                        return;
                    }
                    const submissionId = ++submissionIdRef.current;
                    setPendingUploads((count) => count + 1);
                    try {
                        const cleanData = await replaceFilesWithIds(data);
                        // A later submission won while files were uploading; drop this one.
                        if (submissionId === submissionIdRef.current) {
                            submit(cleanData);
                        }
                    } finally {
                        setPendingUploads((count) => count - 1);
                    }
                }, [submit]);

                const justForceRefresh = useCallback(() => setFetchCount((count) => count + 1), []);

                const getLatestFormData = useCallback(() => request.payload, [request.payload]);

                const lifecycle: HttpRequestLifecycleFunctions<ResponseType> = {
                    start: () => {
                        setStartedFetchCount((started) => Math.max(started, fetchCount));
                        forwardedRef.current?.start?.();
                    },
                    error: (requestError) => forwardedRef.current?.error?.(requestError),
                    success: (responseData) => forwardedRef.current?.success?.(responseData),
                };

                const {loading: httpLoading, error, data} = useHttpRequest<ResponseType>(
                    httpRequest,
                    request.payload,
                    fetchCount,
                    true,
                    lifecycle,
                    {
                        ...restProps,
                        ...debugCallbacks,
                        isFormData: request.payload instanceof FormData,
                        jsonData: request.jsonData,
                    }
                );

                // Covers the gap between a mutator call and the hook starting the request (uploads, effect timing, rate-limit deferral).
                const loading = httpLoading || pendingUploads > 0 || fetchCount > startedFetchCount;

                if (!data && !childPost) {
                    return error && !loading
                        ? <LocalizedInitialLoadError error={error} onRetry={justForceRefresh}/>
                        : null;
                }

                // TS cannot type a computed generic key, so only this entry is asserted.
                const responseProp = {[dataPath]: data} as { [K in DataKey]: ResponseType | null };
                const injectedProps: WithAxiosInjectedProps<ResponseType, PostType, DataKey> = {
                    ...responseProp,
                    onFilterChange,
                    onFormDataChange,
                    onPost,
                    justForceRefresh,
                    getLatestFormData,
                    loading,
                    error,
                    innerRef: forwardedRef,
                    withAxios: withAxiosMeta,
                };

                return <WrappedComponent {...(restProps as TProps)} {...injectedProps}/>;
            }

            EnhancedComponent_WithAxios.displayName = `withAxios(${WrappedComponent.displayName ?? WrappedComponent.name ?? "Component"})`;

            return EnhancedComponent_WithAxios;
        };

export default withAxios;
