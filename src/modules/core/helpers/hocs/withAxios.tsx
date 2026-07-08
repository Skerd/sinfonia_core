import {toast} from "sonner";
import {ComponentType, RefObject, useEffect, useRef, useState} from 'react';
import {replaceFilesWithIds} from "@coreModule/helpers/media/uploadFilesForSubmit.ts";
import useIsInViewport from "@coreModule/helpers/hooks/useIsInViewPort.ts";
import {getClientConfig} from "@coreModule/helpers/general";
import useHttpRequest, {
    HttpError,
    HttpRequest,
    HttpRequestLifecycleFunctions,
    RequestPayload
} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import AxiosRequestToast from "@coreModule/components/hooks/axiosRequestToast.tsx";

const config = getClientConfig();

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
 * Props injected by `withAxios`.
 *
 * - `onFilterChange`: updates request payload and triggers a new request.
 * - `onFormDataChange`: supports FormData-only, FormData+JSON, or object payloads.
 * - `viewPortRef`: attach to an element when `onlyCallWhenInViewPort` is enabled.
 */
export type WithAxiosType<ResponseType = unknown, PostType extends Record<string, unknown> = Record<string, unknown>> = {
    onFilterChange: (data: PostType | FormData) => void,
    onFormDataChange: (input: FormData | FormDataWithJson | PostType) => void,
    onPost: (data: PostType | FormData) => void,
    data: ResponseType | null,
    loading: boolean,
    innerRef: RefObject<WithAxiosLifecycleRef<ResponseType> | null>,
    viewPortRef: RefObject<HTMLDivElement>,
    error: HttpError | null
}

type WithAxiosBaseProps<PostType extends Record<string, unknown>> = {
    filter?: PostType | FormData;
}

type WithAxiosInjectedProps<ResponseType, PostType extends Record<string, unknown>> = WithAxiosType<ResponseType, PostType> & {
    /** Increments internal request counter to force refetch. */
    justForceRefresh: () => void;
    /** Returns the latest payload that will be sent by `useHttpRequest`. */
    getLatestFormData: () => RequestPayload;
    /** Exposes static request metadata for advanced consumers. */
    withAxios: {
        httpRequest: HttpRequest;
        childPost: boolean;
    };
};

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
 * - When `childPost` is true, waits until one of the mutators triggers a fetch.
 * - Re-fetches when payload changes or impersonated user changes.
 * - Can defer requests until the observed element is in viewport.
 */
const withAxios =
    <ResponseType = unknown, PostType extends Record<string, unknown> = Record<string, unknown>>(httpRequest: HttpRequest, childPost: boolean = false, dataPath = "data") =>
        <TProps extends object>(WrappedComponent: ComponentType<TProps & WithAxiosInjectedProps<ResponseType, PostType>>): ComponentType<TProps & WithAxiosBaseProps<PostType>> => {

            function EnhancedComponent_WithAxios(props: TProps & WithAxiosBaseProps<PostType>) {
                const {filter: _filter, ...restProps} = props;

                const forwardedRef = useRef<WithAxiosLifecycleRef<ResponseType> | null>(null);
                const viewportRef = useRef<HTMLDivElement>(null);
                const [fetchCount, setFetchCount] = useState<number>(childPost ? -1 : 0);
                const initialFilter: RequestPayload = props.filter instanceof FormData ? props.filter : (props.filter ?? {});
                const [requestData, setRequestData] = useState<RequestPayload>(initialFilter);
                const [jsonData, setJsonData] = useState<Record<string, unknown> | null>(null);
                const [isFormData, setIsFormData] = useState<boolean>(initialFilter instanceof FormData);
                const toastIdRef = useRef<string | number | undefined>(undefined);
                const toastStateRef = useRef<{
                    url: string;
                    data: RequestPayload | null;
                    headers: Record<string, string>;
                    response: unknown;
                    isError: boolean;
                    httpRequest: string;
                }>({
                    url: "",
                    data: null,
                    headers: {},
                    response: null,
                    isError: false,
                    httpRequest: ""
                });

                // const [testLoading, setTestLoading] = useState<boolean>(false);

                const isInViewPort = useIsInViewport(viewportRef);
                const inViewPort = !!httpRequest.onlyCallWhenInViewPort ? isInViewPort : true;

                function updateRequestToast() {
                    toastIdRef.current = toast(
                        <AxiosRequestToast
                            url={toastStateRef.current.url}
                            headers={toastStateRef.current.headers}
                            response={toastStateRef.current.response}
                            requestData={toastStateRef.current.data}
                            isError={toastStateRef.current.isError}
                            httpRequest={toastStateRef.current.httpRequest}
                        />,
                        {id: toastIdRef.current}
                    );
                }

                function notifyPost(data: { url: string; data: RequestPayload; headers: Record<string, string> }) {
                    if (config.debugging.enableFormPostInfo) {
                        toastStateRef.current = {
                            ...toastStateRef.current,
                            url: data.url,
                            data: data.data,
                            headers: data.headers,
                            response: null,
                            isError: false,
                            httpRequest: httpRequest.method
                        };
                        updateRequestToast();
                    }
                }

                function notifySuccess(data: { data: ResponseType | null }) {
                    if (config.debugging.enableFormResponseSuccessInfo) {
                        toastStateRef.current = {
                            ...toastStateRef.current,
                            response: data.data,
                            isError: false
                        };
                        updateRequestToast();
                    }
                }

                function notifyError(data: { data: unknown }) {
                    if (config.debugging.enableFormResponseErrorInfo) {
                        toastStateRef.current = {
                            ...toastStateRef.current,
                            response: data.data,
                            isError: true
                        };
                        console.log(data);
                        updateRequestToast();
                    }
                }

                const {
                    loading,
                    error,
                    data
                } = useHttpRequest(
                    httpRequest,
                    requestData,
                    fetchCount,
                    inViewPort,
                    {
                        start: () => forwardedRef.current?.start?.(),
                        error: (requestError) => forwardedRef.current?.error?.(requestError),
                        success: (responseData) => forwardedRef.current?.success?.(responseData),
                    } satisfies HttpRequestLifecycleFunctions<ResponseType>,
                    {
                        ...restProps,
                        notifyPost,
                        notifySuccess,
                        notifyError,
                        isFormData,
                        jsonData
                    }
                );

                useEffect(() => {
                    setFetchCount((currentFetchCount) => currentFetchCount + 1);
                }, [requestData]);

                return (
                    <>
                        {/*<div className="relative">*/}
                        {/*<div*/}
                        {/*    className={clsx("absolute right-0 top-0 size-4 hover:cursor-pointer", {"bg-red-400": testLoading, "bg-green-400": !testLoading})}*/}
                        {/*    style={{zIndex: 99999}}*/}
                        {/*    onClick={() => {setTestLoading(!testLoading);}}*/}
                        {/*></div>*/}

                        {
                            (!!data || childPost) &&
                            <WrappedComponent
                                {...({
                                    ...(restProps as TProps),
                                    onFilterChange: (newFilter: PostType | FormData) => {
                                        // Check if newFilter is FormData
                                        if (newFilter instanceof FormData) {
                                            setIsFormData(true);
                                            setRequestData(newFilter);
                                            setJsonData(null);
                                        } else {
                                            setIsFormData(false);
                                            setRequestData({...newFilter});
                                            setJsonData(null);
                                        }
                                    },
                                    justForceRefresh: () => {
                                        setFetchCount((currentFetchCount) => currentFetchCount + 1);
                                    },
                                    onPost: async (data: PostType | FormData) => {
                                        if (data instanceof FormData) {
                                            setIsFormData(true);
                                            setRequestData(data);
                                            setJsonData(null);
                                            return;
                                        }
                                        const cleanData = hasNestedFile(data)
                                            ? await replaceFilesWithIds(data as Record<string, unknown>)
                                            : data;
                                        setIsFormData(false);
                                        setRequestData({...cleanData});
                                        setJsonData(null);
                                    },
                                    onFormDataChange: (input: FormData | FormDataWithJson | PostType) => {
                                        setIsFormData(true);
                                        // Check if input is FormDataWithJson object
                                        if (isFormDataWithJson(input)) {
                                            setRequestData(input.formData);
                                            setJsonData(input.jsonData || null);
                                        } else if (input instanceof FormData) {
                                            // Just FormData, no JSON
                                            setRequestData(input);
                                            setJsonData(null);
                                        } else {
                                            // Fallback: treat as regular object
                                            setIsFormData(false);
                                            setRequestData({...input});
                                            setJsonData(null);
                                        }
                                    },
                                    loading,
                                    innerRef: forwardedRef,
                                    viewPortRef: viewportRef,
                                    [dataPath]: data,
                                    error,
                                    getLatestFormData: () => requestData,
                                    withAxios: {
                                        httpRequest,
                                        childPost
                                    }
                                } as TProps & WithAxiosInjectedProps<ResponseType, PostType>)}
                            />
                        }
                        {/*</div>*/}
                    </>
                )
            }

            return EnhancedComponent_WithAxios;
        };

export default withAxios;
