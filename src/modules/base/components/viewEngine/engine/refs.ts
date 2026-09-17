import {isValidElement} from "react";
import {findFromObject} from "@baseModule/helpers/general/objectPath.ts";

export function resolvePath(obj: Record<string, any>, path: string): any {
    return findFromObject(obj, path);
}

/**
 * Returns a copy of `record` with `value` written at a dotted path. Objects along the path
 * are copied; a missing or non-object step becomes `{}`.
 */
export function setAtPath(record: Record<string, any>, dotPath: string, value: unknown): Record<string, any> {
    const segments = dotPath.split(".").filter((s) => s.length > 0);
    if (segments.length === 0) {
        return record;
    }
    const root = {...record};
    let node: Record<string, any> = root;
    for (const key of segments.slice(0, -1)) {
        const nested = node[key];
        const branch = nested != null && typeof nested === "object" && !Array.isArray(nested) ? {...nested} : {};
        node[key] = branch;
        node = branch;
    }
    node[segments[segments.length - 1]!] = value;
    return root;
}

/**
 * A reference as the API sends it: a populated sub-document or a raw ObjectId string.
 * `resolvePath(data, "reservation._id")` is wrong for the string case (no `_id` on a primitive).
 *
 * `fetchId` is the id as a string (an ObjectId instance is stringified), or `undefined` when
 * the object carries no id.
 */
export function normalizeObjectIdRef<T extends {_id: string}>(
    raw: unknown,
): {stub: T; fetchId: string | undefined} | null {
    if (raw == null || raw === "") return null;
    if (typeof raw === "string") {
        return {stub: {_id: raw} as T, fetchId: raw};
    }
    if (typeof raw === "object") {
        const _id = (raw as {_id?: unknown})._id;
        if (_id != null && _id !== "") {
            const fetchId = typeof _id === "string" ? _id : String(_id);
            return {stub: raw as T, fetchId};
        }
        return {stub: raw as T, fetchId: undefined};
    }
    return null;
}

/** True when a ref stub carries more than its id (so it can seed a linked sheet as-is). */
function isPopulated(stub: unknown): stub is Record<string, unknown> {
    return stub != null && typeof stub === "object" && !Array.isArray(stub) && Object.keys(stub).length > 1;
}

/**
 * Initial `data` for a linked sheet while its `/single` request loads.
 *
 * A populated ref is used as-is. Otherwise the sheet gets `{_id}` plus the card's display text
 * under `valueField` (default `name`) — only for plain text, never React nodes or structured values.
 */
export function bootstrapLinkedSheetData(
    linkedId: string,
    rawRef: unknown,
    displayValue: unknown,
    valueField?: string,
): Record<string, unknown> {
    const stub = normalizeObjectIdRef(rawRef)?.stub;
    if (isPopulated(stub)) {
        return {...stub};
    }
    const base: Record<string, unknown> = {_id: linkedId};
    if (
        displayValue != null &&
        !isValidElement(displayValue) &&
        (typeof displayValue === "string" || typeof displayValue === "number" || typeof displayValue === "boolean")
    ) {
        base[valueField && valueField.length > 0 ? valueField : "name"] = String(displayValue);
    }
    return base;
}
