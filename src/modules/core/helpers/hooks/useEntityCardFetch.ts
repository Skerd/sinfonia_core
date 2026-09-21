import {useCallback, useMemo, useRef, useState} from "react";
import useHttpRequest, {
    type HttpError,
    type HttpRequest,
} from "@coreModule/helpers/hooks/useHttpRequest.ts";

export type UseEntityCardFetchOptions<T> = {
    /** Id of the row to load. No request without it (list cards pass their row instead). */
    fetchId?: string;
    /** `POST` endpoint returning the single row for `{_id: fetchId}`. */
    singleUrl?: string;
    /** Receives the loaded row. Not called for empty responses or for responses to an older id. */
    onSuccess: (data: T) => void;
};

export type UseEntityCardFetchResult = {
    /** The current id's request has not settled yet. */
    loading: boolean;
    /** The current id's request failed; never an error left over from a previous id. */
    error: HttpError | null;
    /** Loads the current id again. Stable; does nothing while fetching is disabled. */
    retry: () => void;
};

/**
 * Single-row load for `EntityCard`: `POST singleUrl` with `{_id: fetchId}`.
 *
 * - Does not fire when `fetchId` or `singleUrl` is missing (list cards).
 * - Loads once per id (and again after `retry`, or when fetching turns back on).
 * - A response that arrives after the id changed, or after fetching was turned off, is ignored.
 */
export function useEntityCardFetch<T>({
    fetchId,
    singleUrl,
    onSuccess,
}: UseEntityCardFetchOptions<T>): UseEntityCardFetchResult {
    const enabled = Boolean(fetchId && singleUrl);
    const requestKey = enabled ? `${singleUrl}|${fetchId}` : "";

    /* `useHttpRequest` fetches whenever the count it receives changes while above 0: bump it once per new key and per retry. */
    const [trigger, setTrigger] = useState(() => ({key: requestKey, count: enabled ? 1 : 0}));
    let current = trigger;
    if (trigger.key !== requestKey) {
        current = {key: requestKey, count: enabled ? trigger.count + 1 : trigger.count};
        setTrigger(current);
    }

    const onSuccessRef = useRef(onSuccess);
    onSuccessRef.current = onSuccess;
    const requestKeyRef = useRef(requestKey);
    requestKeyRef.current = requestKey;

    /** Key of the request `useHttpRequest` last started: a ref to guard late callbacks, state to render from. */
    const startedKeyRef = useRef<string | null>(null);
    const [startedKey, setStartedKey] = useState<string | null>(null);

    const httpRequest = useMemo<HttpRequest>(
        () => ({url: singleUrl ?? "", method: "POST", data: {}}),
        [singleUrl],
    );
    const requestData = useMemo(() => (fetchId ? {_id: fetchId} : {}), [fetchId]);

    const lifecycle = useMemo(
        () => ({
            start: () => {
                startedKeyRef.current = requestKeyRef.current;
                setStartedKey(requestKeyRef.current);
            },
            success: (data: T) => {
                if (startedKeyRef.current !== requestKeyRef.current) return;
                if (data != null) onSuccessRef.current(data);
            },
        }),
        [],
    );

    const {loading, error} = useHttpRequest<T>(
        httpRequest,
        requestData,
        enabled ? current.count : 0,
        true,
        lifecycle,
    );

    const retry = useCallback(() => {
        if (!requestKeyRef.current) return;
        setTrigger((previous) => ({...previous, count: previous.count + 1}));
    }, []);

    const settled = startedKey === requestKey;
    return {
        loading: enabled && (loading || !settled),
        error: enabled && settled ? error : null,
        retry,
    };
}
