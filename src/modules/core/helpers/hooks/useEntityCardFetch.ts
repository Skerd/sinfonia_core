import {useEffect, useMemo, useRef, useState} from "react";
import useHttpRequest, {
    type HttpError,
    type HttpRequest,
} from "@coreModule/helpers/hooks/useHttpRequest.ts";

type UseEntityCardFetchOptions<T> = {
    fetchId?: string;
    singleUrl?: string;
    onSuccess: (data: T) => void;
};

type UseEntityCardFetchResult = {
    loading: boolean;
    error: HttpError | null;
    retry: () => void;
};

/**
 * Single-row load for `EntityCard`: `POST singleUrl` with `{_id: fetchId}`.
 * Does not fire when `fetchId` or `singleUrl` is missing (list cards).
 */
export function useEntityCardFetch<T>({
    fetchId,
    singleUrl,
    onSuccess,
}: UseEntityCardFetchOptions<T>): UseEntityCardFetchResult {
    const enabled = Boolean(fetchId && singleUrl);
    const [fetchCount, setFetchCount] = useState(() => (enabled ? 1 : 0));
    const onSuccessRef = useRef(onSuccess);
    onSuccessRef.current = onSuccess;

    const requestKey = enabled ? `${singleUrl}:${fetchId}` : "";
    const prevKeyRef = useRef(requestKey);

    useEffect(() => {
        if (!enabled) {
            prevKeyRef.current = "";
            setFetchCount(0);
            return;
        }
        if (prevKeyRef.current === requestKey) return;
        const wasIdle = prevKeyRef.current === "";
        prevKeyRef.current = requestKey;
        setFetchCount((n) => (wasIdle && n > 0 ? n : n + 1));
    }, [enabled, requestKey]);

    const httpRequest = useMemo<HttpRequest>(
        () => ({
            url: singleUrl ?? "",
            method: "POST",
            data: {},
        }),
        [singleUrl],
    );

    const requestData = useMemo(
        () => (fetchId ? {_id: fetchId} : {}),
        [fetchId],
    );

    const lifecycle = useMemo(
        () => ({
            success: (data: T) => {
                if (data != null) onSuccessRef.current(data);
            },
        }),
        [],
    );

    const {loading, error} = useHttpRequest<T>(
        httpRequest,
        requestData,
        enabled ? fetchCount : 0,
        true,
        lifecycle,
    );

    return {
        loading: enabled && loading,
        error: enabled ? error : null,
        retry: () => setFetchCount((n) => n + 1),
    };
}
