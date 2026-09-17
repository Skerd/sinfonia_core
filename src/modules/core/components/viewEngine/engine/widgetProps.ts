import type {WidgetProps} from "./types.ts";

/**
 * Typed readers for `widgetProps` / `node.props`. View configs are JSON from the server, so
 * every value is checked at the point of use; these keep that check to one call.
 */

/** Any string, including `""`. */
export function wpString(wp: WidgetProps, key: string): string | undefined {
    const v = wp[key];
    return typeof v === "string" ? v : undefined;
}

/** A string with at least one character. */
export function wpText(wp: WidgetProps, key: string): string | undefined {
    const v = wp[key];
    return typeof v === "string" && v.length > 0 ? v : undefined;
}

/** A registry token (`"#Something"`). */
export function wpToken(wp: WidgetProps, key: string): string | undefined {
    const v = wp[key];
    return typeof v === "string" && v.startsWith("#") ? v : undefined;
}

export function wpNumber(wp: WidgetProps, key: string): number | undefined {
    const v = wp[key];
    return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/** A whole number ≥ `min` (fractions are floored). */
export function wpCount(wp: WidgetProps, key: string, min = 1): number | undefined {
    const v = wpNumber(wp, key);
    return v !== undefined && v >= min ? Math.floor(v) : undefined;
}

/** A plain object (not an array). */
export function wpRecord<T = Record<string, unknown>>(wp: WidgetProps, key: string): T | undefined {
    const v = wp[key];
    return v != null && typeof v === "object" && !Array.isArray(v) ? (v as T) : undefined;
}

/** The non-empty strings of an array, or `undefined` when the value is not an array. */
export function wpTextList(wp: WidgetProps, key: string): string[] | undefined {
    const v = wp[key];
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length > 0) : undefined;
}

/** Returns `wp` without the given keys (props the engine consumed and must not forward). */
export function omitProps(wp: WidgetProps, ...keys: string[]): WidgetProps {
    const out = {...wp};
    for (const k of keys) delete out[k];
    return out;
}
