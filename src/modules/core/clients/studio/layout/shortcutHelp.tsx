import {useEffect, useState} from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@coreModule/components/ui/dialog.tsx";
import {Kbd, KbdGroup} from "@coreModule/components/ui/kbd.tsx";

/**
 * The keyboard surface, in one place.
 *
 * These shortcuts have existed for a while with nothing announcing them — the only way to
 * discover `⌘D` or `/` was to read `viewEditor.tsx`. A tool with hidden shortcuts
 * effectively has none.
 */
const SHORTCUTS: {keys: string[]; what: string}[] = [
    {keys: ["⌘", "K"], what: "Jump to any view"},
    {keys: ["⌘", "Z"], what: "Undo (⇧ to redo)"},
    {keys: ["⌘", "D"], what: "Duplicate the selected node"},
    {keys: ["⌫"], what: "Delete the selected node"},
    {keys: ["↑", "↓"], what: "Walk the tree"},
    {keys: ["←", "→"], what: "Collapse / expand a node"},
    {keys: ["/"], what: "Focus the palette filter"},
    {keys: ["?"], what: "This list"},
];

export default function ShortcutHelp() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "?") return;
            /* Inert while typing — `?` is a character before it is a command. */
            const target = event.target as HTMLElement | null;
            const tag = target?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) {
                return;
            }
            event.preventDefault();
            setOpen((value) => !value);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Keyboard shortcuts</DialogTitle>
                    <DialogDescription>
                        Everything except ⌘K and ? applies to the selected node, and none of them
                        fire while a field has focus.
                    </DialogDescription>
                </DialogHeader>
                <ul className="flex flex-col gap-1.5">
                    {SHORTCUTS.map((shortcut) => (
                        <li key={shortcut.what} className="flex items-center justify-between gap-4">
                            <span className="text-2xs">{shortcut.what}</span>
                            <KbdGroup>
                                {shortcut.keys.map((key) => (
                                    <Kbd key={key}>{key}</Kbd>
                                ))}
                            </KbdGroup>
                        </li>
                    ))}
                </ul>
            </DialogContent>
        </Dialog>
    );
}
