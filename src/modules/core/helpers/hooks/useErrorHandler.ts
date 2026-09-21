import {useCallback, useRef} from "react";
import {handleError, type ErrorHandlerOptions} from "@coreModule/helpers/general/errors.ts";

export type {ErrorHandlerOptions, NormalizedError, ReportErrorFn} from "@coreModule/helpers/general/errors.ts";

/**
 * Component-friendly wrapper around {@link handleError}.
 *
 * `defaultOptions` are merged under each call's options (per-call wins). The returned function
 * keeps a stable identity even when `defaultOptions` is an inline object, so it is safe in
 * effect dependency arrays without `useMemo`.
 *
 * Example:
 * `const handleError = useErrorHandler({context: "Checkout", showToast: true});`
 * `catch (err) { handleError(err, {fallbackMessage: "Could not confirm order"}); }`
 */
export default function useErrorHandler(defaultOptions: ErrorHandlerOptions = {}) {
    const defaultsRef = useRef(defaultOptions);
    defaultsRef.current = defaultOptions;

    return useCallback(
        (error: unknown, options: ErrorHandlerOptions = {}) => handleError(error, {...defaultsRef.current, ...options}),
        [],
    );
}
