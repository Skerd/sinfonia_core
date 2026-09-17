import {createContext, type PropsWithChildren, useCallback, useContext} from "react";

export type SheetNavigateDismissOpts = {
    /**
     * When true (default unset / false): after closing this sheet, walk parent
     * `SheetMenuNavigateDismissProvider`s and close each toward the root (deepest sheet first).
     */
    all?: boolean;
};

/** Innermost-sheet dismiss chained to ancestors when `{ all: true }` is propagated. */
const SheetMenuNavigateDismissContext = createContext<
    ((opts?: SheetNavigateDismissOpts) => void) | undefined
>(undefined);

/**
 * Wrap a sheet that hosts an `ActionMenu` (or other menu rows that navigate). Providers may nest:
 * `{ all: true }` tears down inner → outer in order via {@link useDismissSheetBeforeMenuNavigate}.
 */
export function SheetMenuNavigateDismissProvider({
    onDismiss,
    children,
}: PropsWithChildren<{ onDismiss: () => void }>) {
    const parentDispatch = useContext(SheetMenuNavigateDismissContext);

    const dispatch = useCallback(
        (opts?: SheetNavigateDismissOpts) => {
            onDismiss();
            if (opts?.all === true && parentDispatch) {
                parentDispatch(opts);
            }
        },
        [onDismiss, parentDispatch],
    );

    return (
        <SheetMenuNavigateDismissContext.Provider value={dispatch}>
            {children}
        </SheetMenuNavigateDismissContext.Provider>
    );
}

/**
 * Clears a leftover `react-remove-scroll` body lock. Nested sheet + dropdown can leave
 * `pointer-events: none` on `document.body` after abrupt unmount during route changes.
 */
export function clearStaleBodyPointerEventsLock(): void {
    if (document.body.style.pointerEvents === "none") {
        document.body.style.removeProperty("pointer-events");
    }
}

/**
 * Calls the nearest wrapper's `onDismiss`, closing every nesting sheet upward.
 *
 * Always tears down nested sheets (`{ all: true }`) so overlays and scroll-lock do not stick
 * (recommended for Edit / navigate actions). Also schedules a body lock scrub for the next
 * macrotask — callers can keep `dismiss(); navigate(path)` without a special navigate helper.
 */
export function useDismissSheetBeforeMenuNavigate(): () => void {
    const dispatch = useContext(SheetMenuNavigateDismissContext);

    return useCallback(() => {
        if (!dispatch) return;
        dispatch({ all: true });
        // After React flushes sheet/menu unmount (and any same-tick navigate), clear a stuck lock.
        window.setTimeout(clearStaleBodyPointerEventsLock, 0);
    }, [dispatch]);
}
