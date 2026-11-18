import {act, fireEvent, render, screen, within} from "@testing-library/react";
import {useState} from "react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {Button} from "@coreModule/components/ui/button.tsx";
import {GalleryDialog, type GalleryMediaItem} from "../galleryDialog.tsx";

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

/** A public page's photos: plain URLs, no Media records. */
const photos: GalleryMediaItem[] = [
    {key: "cover", src: "/api/auxiliary/public/media/a", video: false},
    {key: "gallery-0", src: "/api/auxiliary/public/media/b", video: false},
    {key: "gallery-1", src: "/api/auxiliary/public/media/c", video: false},
];

describe("GalleryDialog from URLs", () => {
    it("opens on the clicked photo, named by the page, and steps through the others", () => {
        render(<GalleryDialog items={photos} open onOpenChange={() => undefined} startIndex={2} title="Spring on the lake" />);
        const dialog = screen.getByRole("dialog", {name: "Spring on the lake"});
        // Decorative photos (alt="") have no img role, so read them from the DOM.
        expect([...dialog.querySelectorAll("img")].map((img) => img.getAttribute("src"))).toEqual(
            expect.arrayContaining(photos.map((photo) => photo.src)),
        );
        expect(within(dialog).getByRole("tab", {name: "Thumbnail 3 of 3"})).toHaveAttribute("aria-selected", "true");
        fireEvent.click(within(dialog).getByRole("tab", {name: "Thumbnail 1 of 3"}));
        expect(within(dialog).getByRole("tab", {name: "Thumbnail 1 of 3"})).toHaveAttribute("aria-selected", "true");
    });

    it("shows no thumbnails or arrows for a single photo and reports closing", () => {
        const onOpenChange = vi.fn();
        render(<GalleryDialog items={photos.slice(0, 1)} open onOpenChange={onOpenChange} startIndex={0} />);
        const dialog = screen.getByRole("dialog", {name: "Gallery"});
        expect(within(dialog).queryByRole("tablist")).not.toBeInTheDocument();
        expect(within(dialog).queryByRole("button", {name: "Next slide"})).not.toBeInTheDocument();
        fireEvent.keyDown(dialog, {key: "Escape"});
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("gives focus back to the photo that opened it", async () => {
        function Page() {
            const [open, setOpen] = useState(false);
            return (
                <>
                    <Button type="button" onClick={() => setOpen(true)}>Open photo</Button>
                    <GalleryDialog items={photos} open={open} onOpenChange={setOpen} startIndex={0} />
                </>
            );
        }
        render(<Page />);
        const opener = screen.getByRole("button", {name: "Open photo"});
        opener.focus();
        fireEvent.click(opener);
        fireEvent.keyDown(screen.getByRole("dialog"), {key: "Escape"});
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(opener).toHaveFocus();
    });

    it("renders nothing while closed", () => {
        render(<GalleryDialog items={photos} open={false} onOpenChange={() => undefined} startIndex={0} />);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
});
