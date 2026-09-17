import {useCallback, useEffect, useRef, useState} from "react";
import {clearStaleBodyPointerEventsLock} from "../widgets/sheetMenuNavigateDismiss.tsx";

/** Keep in sync with `data-closed:duration-*` on `SheetContent`. */
const SHEET_CLOSE_ANIMATION_MS = 280;

/**
 * Open state for an entity sheet whose parent mounts it conditionally
 * (`{action === "view" && <Sheet…/>}`): closing flips a local flag first and tells the parent
 * only after the exit animation, so the sheet is not torn down mid-animation.
 */
export function useSheetPresence(open: boolean, onOpenChange: (open: boolean) => void) {
    const [present, setPresent] = useState(open);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearCloseTimer = useCallback(() => {
        if (closeTimerRef.current != null) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    }, []);

    useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);
    useEffect(() => () => clearStaleBodyPointerEventsLock(), []);

    useEffect(() => {
        if (open) {
            clearCloseTimer();
            setPresent(true);
        }
    }, [open, clearCloseTimer]);

    const handleOpenChange = useCallback(
        (next: boolean) => {
            clearCloseTimer();
            if (next) {
                setPresent(true);
                onOpenChange(true);
                return;
            }
            setPresent(false);
            closeTimerRef.current = setTimeout(() => {
                closeTimerRef.current = null;
                onOpenChange(false);
            }, SHEET_CLOSE_ANIMATION_MS);
        },
        [clearCloseTimer, onOpenChange],
    );

    /**
     * Immediate teardown for Edit / menu navigation. The animated close leaves the overlay and
     * scroll lock mounted while the route changes, which can stick `pointer-events: none` on
     * `document.body` and block the destination form.
     */
    const dismissNow = useCallback(() => {
        clearCloseTimer();
        setPresent(false);
        onOpenChange(false);
    }, [clearCloseTimer, onOpenChange]);

    return {present, handleOpenChange, dismissNow};
}
