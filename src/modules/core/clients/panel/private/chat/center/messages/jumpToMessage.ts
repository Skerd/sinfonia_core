import "./messageFlash.css";

/** Longest the highlight stays when no animation ends it (reduced motion). */
const FLASH_MS = 1900;

/**
 * Scrolls to message `id` and flashes it so the eye finds it (a reply quote's original, D162). Returns false when the
 * message is not loaded yet: it is further up the history.
 */
export function jumpToMessage(id: string): boolean {
    const element = document.getElementById(`message-${id}`);
    if (!element) return false;
    element.scrollIntoView({behavior: "smooth", block: "center"});

    // Clicked again while it still flashes: start over.
    element.removeAttribute("data-flash");
    void element.offsetWidth;
    element.setAttribute("data-flash", "true");

    const clear = () => {
        element.removeAttribute("data-flash");
        element.removeEventListener("animationend", onEnd);
        clearTimeout(timer);
    };
    const onEnd = (event: AnimationEvent) => {
        if (event.target === element) clear();
    };
    element.addEventListener("animationend", onEnd);
    const timer = setTimeout(clear, FLASH_MS + 400);
    return true;
}
