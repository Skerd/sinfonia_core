export function getLocalStorage(): Storage | null {
    if (typeof window === "undefined") return null;
    return window.localStorage;
}

export function getLocalStorageValue(key: string): string | null {
    return getLocalStorage()?.getItem(key) ?? null;
}

export function setLocalStorageValue(key: string, value: string): void {
    getLocalStorage()?.setItem(key, value);
}

export function removeLocalStorageValue(key: string): void {
    getLocalStorage()?.removeItem(key);
}