import {describe, expect, it} from "vitest";
import {visibleInlineCount} from "@coreModule/components/entityPage/list/table/tableCellPrimitives.tsx";

/** `"+N more"` grows with the digit count; tests use a measured-like stand-in. */
function overflowWidth(hiddenCount: number): number {
    const digits = String(hiddenCount).length;
    return 40 + digits * 8;
}

describe("visibleInlineCount", () => {
    it("keeps max when the container has no layout yet", () => {
        expect(
            visibleInlineCount({
                itemCount: 4,
                itemWidths: [80, 80, 80],
                max: 3,
                containerWidth: 0,
                gap: 4,
                overflowWidthFor: overflowWidth,
            }),
        ).toBe(3);
    });

    it("shows max pills when they and the counter fit", () => {
        expect(
            visibleInlineCount({
                itemCount: 4,
                itemWidths: [40, 40, 40],
                max: 3,
                containerWidth: 220,
                gap: 4,
                overflowWidthFor: overflowWidth,
            }),
        ).toBe(3);
    });

    it("folds the last pill into +N when max pills would clip the counter", () => {
        /* 80+4+80+4+80+4+48 = 300, far past a 204px cell (220px column minus p-2). */
        expect(
            visibleInlineCount({
                itemCount: 4,
                itemWidths: [80, 80, 80],
                max: 3,
                containerWidth: 204,
                gap: 4,
                overflowWidthFor: overflowWidth,
            }),
        ).toBe(1);
    });

    it("can collapse to only the counter when even one pill plus +N does not fit", () => {
        expect(
            visibleInlineCount({
                itemCount: 4,
                itemWidths: [180, 180, 180],
                max: 3,
                containerWidth: 64,
                gap: 4,
                overflowWidthFor: overflowWidth,
            }),
        ).toBe(0);
    });

    it("does not render a counter when every item fits under max", () => {
        expect(
            visibleInlineCount({
                itemCount: 2,
                itemWidths: [60, 60],
                max: 3,
                containerWidth: 204,
                gap: 4,
                overflowWidthFor: overflowWidth,
            }),
        ).toBe(2);
    });
});
