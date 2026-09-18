import {useSyncExternalStore} from "react";

const DEFAULT_TICK_MS = 30_000;

const subscribers = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
let snapshot = Date.now();

function start() {
    if (timer !== undefined) return;
    timer = setInterval(() => {
        snapshot = Date.now();
        for (const notify of subscribers) notify();
    }, DEFAULT_TICK_MS);
}

function subscribe(onChange: () => void): () => void {
    subscribers.add(onChange);
    start();
    return () => {
        subscribers.delete(onChange);
        if (subscribers.size === 0 && timer !== undefined) {
            clearInterval(timer);
            timer = undefined;
        }
    };
}

/**
 * A clock that re-renders its subscribers every 30 seconds.
 *
 * Relative timestamps ("just now", "2m") are computed from `Date.now()` at render time, so
 * without something to nudge them they freeze at whatever they said when the list first
 * painted — a notification popover left open keeps claiming "just now" ten minutes later.
 *
 * All subscribers share one interval and one timestamp, so a list of fifty rows still costs a
 * single timer, and the timer stops as soon as the last row unmounts.
 */
function getSnapshot(): number {
    // `useSyncExternalStore` needs a value that is stable between renders, so the timestamp is
    // cached and only refreshed once it is a full tick out of date. `Math.abs` covers the clock
    // moving either way — a system clock correction, or a test freezing time in the past.
    if (Math.abs(Date.now() - snapshot) >= DEFAULT_TICK_MS) snapshot = Date.now();
    return snapshot;
}

export function useNow(): number {
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
