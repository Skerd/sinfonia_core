import {toast} from "sonner";
import {isPlainObject} from "@baseModule/helpers/general/httpRequestBuilders.ts";

export type ReportErrorFn = (error: Error, context?: string) => void;

export type ErrorHandlerOptions = {
    /** Prefix for the console line, e.g. `"Checkout"` → `[Checkout] …`. */
    context?: string;
    /** Show a `toast.error`. Default `false`. */
    showToast?: boolean;
    /** Toast text used regardless of the error (fixed or translated copy). */
    message?: string;
    /** Toast text used only when the error carries no message worth showing to a user. */
    fallbackMessage?: string;
    /** Treat aborted/canceled work as a non-error: nothing is logged, toasted or reported. Default `true`. */
    ignoreAbort?: boolean;
    /** Signal of the work that failed; an aborted signal marks the error as an abort. */
    signal?: AbortSignal | null;
    /** Extra data added to the console payload (e.g. a React component stack). */
    details?: Record<string, unknown>;
    /** Forwards the normalized error to an external reporter. */
    reportError?: ReportErrorFn;
};

export type NormalizedError = {
    /** The original `Error` when one was thrown, otherwise a new one carrying {@link message}. */
    error: Error;
    /** Best available description; never empty. */
    message: string;
    /**
     * A message fit to show a user: the server's `message`/`error`, or the thrown message for
     * non-HTTP errors. `undefined` when only a generic transport message exists
     * (e.g. axios' "Request failed with status code 400" or "Network Error").
     */
    displayMessage?: string;
    /** HTTP status, when a response arrived. */
    status?: number;
    /** Server `error_code`, else the error's own `code` (e.g. axios `ERR_NETWORK`). */
    code?: string;
};

const DEFAULT_MESSAGE = "Unexpected error";

const nonEmpty = (value: unknown): string | undefined =>
    typeof value === "string" && value.trim() !== "" ? value : undefined;

/** True for aborted/canceled work: an aborted `signal`, axios cancellation, or a DOM `AbortError`. */
export function isAbortError(error: unknown, signal?: AbortSignal | null): boolean {
    if (signal?.aborted) return true;
    if (typeof error !== "object" || error === null) return false;
    const {code, name} = error as {code?: unknown; name?: unknown};
    return code === "ERR_CANCELED" || name === "CanceledError" || name === "AbortError";
}

/**
 * Turns any thrown value into a {@link NormalizedError}.
 * Reads axios-shaped errors structurally (interceptors may reject with plain objects), like
 * `readErrorBody` in `useHttpRequest.ts`, but synchronously — blob error bodies are not parsed.
 */
export function normalizeError(error: unknown): NormalizedError {
    if (typeof error === "string") {
        const message = nonEmpty(error);
        return {error: new Error(message ?? DEFAULT_MESSAGE), message: message ?? DEFAULT_MESSAGE, displayMessage: message};
    }
    if (typeof error !== "object" || error === null) {
        return {error: new Error(DEFAULT_MESSAGE), message: DEFAULT_MESSAGE};
    }

    const shape = error as {message?: unknown; code?: unknown; isAxiosError?: unknown; response?: unknown};
    const response = isPlainObject(shape.response) ? shape.response : undefined;
    const body = isPlainObject(response?.data) ? response.data : {};
    const serverMessage = nonEmpty(body.message) ?? nonEmpty(body.error);
    const ownMessage = nonEmpty(shape.message);
    const isHttpError = shape.isAxiosError === true || response !== undefined;
    const message = serverMessage ?? ownMessage ?? DEFAULT_MESSAGE;

    return {
        error: error instanceof Error ? error : new Error(message),
        message,
        displayMessage: serverMessage ?? (isHttpError ? undefined : ownMessage),
        status: typeof response?.status === "number" ? response.status : undefined,
        code: nonEmpty(body.error_code) ?? nonEmpty(shape.code),
    };
}

/**
 * Central error handling for anything that catches: logs `[context] message`, optionally shows a
 * toast and forwards to `reportError`. Aborts are ignored by default and return `null`;
 * otherwise returns the {@link NormalizedError}, so callers can reuse its message.
 *
 * Toast text: `message` → the error's `displayMessage` → `fallbackMessage` → the raw message.
 */
export function handleError(error: unknown, options: ErrorHandlerOptions = {}): NormalizedError | null {
    const {context, showToast = false, message, fallbackMessage, ignoreAbort = true, signal, details, reportError} = options;
    if (ignoreAbort && isAbortError(error, signal)) return null;

    const normalized = normalizeError(error);
    console.error(`${context ? `[${context}] ` : ""}${normalized.message}`, {
        error: normalized.error,
        originalError: error,
        ...details,
    });

    if (showToast) {
        toast.error(message ?? normalized.displayMessage ?? fallbackMessage ?? normalized.message);
    }
    reportError?.(normalized.error, context);

    return normalized;
}
