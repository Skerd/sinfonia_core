/** Path every public media URL contains (maestro `publicMediaUrl`). */
const PUBLIC_MEDIA_PATH = "/api/auxiliary/public/media/";

/** A neutral grey picture in the shape of a photo. */
export const PUBLIC_MEDIA_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 3"><rect width="4" height="3" fill="#e5e7eb"/></svg>',
)}`;

/**
 * On a public page, a media image the server no longer sends shows a neutral placeholder instead of a broken-image
 * icon. Visitors are not sent files the content check flagged until a reviewer approves them (D177), and public pages
 * get only URLs, so the page learns it from the failed load. One capture listener covers every image on the page.
 */
export function showPlaceholderForMissingPublicMedia(root: Document = document): void {
    root.addEventListener("error", (event) => {
        const image = event.target;
        if (!(image instanceof HTMLImageElement) || image.dataset.mediaPlaceholder) return;
        if (!(image.currentSrc || image.src).includes(PUBLIC_MEDIA_PATH)) return;
        image.dataset.mediaPlaceholder = "true";
        image.removeAttribute("srcset");
        image.src = PUBLIC_MEDIA_PLACEHOLDER;
    }, true);
}
