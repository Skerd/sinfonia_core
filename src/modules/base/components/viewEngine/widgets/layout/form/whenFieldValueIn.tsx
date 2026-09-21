import type { ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";

/**
 * Form-only: show `children` when `watchField` matches.
 * - Default: value is one of `whenValues`.
 * - `whenNonEmpty`: value is a non-empty string (after trim); `whenValues` is ignored.
 * When hidden, optional `clearFields` are reset to `undefined`, or to
 * `clearFieldValues[path]` when provided for that path.
 * Optional `setFieldsOnMatch`: when the condition **becomes** true (not on initial mount),
 * set the given RHF paths to the given values.
 */
export type FormWhenFieldValueInProps = {
    watchField: string;
    whenNonEmpty?: boolean;
    whenValues?: string[];
    clearFields?: string[];
    /** Optional per-path clear values (defaults to `undefined` when omitted). */
    clearFieldValues?: Record<string, unknown>;
    setFieldsOnMatch?: Record<string, unknown>;
    children?: ReactNode;
};

export function FormWhenFieldValueIn({
    watchField,
    whenValues = [],
    whenNonEmpty,
    clearFields,
    clearFieldValues,
    setFieldsOnMatch,
    children,
}: FormWhenFieldValueInProps) {
    const form = useFormContext();
    const { setValue } = form;
    const watched = useWatch({ control: form.control, name: watchField as never });
    const whenSet = useMemo(() => new Set(whenValues), [whenValues]);
    const prevMatches = useRef<boolean | null>(null);

    const matches = useMemo(() => {
        if (whenNonEmpty) {
            return String(watched ?? "").trim().length > 0;
        }
        return whenSet.has(String(watched ?? ""));
    }, [watched, whenNonEmpty, whenSet]);

    useEffect(() => {
        const clearPath = (path: string) => {
            const next = clearFieldValues && Object.prototype.hasOwnProperty.call(clearFieldValues, path)
                ? clearFieldValues[path]
                : undefined;
            setValue(path as never, next as never, { shouldValidate: false });
        };
        if (whenNonEmpty) {
            if (String(watched ?? "").trim().length === 0) {
                for (const path of clearFields ?? []) clearPath(path);
            }
            return;
        }
        const v = String(watched ?? "");
        if (!whenSet.has(v)) {
            for (const path of clearFields ?? []) clearPath(path);
        }
    }, [watched, whenNonEmpty, whenSet, clearFields, clearFieldValues, setValue]);

    useEffect(() => {
        if (prevMatches.current === null) {
            prevMatches.current = matches;
            return;
        }
        if (matches && !prevMatches.current && setFieldsOnMatch) {
            for (const [path, value] of Object.entries(setFieldsOnMatch)) {
                setValue(path as never, value as never, { shouldValidate: true, shouldDirty: true });
            }
        }
        prevMatches.current = matches;
    }, [matches, setFieldsOnMatch, setValue]);

    if (!matches) {
        return null;
    }
    return <>{children}</>;
}
