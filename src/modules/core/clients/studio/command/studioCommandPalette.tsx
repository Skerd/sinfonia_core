import {useEffect, useMemo, useState} from "react";
import {IconForms, IconLayoutSidebarRightExpand, IconTable} from "@tabler/icons-react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@coreModule/components/ui/command.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import type {StudioCatalog} from "../catalog/useStudioCatalog.ts";
import {TABLE_TARGET, type StudioTarget} from "../studioTarget.ts";

type StudioCommandPaletteProps = {
    catalog: StudioCatalog;
    onSelect: (target: StudioTarget) => void;
    /** Extra one-shot commands for whatever is open, e.g. Export or Reset. */
    actions?: {id: string; label: string; run: () => void}[];
};

/**
 * ⌘K over every view in the catalog.
 *
 * Reaching a view is otherwise: filter the model list, scroll, click the model, click the
 * view — across 327 targets. Typing "unit sheet" is the whole interaction instead.
 *
 * Mirrors the panel's own {@link import("@coreModule/components/custom/commandPalette.tsx")}
 * — same `CommandDialog` primitives and the same ⌘K binding — so the two behave alike.
 */
function viewKeyLabel(viewKey: string): string {
    if (viewKey === "sheet") return "Sheet";
    if (viewKey === "form:create") return "Form · create";
    if (viewKey === "form:edit") return "Form · edit";
    if (viewKey === TABLE_TARGET) return "Table";
    return viewKey;
}

function ViewIcon({viewKey}: {viewKey: string}) {
    if (viewKey === TABLE_TARGET) return <IconTable className="size-3.5 shrink-0" />;
    if (viewKey.startsWith("form")) return <IconForms className="size-3.5 shrink-0" />;
    return <IconLayoutSidebarRightExpand className="size-3.5 shrink-0" />;
}

export default function StudioCommandPalette({
    catalog,
    onSelect,
    actions = [],
}: StudioCommandPaletteProps) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                setOpen((value) => !value);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    const targets = useMemo(() => {
        const list: {target: StudioTarget; label: string; search: string; hasDraft: boolean}[] = [];
        for (const entry of catalog.entries) {
            const viewKeys = [
                ...entry.viewKeys,
                ...(entry.columns.length > 0 ? [TABLE_TARGET] : []),
            ];
            for (const viewKey of viewKeys) {
                list.push({
                    target: {collection: entry.collection, viewKey},
                    label: viewKeyLabel(viewKey),
                    /* cmdk filters on this string, so both halves must be in it. */
                    search: `${entry.collection} ${viewKeyLabel(viewKey)} ${viewKey}`,
                    hasDraft: false,
                });
            }
        }
        return list;
    }, [catalog.entries]);

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Jump to a view, or run a command…" />
            <CommandList>
                <CommandEmpty>Nothing matches.</CommandEmpty>

                {actions.length > 0 && (
                    <CommandGroup heading="Actions">
                        {actions.map((action) => (
                            <CommandItem
                                key={action.id}
                                value={action.label}
                                onSelect={() => {
                                    setOpen(false);
                                    action.run();
                                }}
                            >
                                {action.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                <CommandGroup heading={`Views (${targets.length})`}>
                    {targets.map((item) => (
                        <CommandItem
                            key={`${item.target.collection}:${item.target.viewKey}`}
                            value={item.search}
                            onSelect={() => {
                                setOpen(false);
                                onSelect(item.target);
                            }}
                        >
                            <ViewIcon viewKey={item.target.viewKey} />
                            <span className="font-mono">{item.target.collection}</span>
                            <Badge variant="outline" className="ml-auto text-3xs">
                                {item.label}
                            </Badge>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
