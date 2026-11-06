import {useState} from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {describe, expect, it} from "vitest";
import {Dialog, DialogFrame} from "@coreModule/components/ui/dialog.tsx";

/** A modal opened from its own button, the way the public sites' drawers and lightboxes are. */
function Harness() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button type="button" onClick={() => setOpen(true)}>Filters</button>
            {open ? (
                <Dialog open onOpenChange={(next) => !next && setOpen(false)}>
                    <DialogFrame title="Filter projects" overlayClassName="backdrop" className="panel">
                        <button type="button">Apply</button>
                    </DialogFrame>
                </Dialog>
            ) : null}
        </>
    );
}

describe("DialogFrame (D23)", () => {
    it("is named by its title, takes focus, and gives it back to the opener when Escape closes it", async () => {
        render(<Harness />);
        const opener = screen.getByRole("button", {name: "Filters"});
        opener.focus();
        fireEvent.click(opener);

        const dialog = await screen.findByRole("dialog", {name: "Filter projects"});
        await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

        fireEvent.keyDown(document.activeElement ?? dialog, {key: "Escape"});
        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
        await waitFor(() => expect(document.activeElement).toBe(opener));
    });

    it("closes on a click on the backdrop around the content", async () => {
        render(<Harness />);
        fireEvent.click(screen.getByRole("button", {name: "Filters"}));
        await screen.findByRole("dialog");

        const backdrop = document.querySelector(".backdrop");
        expect(backdrop).not.toBeNull();
        fireEvent.pointerDown(backdrop!);
        fireEvent.click(backdrop!);
        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });
});
