import {useRef} from "react";
import type {LucideIcon} from "lucide-react";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";

/** Colour treatment for the row; `neutral` inherits the menu's own colour. */
type ActionTone = "neutral" | "destructive" | "success";

const TONE_CLASS: Record<ActionTone, string | undefined> = {
    neutral: undefined,
    destructive: "text-destructive",
    success: "text-success",
};

type ActionDropdownItemProps = {
    label: string;
    Icon: LucideIcon;
    /** Key handed to `useKeyboardShortcuts` (e.g. `"E"`, `"Backspace"`). */
    shortcutKey: string;
    /** What the row shows after the ⌘ glyph (e.g. `"E"`, `"⌫"`). */
    shortcutLabel: string;
    /** False renders the access placeholder instead of the row. */
    allowed: boolean;
    onSelect: () => void;
    tone?: ActionTone;
};

/**
 * One row of the entity action menu: icon, label, ⌘-shortcut, and an access check.
 *
 * The view/edit/delete/restore rows were four copies of this, differing only in icon,
 * permission, shortcut and colour. Each of those files still exists — they carry their own
 * `withLanguage` dictionary path, which is resolved from the file's literal location — but
 * the behaviour lives here.
 */
export function ActionDropdownItem({
    label,
    Icon,
    shortcutKey,
    shortcutLabel,
    allowed,
    onSelect,
    tone = "neutral",
}: ActionDropdownItemProps) {
    const ref = useRef<HTMLDivElement | null>(null);

    // Prefer clicking the real row so the menu closes and Radix runs its own select handling;
    // fall back to the callback when the row is not mounted.
    useKeyboardShortcuts(shortcutKey, () => {
        if (ref.current) ref.current.click();
        else onSelect();
    });

    if (!allowed) return <HiddenElement/>;

    const toneClass = TONE_CLASS[tone];

    return (
        <DropdownMenuItem ref={ref} onClick={onSelect}>
            <Icon className={cn(toneClass)} size={16}/>
            <p className={cn(toneClass)}>{label}</p>
            <DropdownMenuShortcut className={cn(toneClass)}>⌘{shortcutLabel}</DropdownMenuShortcut>
        </DropdownMenuItem>
    );
}

export default ActionDropdownItem;
