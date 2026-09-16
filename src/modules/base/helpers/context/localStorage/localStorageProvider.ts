/*
 * Safe localStorage access.
 *
 * Storage access throws a SecurityError when the browser blocks site data
 * (some private modes, disabled cookies), and writes throw once the quota is
 * full. These helpers are read during first render and on every API request,
 * so they never throw.
 *
 * When a write cannot reach storage, the value is kept in memory for the rest
 * of the page's life. A user with blocked storage can therefore still sign in
 * and keep their preferences until they reload, instead of every read coming
 * back empty.
 */

const memoryFallback = new Map<string, string>();

export function getLocalStorage(): Storage | null {
    if (typeof window === "undefined") return null;
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

export function getLocalStorageValue(key: string): string | null {
    // A value only lands here after a failed write, so it is newer than whatever storage holds.
    const inMemory = memoryFallback.get(key);
    if (inMemory !== undefined) return inMemory;
    try {
        return getLocalStorage()?.getItem(key) ?? null;
    } catch {
        return null;
    }
}

/**
 * Returns whether the value reached localStorage. `false` means it is held in
 * memory only and will not survive a reload or be seen by other tabs.
 */
export function setLocalStorageValue(key: string, value: string): boolean {
    const storage = getLocalStorage();
    try {
        if (storage) {
            storage.setItem(key, value);
            memoryFallback.delete(key);
            return true;
        }
    } catch {
        // Fall through to the in-memory copy.
    }
    memoryFallback.set(key, value);
    // Drop any older stored copy so a later reload does not resurrect it.
    try {
        storage?.removeItem(key);
    } catch {
        // Nothing more we can do.
    }
    return false;
}

export function removeLocalStorageValue(key: string): void {
    memoryFallback.delete(key);
    try {
        getLocalStorage()?.removeItem(key);
    } catch {
        // Nothing more we can do.
    }
}

/**
 * Reads and parses a JSON value. Returns `null` when it is missing, unparsable,
 * or rejected by `isValid`; unparsable values are removed so they stop failing
 * on every read.
 */
export function getLocalStorageJson<T>(key: string, isValid: (value: unknown) => value is T): T | null {
    const raw = getLocalStorageValue(key);
    if (raw === null) return null;
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        removeLocalStorageValue(key);
        return null;
    }
    return isValid(parsed) ? parsed : null;
}

export function setLocalStorageJson(key: string, value: unknown): boolean {
    return setLocalStorageValue(key, JSON.stringify(value));
}

/** Test-only: forget values held in memory after failed writes. */
export function resetLocalStorageMemoryFallback(): void {
    memoryFallback.clear();
}
