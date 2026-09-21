export type QueryValue = string | number | boolean | null | undefined;

/**
 * Builds `newBasePath` carrying over the query string of `currentUrl`, e.g. to keep list filters
 * (`?projectId=…`) when opening the create page. `extraParams` are set on top; `null`/`undefined`
 * values remove the parameter. No `?` is added when nothing remains.
 *
 * @param currentUrl - Absolute URL (typically `window.location.href`) or a relative one.
 */
export function buildUrlWithExistingParams(
    currentUrl: string,
    newBasePath: string,
    extraParams: Record<string, QueryValue> = {},
): string {
    const params = new URL(currentUrl, "http://localhost").searchParams;

    for (const [key, value] of Object.entries(extraParams)) {
        if (value == null) {
            params.delete(key);
        } else {
            params.set(key, String(value));
        }
    }

    const query = params.toString();
    return query ? `${newBasePath}?${query}` : newBasePath;
}
