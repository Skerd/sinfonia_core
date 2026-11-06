import type {KeyboardEvent, MouseEvent} from "react";

/**
 * Props that make a non-button element work like a button for keyboard and screen-reader users (D23, the ARIA
 * button pattern): focusable, announced as a button, activated by a click, Enter or Space. Enter and Space fire a
 * real click, so the handler, and anything listening higher up (a popover trigger), run as they do for the mouse.
 * Prefer the `Button` primitive; use this where an element's own layout (a row, a chip, a message) must stay.
 */
export function buttonLike<E extends HTMLElement>(onActivate: (event: MouseEvent<E>) => void) {
    return {
        role: "button" as const,
        tabIndex: 0,
        onClick: onActivate,
        onKeyDown: (event: KeyboardEvent<E>) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            event.currentTarget.click();
        },
    };
}
