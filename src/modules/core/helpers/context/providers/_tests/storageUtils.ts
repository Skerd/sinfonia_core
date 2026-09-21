import {act} from "@testing-library/react";

/**
 * Simulates another tab writing to localStorage. Browsers never fire `storage`
 * in the tab that made the change, so tests write the value and dispatch the
 * event by hand.
 */
export function writeFromAnotherTab(key: string | null, newValue: string | null) {
    act(() => {
        if (key === null) localStorage.clear();
        else if (newValue === null) localStorage.removeItem(key);
        else localStorage.setItem(key, newValue);
        window.dispatchEvent(new StorageEvent("storage", {key, newValue, storageArea: localStorage}));
    });
}
