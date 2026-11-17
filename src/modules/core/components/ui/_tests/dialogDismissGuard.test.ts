import {afterEach, describe, expect, it, vi} from "vitest";
import {armDialogDismissGuard, isDialogDismissGuarded} from "../dialog.tsx";

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

// TD-F132: the guard's timer read the global `document` 500 ms later; once a test's jsdom was torn down it threw
// "document is not defined" and failed a whole sinfonia run although every test had passed.
describe("dialog dismiss guard", () => {
    it("swallows the click under a closing overlay, then lets clicks through", () => {
        vi.useFakeTimers();
        const clicked = vi.fn();
        document.body.addEventListener("click", clicked);
        armDialogDismissGuard();
        expect(isDialogDismissGuarded()).toBe(true);

        document.body.click();
        expect(clicked).not.toHaveBeenCalled();

        vi.advanceTimersByTime(600);
        document.body.click();
        expect(clicked).toHaveBeenCalledTimes(1);
        document.body.removeEventListener("click", clicked);
    });

    it("ends its timer without the global document (a torn-down page)", () => {
        vi.useFakeTimers();
        armDialogDismissGuard();
        vi.stubGlobal("document", undefined);

        expect(() => vi.advanceTimersByTime(600)).not.toThrow();
    });
});
