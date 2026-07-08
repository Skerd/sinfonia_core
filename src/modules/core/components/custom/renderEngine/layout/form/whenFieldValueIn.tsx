import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";

/**
 * Form-only: show `children` when `watchField` matches.
 * - Default: value is one of `whenValues`.
 * - `whenNonEmpty`: value is a non-empty string (after trim); `whenValues` is ignored.
 * When hidden, optional `clearFields` are reset to `undefined`.
 */
export type FormWhenFieldValueInProps = {
    watchField: string;
    whenNonEmpty?: boolean;
    whenValues?: string[];
    clearFields?: string[];
    children?: ReactNode;
};

export function FormWhenFieldValueIn({watchField, whenValues = [], whenNonEmpty, clearFields, children,}: FormWhenFieldValueInProps) {

    const form = useFormContext();
    const { setValue } = form;
    const watched = useWatch({ control: form.control, name: watchField as never });
    const whenSet = useMemo(() => new Set(whenValues), [whenValues]);

    const matches = useMemo(() => {
        if (whenNonEmpty) {
            return String(watched ?? "").trim().length > 0;
        }
        return whenSet.has(String(watched ?? ""));
    }, [watched, whenNonEmpty, whenSet]);

    useEffect(() => {
        if (whenNonEmpty) {
            if (String(watched ?? "").trim().length === 0) {
                for (const path of clearFields ?? []) {
                    setValue(path as never, undefined as never, { shouldValidate: false });
                }
            }
            return;
        }
        const v = String(watched ?? "");
        if (!whenSet.has(v)) {
            for (const path of clearFields ?? []) {
                setValue(path as never, undefined as never, { shouldValidate: false });
            }
        }
    }, [watched, whenNonEmpty, whenSet, clearFields, setValue]);

    if (!matches) {
        return null;
    }
    return <>{children}</>;
}
