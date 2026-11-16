import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {jumpToMessage} from "../jumpToMessage.ts";

describe("jumpToMessage (reply quote → original)", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // jsdom does not lay out, so it has no scrolling of its own.
        Element.prototype.scrollIntoView = vi.fn();
    });

    afterEach(() => {
        vi.useRealTimers();
        document.body.innerHTML = "";
    });

    it("says so when the original is not loaded", () => {
        expect(jumpToMessage("missing")).toBe(false);
    });

    it("scrolls to the original and flashes it until the highlight ends", () => {
        document.body.innerHTML = `<div id="message-abc"><p>original</p></div>`;
        const row = document.getElementById("message-abc")!;

        expect(jumpToMessage("abc")).toBe(true);
        expect(row.scrollIntoView).toHaveBeenCalledWith({behavior: "smooth", block: "center"});
        expect(row.getAttribute("data-flash")).toBe("true");

        // A child's animation ending does not end the row's flash.
        row.querySelector("p")!.dispatchEvent(new Event("animationend", {bubbles: true}));
        expect(row.getAttribute("data-flash")).toBe("true");

        row.dispatchEvent(new Event("animationend"));
        expect(row.hasAttribute("data-flash")).toBe(false);
    });

    it("clears the highlight by itself when no animation runs (reduced motion)", () => {
        document.body.innerHTML = `<div id="message-abc"></div>`;
        jumpToMessage("abc");
        vi.advanceTimersByTime(2400);
        expect(document.getElementById("message-abc")!.hasAttribute("data-flash")).toBe(false);
    });
});
