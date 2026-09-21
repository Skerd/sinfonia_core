import {useCallback, useEffect, useState} from "react";
import {getLocalStorage, getLocalStorageValue, removeLocalStorageValue, setLocalStorageValue} from "@coreModule/helpers/context/localStorage/localStorageProvider.ts";

function readPreference<T extends string>(key: string, isValid: (value: unknown) => value is T, fallback: T): T {
    const persisted = getLocalStorageValue(key);
    return isValid(persisted) ? persisted : fallback;
}

/**
 * A string preference backed by localStorage.
 *
 * - The first render reads the stored value, so there is no flash of the fallback.
 * - Stored values are validated, and stale or foreign values fall back.
 * - Changes made in another tab are picked up through the `storage` event, so
 *   two open panels never disagree about the preference.
 *
 * `isValid` should be a stable (module-level) function.
 */
export function usePersistedPreference<T extends string>(key: string, isValid: (value: unknown) => value is T, fallback: T) {
    const [value, setValue] = useState<T>(() => readPreference(key, isValid, fallback));

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleStorage = (event: StorageEvent) => {
            // A null key means another tab called `localStorage.clear()`.
            if (event.storageArea !== getLocalStorage()) return;
            if (event.key !== null && event.key !== key) return;
            setValue(readPreference(key, isValid, fallback));
        };

        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, [key, isValid, fallback]);

    const persist = useCallback((next: T) => {
        setLocalStorageValue(key, next);
        setValue(next);
    }, [key]);

    const reset = useCallback(() => {
        removeLocalStorageValue(key);
        setValue(fallback);
    }, [key, fallback]);

    return [value, persist, reset] as const;
}
