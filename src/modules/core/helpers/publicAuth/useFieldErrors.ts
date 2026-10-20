import {useCallback, useState} from "react";

type Issue = {path: PropertyKey[]; message: string};

/** Per-field validation messages for a public form, filled from Zod issues. */
export function useFieldErrors<K extends string>(keys: readonly K[]) {
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<K, string>>>({});

    const clearFieldError = useCallback((key: K) => {
        setFieldErrors((prev) => {
            if (!prev[key]) return prev;
            const next = {...prev};
            delete next[key];
            return next;
        });
    }, []);

    const isKey = (key: PropertyKey): key is K => (keys as readonly PropertyKey[]).includes(key);

    const showIssues = (issues: Issue[]) => {
        const next: Partial<Record<K, string>> = {};
        for (const issue of issues) {
            const key = issue.path[0];
            if (isKey(key)) next[key] = issue.message;
        }
        setFieldErrors(next);
    };

    const clearAll = () => setFieldErrors({});

    return {fieldErrors, clearFieldError, showIssues, clearAll};
}
