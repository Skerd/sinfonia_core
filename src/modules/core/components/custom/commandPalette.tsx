import {useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@coreModule/components/ui/command.tsx";
import {Kbd, KbdGroup} from "@coreModule/components/ui/kbd.tsx";
import {getPanelNavGroups} from "@coreModule/helpers/panel/panelNavGroups.ts";
import {flattenPanelNavLinks} from "@coreModule/helpers/panel/flattenPanelNavLinks.ts";
import withLanguage, {type WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";

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
    const [internalOpen, setInternalOpen] = useState(false);
    const open = openProp ?? internalOpen;
    const setOpen = onOpenChange ?? setInternalOpen;
    const navigate = useNavigate();

    const links = useMemo(() => {
        const groups = getPanelNavGroups(resolveLanguageKey);
        return flattenPanelNavLinks(groups);
    }, [resolveLanguageKey]);

    const byGroup = useMemo(() => {
        const map = new Map<string, typeof links>();
        for (const link of links) {
            const list = map.get(link.groupTitle) ?? [];
            list.push(link);
            map.set(link.groupTitle, list);
        }
        return map;
    }, [links]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOpen(!open);
            }
        };
        const onOpenEvent = () => setOpen(true);
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("panel:open-command-palette", onOpenEvent);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("panel:open-command-palette", onOpenEvent);
        };
    }, [open, setOpen]);

    return (
        <CommandDialog
            open={open}
            onOpenChange={setOpen}
            title={String(resolveLanguageKey("commandPalette.title") || "Command palette")}
            description={String(resolveLanguageKey("commandPalette.description") || "Jump to any page")}
        >
            <CommandInput
                placeholder={String(resolveLanguageKey("commandPalette.placeholder") || "Search pages…")}
            />
            <CommandList>
                <CommandEmpty>
                    {String(resolveLanguageKey("commandPalette.empty") || "No matching pages")}
                </CommandEmpty>
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
                                    {Icon ? <Icon className="size-4 shrink-0 opacity-70" /> : null}
                                    <span className="truncate">{link.title}</span>
                                </CommandItem>
                            );
                        })}
                    </CommandGroup>
                ))}
            </CommandList>
            <div className="flex items-center justify-end gap-2 border-t px-3 py-2 text-2xs text-muted-foreground">
                <KbdGroup>
                    <Kbd>⌘</Kbd>
                    <Kbd>K</Kbd>
                </KbdGroup>
            </div>
        </CommandDialog>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/sidebar/index.tsx"),
)(CommandPalette);

export {CommandPalette};
