import {useLayoutEffect, useRef} from "react";
import {useLocation, useNavigationType, type Location} from "react-router-dom";
import {isAccountTabSwitch} from "./accountArea.ts";
const STORAGE_KEY = "portal.scrollPositions";
/** How long Back waits for a page still loading to grow tall enough to scroll back into. */
const RESTORE_WAIT_MS = 2500;

function readStored(): [string, number][] {
    try {
        const parsed: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]");
        return Array.isArray(parsed)
            ? parsed.filter((entry): entry is [string, number] => Array.isArray(entry) && typeof entry[0] === "string" && typeof entry[1] === "number")
            : [];
    } catch {
        return [];
    }
}

/** Where the visitor was on each history entry, by its location key; kept in the tab's session for a reload. */
const positions = new Map<string, number>(readStored());

function keepPositions() {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...positions].slice(-50)));
    } catch {
        // Storage refused (private mode): Back still works until the tab reloads.
    }
}

/**
 * A page of its own, not the same page with other filters: another path, or another item of a page that opens items
 * by query (`/shop/product?id=…`).
 */
function pageOf(location: Location): string {
    const params = new URLSearchParams(location.search);
    return [location.pathname, params.get("id") ?? "", params.get("slug") ?? ""].join("|");
}

/** Scrolls to `top`, and again as a page that is still loading grows, until it fits, the visitor scrolls, or time runs out. */
function scrollBackTo(top: number): () => void {
    const fits = () => document.documentElement.scrollHeight - window.innerHeight >= top - 1;
    window.scrollTo({top, left: 0, behavior: "instant"});
    if (fits()) return () => undefined;

    const observer = new ResizeObserver(() => {
        window.scrollTo({top, left: 0, behavior: "instant"});
        if (fits()) stop();
    });
    const timer = setTimeout(stop, RESTORE_WAIT_MS);
    function stop() {
        observer.disconnect();
        clearTimeout(timer);
        window.removeEventListener("wheel", stop);
        window.removeEventListener("touchstart", stop);
        window.removeEventListener("keydown", stop);
    }
    observer.observe(document.body);
    window.addEventListener("wheel", stop, {passive: true});
    window.addEventListener("touchstart", stop, {passive: true});
    window.addEventListener("keydown", stop);
    return stop;
}

/**
 * Back and Forward return to where the visitor was on that page; a new page starts at the top; the same page with
 * other filters, and moving between the tabs of an account area, keep the place. The browser's own restoring is off:
 * it ran before the page had loaded and landed in the wrong place.
 */
export default function PortalScrollRestoration() {
    const location = useLocation();
    const navigationType = useNavigationType();
    const shown = useRef<Location | null>(null);

    useLayoutEffect(() => {
        const browserRestoring = window.history.scrollRestoration;
        window.history.scrollRestoration = "manual";
        let frame = 0;
        const save = () => {
            if (shown.current) positions.set(shown.current.key, window.scrollY);
        };
        const onScroll = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(save);
        };
        const onHide = () => {
            save();
            keepPositions();
        };
        window.addEventListener("scroll", onScroll, {passive: true});
        window.addEventListener("pagehide", onHide);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("pagehide", onHide);
            window.history.scrollRestoration = browserRestoring;
        };
    }, []);

    useLayoutEffect(() => {
        const previous = shown.current;
        // From here on scrolling (a shorter page clamping it included) belongs to the page now shown.
        shown.current = location;
        if (navigationType === "POP") {
            const top = positions.get(location.key);
            if (top !== undefined) return scrollBackTo(top);
        }
        if (previous && pageOf(previous) === pageOf(location)) return;
        if (previous && isAccountTabSwitch(previous.pathname, location.pathname)) return;
        window.scrollTo({top: 0, left: 0, behavior: "instant"});
    }, [location, navigationType]);

    return null;
}
