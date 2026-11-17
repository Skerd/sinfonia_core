import {act, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";
import {useState} from "react";
import TooltipDisplayer from "../tooltipDisplayer.tsx";
import {TooltipProvider} from "@coreModule/components/ui/tooltip.tsx";

function InlineEdit() {
    const [editing, setEditing] = useState(true);
    return editing ? (
        <TooltipDisplayer tooltip="Cancel">
            <button type="button" onClick={() => setEditing(false)}>x</button>
        </TooltipDisplayer>
    ) : <p>done</p>;
}

afterEach(() => vi.useRealTimers());

// TD-F126: cancelling an inline edit before its "Cancel" tooltip had appeared left that tooltip open in the top-left
// corner: the delayed show fired after the button was gone.
describe("tooltip of a trigger that goes away", () => {
    it("never appears once the trigger is pressed or gone", () => {
        vi.useFakeTimers();
        // As in the panel: one provider above the page, so it outlives the editor.
        render(<TooltipProvider><InlineEdit/></TooltipProvider>);
        const button = screen.getByRole("button");
        fireEvent.mouseEnter(button);
        fireEvent.pointerDown(button);
        fireEvent.click(button);
        act(() => vi.advanceTimersByTime(2_000));

        expect(screen.getByText("done")).toBeTruthy();
        expect(screen.queryByText("Cancel")).toBeNull();
    });
});
