/*
 * How the portal's pictures move: a card's picture grows into the hero of the page it opens, and a picture fades in
 * once it has loaded instead of popping in line by line. Plain DOM and Web Animations, so a page never waits on them.
 */

/** A hero shows up this long after the click at most and still grows out of the card; later it just appears. */
const ORIGIN_TTL_MS = 900;
const MORPH_MS = 420;
const MORPH_EASING = "cubic-bezier(0.2, 0.8, 0.2, 1)";

type Origin = {src: string; rect: DOMRect; radius: string; at: number};
let origin: Origin | null = null;

function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** The picture of a link the visitor just followed (a catalog card), and where it sat on screen. */
export function rememberImageOrigin(link: Element): void {
    const image = link.querySelector("img");
    origin = image && image.complete && image.naturalWidth > 0
        ? {src: image.currentSrc || image.src, rect: image.getBoundingClientRect(), radius: getComputedStyle(image.parentElement ?? image).borderRadius, at: performance.now()}
        : null;
}

/**
 * Grows a page's hero picture out of the card picture just clicked, when both show the same picture: a copy flies
 * from the card's place to the hero's while the hero waits hidden. Returns a cancel for the page leaving early.
 */
export function morphFromOrigin(target: HTMLImageElement): (() => void) | undefined {
    const from = origin;
    // One hero per click.
    origin = null;
    if (!from || performance.now() - from.at > ORIGIN_TTL_MS || target.src !== from.src) return undefined;
    if (typeof target.animate !== "function" || prefersReducedMotion()) return undefined;
    const to = target.getBoundingClientRect();
    if (!to.width || !to.height) return undefined;

    const ghost = document.createElement("img");
    ghost.src = from.src;
    ghost.alt = "";
    ghost.setAttribute("aria-hidden", "true");
    Object.assign(ghost.style, {position: "fixed", margin: "0", objectFit: "cover", zIndex: "70", pointerEvents: "none"});
    document.body.append(ghost);
    target.style.visibility = "hidden";
    const box = (rect: DOMRect, borderRadius: string) => ({
        left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, borderRadius,
    });
    const flight = ghost.animate(
        [box(from.rect, from.radius), box(to, getComputedStyle(target.parentElement ?? target).borderRadius)],
        {duration: MORPH_MS, easing: MORPH_EASING, fill: "forwards"},
    );
    const land = () => {
        target.style.visibility = "";
        ghost.remove();
    };
    flight.onfinish = land;
    flight.oncancel = land;
    return () => flight.cancel();
}

/**
 * `ref` for an `<img data-reveal>`: marks it `data-revealed` once loaded (at once when it already is), so the portal
 * stylesheet fades it in. A picture that fails is revealed too, rather than left invisible.
 */
export function revealImage(image: HTMLImageElement | null): void {
    if (!image) return;
    const reveal = () => image.setAttribute("data-revealed", "");
    if (image.complete) {
        reveal();
        return;
    }
    image.addEventListener("load", reveal, {once: true});
    image.addEventListener("error", reveal, {once: true});
}
