import {renderHook} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi, type MockInstance} from "vitest";
import {toast} from "sonner";
import {handleError, isAbortError, normalizeError} from "@baseModule/helpers/general/errors.ts";
import useErrorHandler from "@baseModule/helpers/hooks/useErrorHandler.ts";

vi.mock("sonner", () => ({toast: {error: vi.fn()}}));

/** Mirrors what axios rejects with: an Error carrying `isAxiosError`, `code` and `response`. */
const axiosError = (response?: {status?: number; data?: unknown}, code = "ERR_BAD_REQUEST") =>
    Object.assign(new Error("Request failed with status code 400"), {isAxiosError: true, code, response});

describe("normalizeError", () => {
    it("keeps a native Error and its message", () => {
        const error = new Error("boom");
        expect(normalizeError(error)).toMatchObject({error, message: "boom", displayMessage: "boom"});
    });

    it("wraps thrown strings and message-shaped objects", () => {
        expect(normalizeError("plain")).toMatchObject({message: "plain", displayMessage: "plain"});
        expect(normalizeError("plain").error).toBeInstanceOf(Error);
        expect(normalizeError({message: "shaped"})).toMatchObject({message: "shaped", displayMessage: "shaped"});
    });

    it("prefers the server's message, then its error field, and carries status and error_code", () => {
        const withMessage = axiosError({status: 422, data: {message: "Coupon expired", error: "invalid", error_code: "coupon_expired"}});
        expect(normalizeError(withMessage)).toMatchObject({
            error: withMessage,
            message: "Coupon expired",
            displayMessage: "Coupon expired",
            status: 422,
            code: "coupon_expired",
        });

        expect(normalizeError(axiosError({status: 400, data: {error: "invalid"}})).displayMessage).toBe("invalid");
    });

    it("does not offer axios' generic message for display", () => {
        const normalized = normalizeError(axiosError({status: 500, data: "<html>"}));
        expect(normalized.displayMessage).toBeUndefined();
        expect(normalized.message).toBe("Request failed with status code 400");
        expect(normalized.code).toBe("ERR_BAD_REQUEST");

        expect(normalizeError(axiosError(undefined, "ERR_NETWORK")).displayMessage).toBeUndefined();
    });

    it("falls back for unknown values and empty messages", () => {
        for (const value of [undefined, null, 42, {}, new Error(""), ""]) {
            const normalized = normalizeError(value);
            expect(normalized.message).toBe("Unexpected error");
            expect(normalized.displayMessage).toBeUndefined();
        }
    });
});

describe("isAbortError", () => {
    it.each([
        ["an aborted signal", new Error("x"), AbortSignal.abort()],
        ["axios ERR_CANCELED", {code: "ERR_CANCELED"}, undefined],
        ["axios CanceledError", Object.assign(new Error("canceled"), {name: "CanceledError"}), undefined],
        ["a DOM AbortError", new DOMException("Aborted", "AbortError"), undefined],
    ])("recognises %s", (_label, error, signal) => {
        expect(isAbortError(error, signal)).toBe(true);
    });

    it("rejects ordinary errors and a live signal", () => {
        expect(isAbortError(new Error("boom"), new AbortController().signal)).toBe(false);
        expect(isAbortError(axiosError({status: 400}))).toBe(false);
        expect(isAbortError(undefined)).toBe(false);
    });
});

describe("handleError", () => {
    let consoleError: MockInstance<typeof console.error>;

    beforeEach(() => {
        consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    });
    afterEach(() => {
        vi.clearAllMocks();
        consoleError.mockRestore();
    });

    it("logs with the context prefix and does not toast by default", () => {
        const original = new Error("boom");
        const result = handleError(original, {context: "Users"});

        expect(result?.error).toBe(original);
        expect(consoleError).toHaveBeenCalledWith("[Users] boom", {error: original, originalError: original});
        expect(toast.error).not.toHaveBeenCalled();
    });

    it("toasts the server message when there is one, otherwise the fallback", () => {
        handleError(axiosError({data: {message: "Coupon expired"}}), {showToast: true, fallbackMessage: "Could not apply discount"});
        expect(toast.error).toHaveBeenLastCalledWith("Coupon expired");

        handleError(axiosError({data: {}}), {showToast: true, fallbackMessage: "Could not apply discount"});
        expect(toast.error).toHaveBeenLastCalledWith("Could not apply discount");
    });

    it("always toasts `message` when given", () => {
        handleError(axiosError({data: {message: "Server text"}}), {showToast: true, message: "Fixed text", fallbackMessage: "Unused"});
        expect(toast.error).toHaveBeenLastCalledWith("Fixed text");
    });

    it("toasts the raw message when there is neither a display message nor a fallback", () => {
        handleError(axiosError({data: {}}), {showToast: true});
        expect(toast.error).toHaveBeenLastCalledWith("Request failed with status code 400");
    });

    it("forwards the normalized error to reportError with the context", () => {
        const reportError = vi.fn();
        const result = handleError("boom", {context: "Checkout", reportError});
        expect(reportError).toHaveBeenCalledWith(result!.error, "Checkout");
    });

    it("ignores aborts silently by default, but not when ignoreAbort is false", () => {
        const reportError = vi.fn();
        const canceled = {code: "ERR_CANCELED", message: "canceled"};

        expect(handleError(canceled, {showToast: true, reportError})).toBeNull();
        expect(consoleError).not.toHaveBeenCalled();
        expect(toast.error).not.toHaveBeenCalled();
        expect(reportError).not.toHaveBeenCalled();

        expect(handleError(canceled, {ignoreAbort: false})?.message).toBe("canceled");
        expect(consoleError).toHaveBeenCalledTimes(1);
    });

    it("treats an error as aborted when the passed signal is aborted", () => {
        expect(handleError(new Error("late"), {signal: AbortSignal.abort()})).toBeNull();
        expect(consoleError).not.toHaveBeenCalled();
    });
});

describe("useErrorHandler", () => {
    let consoleError: MockInstance<typeof console.error>;

    beforeEach(() => {
        consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    });
    afterEach(() => {
        vi.clearAllMocks();
        consoleError.mockRestore();
    });

    it("returns a stable function even with inline options, using the latest defaults", () => {
        const {result, rerender} = renderHook(({context}) => useErrorHandler({context}), {
            initialProps: {context: "First"},
        });
        const first = result.current;

        rerender({context: "Second"});
        expect(result.current).toBe(first);

        result.current(new Error("boom"));
        expect(consoleError).toHaveBeenCalledWith("[Second] boom", expect.anything());
    });

    it("lets per-call options override the defaults", () => {
        const {result} = renderHook(() => useErrorHandler({context: "Cart", showToast: false}));

        result.current(new Error("boom"), {showToast: true, context: "Cart:coupon"});
        expect(toast.error).toHaveBeenCalledWith("boom");
        expect(consoleError).toHaveBeenCalledWith("[Cart:coupon] boom", expect.anything());
    });
});
