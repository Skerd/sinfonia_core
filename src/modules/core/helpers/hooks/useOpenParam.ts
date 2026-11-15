import {useCallback, useEffect, useState} from "react";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import {useSearchParams} from "react-router-dom";

/**
 * The record a list page opens from its URL, `?open=<id>`: the target of a notification's link (D145). Returns the id
 * (or null) and a function that drops the parameter once the opened sheet closes.
 */
export function useOpenParam(): [string | null, () => void] {
    const [searchParams, setSearchParams] = useSearchParams();
    const openId = searchParams.get("open");
    const close = useCallback(() => {
        setSearchParams((current) => {
            const next = new URLSearchParams(current);
            next.delete("open");
            return next;
        }, {replace: true});
    }, [setSearchParams]);
    return [openId, close];
}

/**
 * The record `?open=<id>` names, loaded from `<apiUrl>/single` so a list page opens its sheet from a notification's link
 * (D145). `enabled` false (a page without a sheet) loads nothing; a record the session cannot read drops the parameter.
 */
export function useOpenRecord<T>(apiUrl: string, enabled: boolean): {openId: string | null; record: T | null; close: () => void} {
    const [openId, close] = useOpenParam();
    const [record, setRecord] = useState<T | null>(null);
    useEffect(() => {
        if (!openId || !enabled) {
            setRecord(null);
            return;
        }
        let current = true;
        apiClient.post(`${apiUrl}/single`, {_id: openId})
            .then((response) => { if (current) setRecord(response.data as T); })
            .catch(() => { if (current) close(); });
        return () => { current = false; };
    }, [openId, apiUrl, enabled, close]);
    return {openId, record, close};
}
