import {useState} from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {describe, expect, it} from "vitest";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Dialog, DialogContent, DialogTitle} from "@coreModule/components/ui/dialog.tsx";

type HarnessProps = Pick<React.ComponentProps<typeof DialogContent>, "onOpenAutoFocus" | "onCloseAutoFocus">;

/** A card dialog opened from its own button (controlled `open`, no DialogTrigger), as most panel dialogs are. */
function Harness(props: HarnessProps) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button type="button" onClick={() => setOpen(true)}>Archive</Button>
            <Button type="button">Elsewhere</Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent aria-describedby={undefined} {...props}>
                    <DialogTitle>Archive the post?</DialogTitle>
                    <Button type="button">Confirm</Button>
                </DialogContent>
            </Dialog>
        </>
    );
}

async function openAndClose(): Promise<HTMLElement> {
    const opener = screen.getByRole("button", {name: "Archive"});
    opener.focus();
    fireEvent.click(opener);
    const dialog = await screen.findByRole("dialog", {name: "Archive the post?"});
    // The user works inside the dialog before closing it, so focus is no longer on the opener.
    const confirm = screen.getByRole("button", {name: "Confirm"});
    confirm.focus();
    expect(document.activeElement).toBe(confirm);
    fireEvent.keyDown(dialog, {key: "Escape"});
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    return opener;
}

describe("DialogContent focus return (TD-F139)", () => {
    it("gives focus back to the button that opened it", async () => {
        render(<Harness />);
        const opener = await openAndClose();
        await waitFor(() => expect(document.activeElement).toBe(opener));
    });

    it("still returns focus when the dialog keeps focus off its first field", async () => {
        render(<Harness onOpenAutoFocus={(event) => event.preventDefault()} />);
        const opener = await openAndClose();
        await waitFor(() => expect(document.activeElement).toBe(opener));
    });

    it("leaves focus to a caller that places it itself", async () => {
        render(
            <Harness
                onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    screen.getByRole("button", {name: "Elsewhere"}).focus();
                }}
            />,
        );
        await openAndClose();
        await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", {name: "Elsewhere"})));
    });
});
