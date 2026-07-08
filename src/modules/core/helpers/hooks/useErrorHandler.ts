import {useCallback} from "react";
import {toast} from "sonner";

export type ReportErrorFn = (error: unknown, context?: string) => void;

export type ErrorHandlerOptions = {
    context?: string;
    showToast?: boolean;
    fallbackMessage?: string;
    reportError?: ReportErrorFn;
}

const DEFAULT_FALLBACK_MESSAGE = "Unexpected error";

const hasMessage = (value: unknown): value is {message: string} =>
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof (value as {message?: unknown}).message === "string";

/**
 * Normalizes unknown thrown values into `Error`.
 * Covers:
 * - native `Error`
 * - thrown strings
 * - object-shaped errors with a string `message` field
 */
const toError = (error: unknown): Error => {
    if (error instanceof Error) return error;
    if (typeof error === "string") return new Error(error);
    if (hasMessage(error)) return new Error(error.message);
    return new Error(DEFAULT_FALLBACK_MESSAGE);
};

/**
 * Centralized, typed error handler for components/hooks.
 *
 * Behavior:
 * - merges `defaultOptions` with per-call options (per-call wins)
 * - always returns a normalized `Error`
 * - logs with optional context prefix
 * - can show a toast and/or forward to external reporting
 *
 * Example:
 * `const handleError = useErrorHandler({ context: "Users", showToast: true });`
 * `catch (err) { handleError(err, { fallbackMessage: "Unable to load users" }); }`
 */
export default function useErrorHandler(defaultOptions: ErrorHandlerOptions = {}) {
    return useCallback((error: unknown, options: ErrorHandlerOptions = {}) => {
        const merged = {...defaultOptions, ...options};
        const normalizedError = toError(error);
        const contextPrefix = merged.context ? `[${merged.context}] ` : "";
        const message = normalizedError.message || merged.fallbackMessage || DEFAULT_FALLBACK_MESSAGE;

        console.error(`${contextPrefix}${message}`, {normalizedError, originalError: error});

        if (merged.showToast) {
            toast.error(merged.fallbackMessage || message);
        }
        if (merged.reportError) {
            merged.reportError(normalizedError, merged.context);
        }

        return normalizedError;
    }, [defaultOptions]);
}
