import type {FormWidgetExtra} from "../types.ts";

/**
 * What a cleared input writes: `null` on edit forms (so PATCH clears the field) and
 * `undefined` on create forms (so the key is simply absent).
 */
export function clearedValue(extra: FormWidgetExtra | undefined): null | undefined {
    return extra?.editMode ? null : undefined;
}

/** `v`, or {@link clearedValue} when `v` is empty (`""`, `null`, `undefined`). */
export function orCleared<T>(v: T | "" | null | undefined, extra: FormWidgetExtra | undefined): T | null | undefined {
    return v === "" || v == null ? clearedValue(extra) : v;
}
