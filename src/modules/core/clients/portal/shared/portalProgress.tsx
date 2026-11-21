import {useEffect, useLayoutEffect, useRef, useSyncExternalStore} from "react";
import {useLocation} from "react-router-dom";
import {getWaitingReads, subscribeWaitingReads} from "@coreModule/helpers/apiClient/responseCache.ts";

/* A navigation the visitor started (a followed link, Back) whose page is not on screen yet. */
let navigating = false;
let navigationTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

/** The visitor followed a link or went Back: the bar runs until the next page is on screen. */
export function startPortalNavigation(): void {
    navigating = true;
    clearTimeout(navigationTimer);
    // Never left running by a navigation the router dropped.
    navigationTimer = setTimeout(endPortalNavigation, 10_000);
    emit();
}

export function endPortalNavigation(): void {
    clearTimeout(navigationTimer);
    if (!navigating) return;
    navigating = false;
    emit();
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    const unsubscribeReads = subscribeWaitingReads(listener);
    return () => {
        listeners.delete(listener);
        unsubscribeReads();
    };
}

const isBusy = () => navigating || getWaitingReads() > 0;

/** A wait shorter than this is not worth a bar. */
const SHOW_AFTER_MS = 150;
/** Reads that follow each other this closely (a product, then its reviews) are one wait: the bar carries on. */
const SETTLE_MS = 120;

/**
 * A thin bar along the top of the window while the next page loads (its code or the reads it waits on): it creeps
 * towards the end, then fills and fades when the page is there. Decorative: the page itself says it is busy.
 */
export default function PortalProgressBar() {
    const busy = useSyncExternalStore(subscribe, isBusy, () => false);
    const location = useLocation();
    const bar = useRef<HTMLDivElement>(null);
    const running = useRef<Animation | null>(null);
    const finishing = useRef<Animation | null>(null);

    // The page of the navigation is committed with this location.
    useLayoutEffect(() => {
        endPortalNavigation();
    }, [location]);

    useEffect(() => {
        const element = bar.current;
        // No Web Animations (an old browser, a test DOM): no bar.
        if (!element || typeof element.animate !== "function") return;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (busy) {
            // Still running: a finish was due but the next read came first.
            if (running.current) return;
            finishing.current?.cancel();
            running.current = element.animate(
                [{transform: "scaleX(0)"}, {transform: "scaleX(0.85)"}],
                {duration: reduced ? 1 : 8000, delay: SHOW_AFTER_MS, easing: "cubic-bezier(0.1, 0.7, 0.2, 1)", fill: "both"},
            );
            return;
        }
        if (!running.current) return;
        const settle = setTimeout(() => {
            const run = running.current;
            if (!run) return;
            running.current = null;
            const shown = typeof run.currentTime === "number" && run.currentTime > SHOW_AFTER_MS;
            const transform = getComputedStyle(element).transform;
            run.cancel();
            if (!shown) return;
            finishing.current = element.animate(
                [{transform, opacity: 1}, {transform: "scaleX(1)", opacity: 1, offset: 0.5}, {transform: "scaleX(1)", opacity: 0}],
                {duration: reduced ? 1 : 360, easing: "ease-out"},
            );
        }, SETTLE_MS);
        return () => clearTimeout(settle);
    }, [busy]);

    return (
        <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5">
            <div ref={bar} className="h-full origin-left bg-primary" style={{transform: "scaleX(0)"}} />
        </div>
    );
}
