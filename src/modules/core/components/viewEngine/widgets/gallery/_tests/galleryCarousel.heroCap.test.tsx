import {fireEvent, render, screen, within} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import type {Media} from "armonia/src/modules/core/types";
import {GalleryCarousel} from "../galleryCarousel.tsx";

beforeEach(() => {
    Element.prototype.scrollIntoView = () => undefined;
    vi.stubGlobal("matchMedia", (query: string) => ({
        matches: false,
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
    }));
    vi.stubGlobal("IntersectionObserver", class {
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() { return []; }
    });
});

const photo: Media = {
    _id: "p1",
    name: "Facade",
    size: 1,
    extension: "jpg",
    mime: "image/jpeg",
    safeCheckedFlag: true,
};

const second: Media = {...photo, _id: "p2", name: "Interior"};
const PORTRAIT = 3 / 4;

function frameOf(container: HTMLElement): HTMLElement | null {
    return container.querySelector("[data-slot=gallery-carousel] img")?.parentElement ?? null;
}

describe("GalleryCarousel sheet hero", () => {
    it("caps the sheet frame so a portrait does not grow with the panel", () => {
        const {container} = render(
            <GalleryCarousel imageGallery={[photo]} forcedAspectRatio={PORTRAIT} capHero />,
        );
        const frame = frameOf(container);
        expect(frame).not.toBeNull();
        expect(frame).toHaveStyle({maxHeight: "28rem", aspectRatio: String(PORTRAIT)});
        expect(frame?.className).toContain("max-h-[28rem]");
        expect(frame?.querySelector("img")?.className).toContain("object-contain");
    });

    it("leaves the card hero uncapped", () => {
        const {container} = render(
            <GalleryCarousel imageGallery={[photo]} forcedAspectRatio={PORTRAIT} allowFullScreen={false} />,
        );
        const frame = frameOf(container);
        expect(frame).not.toBeNull();
        expect(frame?.style.maxHeight).toBe("");
        expect(frame?.className).not.toContain("max-h-[28rem]");
        expect(screen.queryByRole("button", {name: "View media 1 of 1"})).not.toBeInTheDocument();
    });

    it("opens a large dialog when the capped sheet image is clicked", () => {
        render(
            <GalleryCarousel imageGallery={[photo]} forcedAspectRatio={PORTRAIT} capHero allowFullScreen={false} />,
        );
        fireEvent.click(screen.getByRole("button", {name: "View media 1 of 1"}));
        const dialog = screen.getByRole("dialog", {name: "Gallery"});
        expect(dialog.querySelector("img")?.className).toContain("object-contain");
    });

    it("shows the other photos as small rounded squares in the dialog", () => {
        render(
            <GalleryCarousel imageGallery={[photo, second]} forcedAspectRatio={PORTRAIT} capHero allowFullScreen={false} />,
        );
        fireEvent.click(screen.getAllByRole("button", {name: /View media 1 of 2/})[0]);
        const dialog = screen.getByRole("dialog", {name: "Gallery"});
        const thumbs = within(dialog).getAllByRole("tab", {name: /Thumbnail/});
        expect(thumbs.map((thumb) => thumb.getAttribute("aria-label"))).toEqual([
            "Thumbnail 1 of 2",
            "Thumbnail 2 of 2",
        ]);
        expect(thumbs[0].className).toContain("size-14");
        expect(thumbs[0].className).toContain("rounded-lg");
        expect(thumbs[0]).toHaveAttribute("aria-selected", "true");
        fireEvent.click(thumbs[1]);
        expect(within(dialog).getByRole("tab", {name: "Thumbnail 2 of 2"})).toHaveAttribute("aria-selected", "true");
    });
});
