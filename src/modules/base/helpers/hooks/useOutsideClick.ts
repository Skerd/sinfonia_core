import {type RefObject, useEffect, useRef} from "react";

type InsideRef = RefObject<HTMLElement | null>;

export type UseOutsideClickOptions = {
    /** Listen only while `true`, e.g. while a dropdown is open. Default `true`. */
    enabled?: boolean;
    /** Also call the handler when Escape is pressed. Default `false`. */
    escape?: boolean;
};

/**
 * Calls `handler` when a pointer goes down outside every "inside" element (and, with `escape`,
 * when Escape is pressed) — the usual way to dismiss a hand-rolled dropdown or picker.
 *
 * - `pointerdown` covers mouse, touch and pen, and is listened to in the capture phase so a
 *   child that stops propagation cannot keep the menu open.
 * - Pass several refs when the "inside" is split (e.g. a trigger plus a portalled panel).
 *   Refs that are not attached are ignored; with none attached, nothing fires.
 * - The latest `handler` is always used, so inline arrows are fine.
 *
 * @example
 * useOutsideClick(menuRef, () => setOpen(false), {enabled: open, escape: true});
 */
export function useOutsideClick(
    refs: InsideRef | readonly InsideRef[],
    handler: (event: PointerEvent | KeyboardEvent) => void,
    {enabled = true, escape = false}: UseOutsideClickOptions = {},
): void {
    const handlerRef = useRef(handler);
    handlerRef.current = handler;
    const refsRef = useRef(refs);
    refsRef.current = refs;

    useEffect(() => {
        if (!enabled) return;

        const onPointerDown = (event: PointerEvent) => {
            const target = event.target as Node | null;
            // Structural check: nodes rendered into an iframe fail `instanceof Node` of this window.
            if (!target || typeof target.nodeType !== "number") return;

            const current = refsRef.current;
            const list = (Array.isArray(current) ? current : [current]) as readonly InsideRef[];
            const elements = list.map((ref) => ref.current).filter((element): element is HTMLElement => !!element);
            if (elements.length === 0) return;
            if (elements.some((element) => element.contains(target))) return;

            handlerRef.current(event);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") handlerRef.current(event);
        };

        document.addEventListener("pointerdown", onPointerDown, true);
        if (escape) document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown, true);
            if (escape) document.removeEventListener("keydown", onKeyDown);
        };
    }, [enabled, escape]);
}
