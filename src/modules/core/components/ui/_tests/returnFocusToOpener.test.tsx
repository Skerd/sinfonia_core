import {type ReactNode, useState} from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {describe, expect, it} from "vitest";
import {Button} from "@coreModule/components/ui/button.tsx";
import {AlertDialog, AlertDialogContent, AlertDialogTitle} from "@coreModule/components/ui/alert-dialog.tsx";
import {Sheet, SheetContent, SheetTitle} from "@coreModule/components/ui/sheet.tsx";

type Surface = {
    role: "alertdialog" | "dialog";
    render: (open: boolean, setOpen: (open: boolean) => void, content: ReactNode) => ReactNode;
};

/** The surfaces TD-F140 covers; DialogContent has its own test (`dialogContentFocus.test.tsx`). */
const surfaces: Record<string, Surface> = {
    AlertDialogContent: {
        role: "alertdialog",
        render: (open, setOpen, content) => (
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent aria-describedby={undefined}>
                    <AlertDialogTitle>Hide the post?</AlertDialogTitle>
                    {content}
                </AlertDialogContent>
            </AlertDialog>
        ),
    },
    SheetContent: {
        role: "dialog",
        render: (open, setOpen, content) => (
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent aria-describedby={undefined}>
                    <SheetTitle>Hide the post?</SheetTitle>
                    {content}
                </SheetContent>
            </Sheet>
        ),
    },
};

/** Opened from its own button (controlled `open`, no Trigger), as most panel confirmations and sheets are. */
function Harness({surface}: {surface: Surface}) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button type="button" onClick={() => setOpen(true)}>Hide post</Button>
            {surface.render(open, setOpen, <Button type="button">Confirm</Button>)}
        </>
    );
}

describe.each(Object.entries(surfaces))("%s focus return (TD-F140)", (_name, surface) => {
    it("gives focus back to the button that opened it", async () => {
        render(<Harness surface={surface}/>);
        const opener = screen.getByRole("button", {name: "Hide post"});
        opener.focus();
        fireEvent.click(opener);
        const content = await screen.findByRole(surface.role, {name: "Hide the post?"});
        // The user works inside before closing, so focus is no longer on the opener.
        screen.getByRole("button", {name: "Confirm"}).focus();
        fireEvent.keyDown(content, {key: "Escape"});

        await waitFor(() => expect(screen.queryByRole(surface.role)).toBeNull());
        await waitFor(() => expect(document.activeElement).toBe(opener));
    });
});
