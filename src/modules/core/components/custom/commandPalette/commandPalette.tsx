import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@coreModule/components/ui/command.tsx";
import {Kbd} from "@coreModule/components/ui/kbd.tsx";
import {COMMAND_PALETTE_OPEN_EVENT} from "./commandPaletteShortcut.tsx";
import {getModuleSidebarNavGroups} from "@coreModule/helpers/moduleContributions/loadSidebarContributions.ts";
import {flattenPanelNavLinks} from "@coreModule/helpers/navigation/flattenPanelNavLinks.ts";
import {filterNavGroups} from "@coreModule/helpers/navigation/filterNavByAccess.ts";
import {useAccessHydrated, useAccessMap} from "@coreModule/helpers/context/accessContext.tsx";
import withLanguage, {type WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";

type CommandPaletteProps = WithLanguageType & {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};

/**
 * Global ⌘K / Ctrl+K launcher over every sidebar leaf route. The home page
 * search and the sidebar are both incomplete entry points (~30 flat items vs
 * ~110 list pages); one keyboard surface covers them all.
 */
function CommandPalette({resolveLanguageKey, open: openProp, onOpenChange}: CommandPaletteProps) {
    const navigate = useNavigate();
    const accessMap = useAccessMap();
    const accessHydrated = useAccessHydrated();

    // Standard controlled/uncontrolled split: `open` alone is not enough to drive the dialog, so a
    // caller passing only `onOpenChange` must still get working internal state — previously that
    // combination left the palette permanently shut, since nothing ever wrote `internalOpen`.
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = openProp !== undefined;
    const open = isControlled ? openProp : internalOpen;

    const setOpen = useCallback(
        (next: boolean) => {
            if (!isControlled) setInternalOpen(next);
            onOpenChange?.(next);
        },
        [isControlled, onOpenChange],
    );

    const links = useMemo(() => {
        const groups = getModuleSidebarNavGroups(resolveLanguageKey);
        return flattenPanelNavLinks(filterNavGroups(groups, accessMap, accessHydrated));
    }, [resolveLanguageKey, accessMap, accessHydrated]);

    const byGroup = useMemo(() => {
        const map = new Map<string, typeof links>();
        for (const link of links) {
            const list = map.get(link.groupTitle) ?? [];
            list.push(link);
            map.set(link.groupTitle, list);
        }
        return map;
    }, [links]);

    // The window listeners are bound once. Reading `open`/`setOpen` from refs keeps them out of the
    // dependency list, which otherwise tore down and re-bound both listeners on every toggle.
    const latest = useRef({open, setOpen});
    latest.current = {open, setOpen};

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            // A held-down shortcut repeats; without this it flickers the dialog open and shut.
            if (event.repeat) return;
            if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;
            event.preventDefault();
            latest.current.setOpen(!latest.current.open);
        };
        const onOpenEvent = () => latest.current.setOpen(true);

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener(COMMAND_PALETTE_OPEN_EVENT, onOpenEvent);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, onOpenEvent);
        };
    }, []);

    return (
        <CommandDialog
            open={open}
            onOpenChange={setOpen}
            title={resolveLanguageKey("title")}
            description={resolveLanguageKey("description")}
        >
            <CommandInput placeholder={resolveLanguageKey("placeholder")}/>
            <CommandList>
                <CommandEmpty>{resolveLanguageKey("empty")}</CommandEmpty>
                {[...byGroup.entries()].map(([group, items]) => (
                    <CommandGroup key={group} heading={group}>
                        {items.map((link) => {
                            const Icon = link.icon;
                            return (
                                <CommandItem
                                    key={link.url}
                                    value={`${link.groupTitle} ${link.title} ${link.url}`}
                                    onSelect={() => {
                                        setOpen(false);
                                        navigate(link.url);
                                    }}
                                >
                                    {Icon ? <Icon className="size-4 shrink-0 opacity-70"/> : null}
                                    <span className="truncate">{link.title}</span>
                                </CommandItem>
                            );
                        })}
                    </CommandGroup>
                ))}
            </CommandList>

            {/* The footer used to show ⌘K — the shortcut you just pressed to get here. What is
                actually unknown at this point is how to drive the list. */}
            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 border-t px-3 py-2 text-2xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                    <Kbd>↑</Kbd><Kbd>↓</Kbd>
                    {resolveLanguageKey("navigate")}
                </span>
                <span className="inline-flex items-center gap-1">
                    <Kbd>↵</Kbd>
                    {resolveLanguageKey("select")}
                </span>
                <span className="inline-flex items-center gap-1">
                    <Kbd>esc</Kbd>
                    {resolveLanguageKey("close")}
                </span>
            </div>
        </CommandDialog>
    );
}

export default withLanguage("src/modules/core/components/custom/commandPalette/commandPalette.tsx")(CommandPalette);

export {CommandPalette};
