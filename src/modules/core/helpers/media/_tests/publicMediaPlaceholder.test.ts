import {beforeAll, describe, expect, it} from "vitest";
import {PUBLIC_MEDIA_PLACEHOLDER, showPlaceholderForMissingPublicMedia} from "@coreModule/helpers/media/publicMediaPlaceholder.ts";

function failToLoad(src: string): HTMLImageElement {
    const image = document.createElement("img");
    image.src = src;
    document.body.appendChild(image);
    image.dispatchEvent(new Event("error"));
    return image;
}

describe("showPlaceholderForMissingPublicMedia (D177)", () => {
    beforeAll(() => showPlaceholderForMissingPublicMedia(document));

    it("shows a placeholder for a public media image the server did not send", () => {
        const image = failToLoad("http://shop.localhost/api/auxiliary/public/media/6b0309d9ac433659b22b0297");
        expect(image.src).toBe(PUBLIC_MEDIA_PLACEHOLDER);
        expect(image.dataset.mediaPlaceholder).toBe("true");
    });

    it("leaves other images alone", () => {
        const image = failToLoad("http://shop.localhost/assets/hero.jpg");
        expect(image.src).toBe("http://shop.localhost/assets/hero.jpg");
    });
});
