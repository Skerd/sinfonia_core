import {beforeEach, describe, expect, it} from "vitest";
import {
    deviceById,
    isMobileViewport,
    MOBILE_BREAKPOINT,
    PREVIEW_DEVICES,
    scaleToFit,
} from "./previewDevice.ts";

describe("deviceById", () => {
    it("falls back to desktop for an unknown id", () => {
        expect(deviceById("tablet").id).toBe("tablet");
        expect(deviceById("watch").id).toBe("desktop");
    });
});

describe("isMobileViewport", () => {
    it("answers null for desktop, so the window keeps deciding", () => {
        expect(isMobileViewport(deviceById("desktop"))).toBeNull();
    });

    it("agrees with the css breakpoint the app's own hook uses", () => {
        expect(isMobileViewport(deviceById("mobile"))).toBe(true);
        expect(isMobileViewport(deviceById("tablet"))).toBe(false);
        for (const device of PREVIEW_DEVICES) {
            if (device.width == null) continue;
            expect(isMobileViewport(device)).toBe(device.width < MOBILE_BREAKPOINT);
        }
    });
});

describe("scaleToFit", () => {
    it("shrinks a frame wider than the pane", () => {
        expect(scaleToFit(800, 400)).toBe(0.5);
    });

    it("never scales up", () => {
        expect(scaleToFit(390, 1200)).toBe(1);
    });

    it("survives a pane that has not been measured yet", () => {
        expect(scaleToFit(390, 0)).toBe(1);
        expect(scaleToFit(390, Number.NaN)).toBe(1);
    });
});

describe("usePreviewDevice storage", () => {
    beforeEach(() => localStorage.clear());

    it("starts on desktop and remembers a choice", async () => {
        const {act, renderHook} = await import("@testing-library/react");
        const {usePreviewDevice} = await import("./previewDevice.ts");

        const {result} = renderHook(() => usePreviewDevice());
        expect(result.current[0].id).toBe("desktop");

        act(() => result.current[1]("mobile"));
        expect(result.current[0].id).toBe("mobile");

        expect(renderHook(() => usePreviewDevice()).result.current[0].id).toBe("mobile");
    });
});
