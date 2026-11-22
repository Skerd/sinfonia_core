import {fireEvent, render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";

// The PDF thumbnail renders with pdf.js; here only the address it is given matters.
vi.mock("@coreModule/components/custom/pdf/PdfFirstPageThumb.tsx", () => ({
    default: ({src}: {src: string}) => <p data-testid="pdf-thumb">{src}</p>,
}));
import MediaPreviewContent from "@coreModule/components/viewEngine/widgets/media/mediaPreviewContent.tsx";
import {isFlaggedMedia} from "@coreModule/components/viewEngine/widgets/media/flaggedMedia.tsx";

describe("isFlaggedMedia (D177)", () => {
    it("reads the full Media DTO and a populated snippet, and holds removed files too", () => {
        expect(isFlaggedMedia({_id: "a", moderation: "flagged"})).toBe(true);
        expect(isFlaggedMedia({_id: "a", metadata: {moderation: {status: "flagged"}}})).toBe(true);
        expect(isFlaggedMedia({_id: "a", moderation: "rejected"})).toBe(true);
        expect(isFlaggedMedia({_id: "a", metadata: {moderation: {status: "rejected"}}})).toBe(true);
        expect(isFlaggedMedia({_id: "a", moderation: "approved"})).toBe(false);
        expect(isFlaggedMedia("6b0309d9ac433659b22b0297")).toBe(false);
    });
});

describe("MediaPreviewContent with a flagged image (D177)", () => {
    it("covers the blurred copy until the viewer shows the image, and keeps it shown elsewhere", () => {
        const src = "/api/auxiliary/media/flagged-1";
        const {unmount} = render(<MediaPreviewContent mode="thumb" src={src} mime="image/png" filename="photo.png" flagged/>);

        expect(screen.getByRole("img")).toHaveAttribute("src", src);
        expect(screen.getByText("May contain nudity")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", {name: /Show/}));

        expect(screen.getByRole("img")).toHaveAttribute("src", `${src}?reveal=1`);
        expect(screen.queryByText("May contain nudity")).toBeNull();
        unmount();

        // The same image opened in its full view stays shown.
        render(<MediaPreviewContent mode="dialog" src={src} mime="image/png" filename="photo.png" flagged/>);
        expect(screen.getByRole("img")).toHaveAttribute("src", `${src}?reveal=1`);
    });

    it("shows an image that is not flagged as it is", () => {
        render(<MediaPreviewContent mode="thumb" src="/api/auxiliary/media/plain" mime="image/png" filename="plain.png"/>);
        expect(screen.getByRole("img")).toHaveAttribute("src", "/api/auxiliary/media/plain");
        expect(screen.queryByRole("button")).toBeNull();
    });
});

describe("MediaPreviewContent with a flagged video (D177)", () => {
    it("asks for no video until the viewer shows it, then plays the video itself", () => {
        const src = "/api/auxiliary/media/flagged-video";
        const {container} = render(<MediaPreviewContent mode="dialog" src={src} mime="video/mp4" filename="clip.mp4" flagged/>);

        // The server holds a flagged video back without ?reveal=1, so nothing may point at it yet.
        expect(container.querySelector("video")).toBeNull();
        fireEvent.click(screen.getByRole("button", {name: /Show/}));

        expect(container.querySelector("video")).toHaveAttribute("src", `${src}?reveal=1`);
        expect(screen.queryByText("May contain nudity")).toBeNull();
    });
});

describe("MediaPreviewContent with a flagged PDF (D177)", () => {
    it("loads nothing until the viewer shows it, then the original", () => {
        const src = "/api/auxiliary/media/flagged-pdf";
        render(<MediaPreviewContent mode="thumb" src={src} mime="application/pdf" filename="brochure.pdf" flagged/>);

        // A document has no blurred copy: the server holds it back without ?reveal=1.
        expect(screen.queryByTestId("pdf-thumb")).toBeNull();
        fireEvent.click(screen.getByRole("button", {name: /^Show/}));

        expect(screen.getByTestId("pdf-thumb")).toHaveTextContent(`${src}?reveal=1`);
    });
});
