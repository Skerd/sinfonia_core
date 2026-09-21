import {useEffect, useRef} from "react";

/**
 * Stable `URL.createObjectURL` previews for a list of Files.
 *
 * Calling `URL.createObjectURL(file)` straight from a render body — which the gallery fields
 * used to do — mints a brand new blob URL on every render and never revokes any of them, so a
 * form that re-renders while the user types leaks one URL per keystroke per thumbnail. This
 * caches one URL per File instance, revokes a URL as soon as its File leaves the list, and
 * revokes whatever is left on unmount.
 *
 * Pass the current list (strings and nullish entries are ignored, so a mixed
 * `File | string` form value can be handed over as-is) and call the returned
 * accessor for each File you render.
 */
export function useObjectUrls(items: readonly unknown[]): (file: File) => string {
    const cache = useRef(new Map<File, string>());

    // Revoke URLs whose File is no longer in the list (removed item, replaced selection).
    useEffect(() => {
        const live = new Set(items.filter((i): i is File => i instanceof File));
        for (const [file, url] of cache.current.entries()) {
            if (!live.has(file)) {
                URL.revokeObjectURL(url);
                cache.current.delete(file);
            }
        }
    }, [items]);

    useEffect(() => {
        const cached = cache.current;
        return () => {
            for (const url of cached.values()) URL.revokeObjectURL(url);
            cached.clear();
        };
    }, []);

    return (file: File) => {
        let url = cache.current.get(file);
        if (!url) {
            url = URL.createObjectURL(file);
            cache.current.set(file, url);
        }
        return url;
    };
}
