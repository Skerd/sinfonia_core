import type {Method, ResponseType} from "axios";

/** Lookup into the runtime props bag: dot-notation (`"company._id"`) or pre-split segments (`["company", "_id"]`). */
export type PropsPath = string | string[];

export type HttpRequestUrlBuilder = {
    whatToGet: PropsPath;
}
export type HttpRequestBodyBuilder = {
    whatToGet: PropsPath;
    /** Body key to write to; `""` spreads an object value into the body. */
    whereToPut: string;
}
export type HttpRequestHeaderBuilder = {
    whatToGet: PropsPath;
    whereToPut: string;
}

export type HttpRequest = {
    method: Method;
    url: string;
    /** Static body defaults; lowest precedence. */
    data?: Record<string, unknown>;
    addToPath?: HttpRequestUrlBuilder[];
    addToBody?: HttpRequestBodyBuilder[];
    addToHeader?: HttpRequestHeaderBuilder[];
    extraHeader?: Record<string, string>;
    /** Swap the success toast to `axios.<message>.title` when `response[if] === condition`. */
    onSuccessMessage?: {
        if: string;
        condition: unknown;
        message: string;
    };
    responseType?: ResponseType;
}

export type RequestPayload = Record<string, unknown> | FormData;

/**
 * Error body as normalised by the hook. Every field is optional: the server contract is not
 * guaranteed (network errors, proxies, blob responses) and `status` is only known when a response arrived.
 */
export type HttpError = {
    error?: string;
    message?: string;
    extraMessage?: string;
    error_code?: string;
    status?: number;
    /** Seconds until a `rate_limit_exceeded` cooldown ends. */
    availableIn?: number;
}

export type HttpRequestState<TData> = {
    loading: boolean;
    error: HttpError | null;
    data: TData | null;
}

export type HttpRequestLifecycleFunctions<TData> = {
    start?: () => void;
    /** Receives the raw thrown value (usually an `AxiosError`); the normalised body is in the hook's `error`. */
    error?: (error: unknown) => void;
    success?: (data: TData) => void;
}

/** Accepts `withLanguage`'s resolver; results are stringified before display. */
export type ResolveLanguageKey = (key: string, returnUndefinedIfNeeded?: boolean) => unknown;

export type HttpRequestDebugInfo = {
    url: string;
    data: RequestPayload;
    headers: Record<string, string>;
}

/**
 * Props bag the hook reads from. Known keys configure the request; any other key is only
 * reachable through `addToPath` / `addToBody` / `addToHeader` lookups, hence the index signature.
 */
export type HttpRequestRuntimeProps<TData = unknown> = Record<string, unknown> & {
    /** Overrides `HttpRequest.url`. */
    url?: string;
    /** Extra multipart fields, only applied when the payload is `FormData`. */
    jsonData?: Record<string, unknown> | null;
    isFormData?: boolean;
    resolveLanguageKey?: ResolveLanguageKey;
    hideIfError?: boolean;
    notifyPost?: (info: HttpRequestDebugInfo) => void;
    notifySuccess?: (result: { data: TData }) => void;
    notifyError?: (result: { data: HttpError }) => void;
};
