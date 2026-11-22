import {fireEvent, render, screen} from "@testing-library/react";
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

const flagged: Media = {_id: "flagged-photo", name: "Beach", size: 1, extension: "jpg", mime: "image/jpeg", safeCheckedFlag: false, moderation: "flagged"};
const flaggedVideo: Media = {_id: "flagged-video", name: "Tour", size: 1, extension: "mp4", mime: "video/mp4", safeCheckedFlag: false, moderation: "flagged"};
const slideImage = (container: HTMLElement) => container.querySelector("[data-slot=gallery-carousel] img");
const slideVideo = (container: HTMLElement) => container.querySelector("[data-slot=gallery-carousel] video");

describe("GalleryCarousel with a flagged image (D177)", () => {
    it("covers the blurred copy without opening the viewer, then shows the image itself", () => {
        const {container} = render(<GalleryCarousel imageGallery={[flagged]} forcedAspectRatio={4 / 3} capHero/>);

        expect(slideImage(container)?.getAttribute("src")).not.toContain("reveal=1");
        expect(slideImage(container)?.className).toContain("blur-md");
        expect(screen.queryByRole("button", {name: "View media 1 of 1"})).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", {name: /Show/}));

        expect(slideImage(container)?.getAttribute("src")).toContain("reveal=1");
        expect(screen.getByRole("button", {name: "View media 1 of 1"})).toBeInTheDocument();
    });
});

describe("GalleryCarousel with a flagged video (D177)", () => {
    it("asks for no video until the viewer shows it", () => {
        const {container} = render(<GalleryCarousel imageGallery={[flaggedVideo]} forcedAspectRatio={4 / 3} capHero/>);

        expect(slideVideo(container)).toBeNull();
        fireEvent.click(screen.getByRole("button", {name: /Show/}));

        expect(slideVideo(container)?.getAttribute("src")).toContain("reveal=1");
    });
});
