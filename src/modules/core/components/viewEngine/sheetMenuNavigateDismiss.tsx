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
 * Calls the nearest wrapper's `onDismiss`, optionally closing every nesting sheet upward.
 *
 * @param allNestedSheets – pass `true` before router navigation when nested sheets may be open so
 * overlays and scroll-lock do not stick (recommended for Edit / navigate actions).
 */
export function useDismissSheetBeforeMenuNavigate(): (allNestedSheets?: boolean) => void {
    const dispatch = useContext(SheetMenuNavigateDismissContext);

    return useCallback(
        () => {dispatch?.({ all: true });},
        [dispatch],
    );
}
