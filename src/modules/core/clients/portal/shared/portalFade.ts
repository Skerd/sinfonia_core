import {useLayoutEffect, useRef, type RefObject} from "react";

/**
 * Fades `element` in each time `page` changes, as the new page is shown: the portal layout for whole pages, an
 * account area for its tabs (`rise`: coming up a few pixels as well; never for a whole page, whose fixed parts a
 * transform would move). `skip(previous, next)` leaves a change alone; `first` fades the first page too. Nothing
 * moves for a visitor who asked for less motion, or without Web Animations (an old browser, a test DOM).
 */
export function useFadeInOnChange(
    element: RefObject<HTMLElement | null>,
    page: string,
    {first = false, rise = false, skip}: {first?: boolean; rise?: boolean; skip?: (previous: string, next: string) => boolean} = {},
): void {
    const shown = useRef<string | null>(null);
    useLayoutEffect(() => {
        const previous = shown.current;
        shown.current = page;
        const node = element.current;
        if (previous === page || (previous === null && !first) || !node || typeof node.animate !== "function") return;
        if (previous !== null && skip?.(previous, page)) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        node.animate(
            rise ? [{opacity: 0, transform: "translateY(8px)"}, {opacity: 1, transform: "none"}] : [{opacity: 0}, {opacity: 1}],
            {duration: rise ? 320 : 220, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)"},
        );
    }, [element, page, first, rise, skip]);
}
