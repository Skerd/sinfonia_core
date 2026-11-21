import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {morphFromOrigin, rememberImageOrigin, revealImage} from "@coreModule/clients/portal/shared/portalImageMotion.ts";

/** A loaded picture inside a link, as a catalog card has. */
function cardLink(src: string) {
    const link = document.createElement("a");
    const image = document.createElement("img");
    image.src = src;
    Object.defineProperty(image, "complete", {configurable: true, value: true});
    Object.defineProperty(image, "naturalWidth", {configurable: true, value: 800});
    link.append(image);
    document.body.append(link);
    return link;
}

function hero(src: string) {
    const image = document.createElement("img");
    image.src = src;
    image.getBoundingClientRect = () => new DOMRect(40, 120, 600, 750);
    document.body.append(image);
    return image;
}

describe("revealImage", () => {
    it("reveals a picture that has loaded, at once or when it loads", () => {
        const loaded = document.createElement("img");
        Object.defineProperty(loaded, "complete", {value: true});
        revealImage(loaded);
        expect(loaded.hasAttribute("data-revealed")).toBe(true);

        const loading = document.createElement("img");
        Object.defineProperty(loading, "complete", {value: false});
        revealImage(loading);
        expect(loading.hasAttribute("data-revealed")).toBe(false);
        loading.dispatchEvent(new Event("load"));
        expect(loading.hasAttribute("data-revealed")).toBe(true);
    });

    it("reveals a picture that fails rather than leaving it invisible", () => {
        const broken = document.createElement("img");
        Object.defineProperty(broken, "complete", {value: false});
        revealImage(broken);
        broken.dispatchEvent(new Event("error"));
        expect(broken.hasAttribute("data-revealed")).toBe(true);
    });
});

describe("morphFromOrigin", () => {
    const flight = {onfinish: null as (() => void) | null, oncancel: null as (() => void) | null, cancel: vi.fn()};

    beforeEach(() => {
        document.body.innerHTML = "";
        flight.cancel.mockReset();
        // A test DOM has no Web Animations or media queries.
        Object.defineProperty(HTMLElement.prototype, "animate", {configurable: true, value: vi.fn(() => flight)});
        vi.stubGlobal("matchMedia", vi.fn(() => ({matches: false})));
    });
    afterEach(() => {
        Reflect.deleteProperty(HTMLElement.prototype, "animate");
        vi.unstubAllGlobals();
    });

    it("flies a copy of the clicked card's picture into the same picture on the next page", () => {
        rememberImageOrigin(cardLink("http://portal.localhost/api/media/1"));
        const target = hero("http://portal.localhost/api/media/1");

        const cancel = morphFromOrigin(target);
        const ghost = document.body.querySelector("img[aria-hidden='true']");
        expect(cancel).toBeTypeOf("function");
        expect(ghost).not.toBeNull();
        expect(target.style.visibility).toBe("hidden");

        flight.onfinish?.();
        expect(target.style.visibility).toBe("");
        expect(document.body.querySelector("img[aria-hidden='true']")).toBeNull();
    });

    it("leaves another picture alone, and morphs only once per click", () => {
        rememberImageOrigin(cardLink("http://portal.localhost/api/media/1"));
        expect(morphFromOrigin(hero("http://portal.localhost/api/media/2"))).toBeUndefined();
        expect(morphFromOrigin(hero("http://portal.localhost/api/media/1"))).toBeUndefined();
    });

    it("lets a page that shows up late, or a visitor who asked for less motion, simply show the picture", () => {
        vi.useFakeTimers({toFake: ["performance"]});
        rememberImageOrigin(cardLink("http://portal.localhost/api/media/1"));
        vi.advanceTimersByTime(1000);
        expect(morphFromOrigin(hero("http://portal.localhost/api/media/1"))).toBeUndefined();
        vi.useRealTimers();

        vi.stubGlobal("matchMedia", vi.fn(() => ({matches: true})));
        rememberImageOrigin(cardLink("http://portal.localhost/api/media/1"));
        expect(morphFromOrigin(hero("http://portal.localhost/api/media/1"))).toBeUndefined();
    });
});
