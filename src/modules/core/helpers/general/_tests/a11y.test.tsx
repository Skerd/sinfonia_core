import {fireEvent, render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import {buttonLike} from "@coreModule/helpers/general/a11y.ts";

describe("buttonLike (D23)", () => {
    it("is a focusable button that Enter and Space activate like a click, once each", () => {
        const onActivate = vi.fn();
        const onParentClick = vi.fn();
        render(
            <div role="presentation" onClick={onParentClick}>
                <div {...buttonLike(onActivate)}>Row</div>
            </div>,
        );
        const row = screen.getByRole("button", {name: "Row"});
        expect(row.tabIndex).toBe(0);

        fireEvent.keyDown(row, {key: "Enter"});
        fireEvent.keyDown(row, {key: " "});
        fireEvent.keyDown(row, {key: "a"});
        expect(onActivate).toHaveBeenCalledTimes(2);
        // A real click, so listeners higher up (a popover trigger) see it too.
        expect(onParentClick).toHaveBeenCalledTimes(2);
    });
});
