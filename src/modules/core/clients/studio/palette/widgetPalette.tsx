import {useMemo, useState} from "react";
import {useDraggable} from "@dnd-kit/core";
import {IconSearch} from "@tabler/icons-react";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Switch} from "@coreModule/components/ui/switch.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {getWidgetMeta} from "@coreModule/components/viewEngine/widgetRegistry.ts";
import {cn} from "@coreModule/components/lib/utils.ts";
import {PALETTE_PREFIX} from "../tree/treeProjection.ts";
import {buildPaletteGroups, isContainerToken} from "./widgetCatalog.ts";

type WidgetPaletteProps = {
    /** Click-to-append, for when dragging into an empty tree is awkward. */
    onAppend: (token: string) => void;
    /** View type being edited; widgets that do nothing here are hidden by default. */
    mode: "sheet" | "form";
};

function chipTitle(token: string): string {
    const meta = getWidgetMeta(token);
    const parts = [
        `Drag into the tree, or click to append${isContainerToken(token) ? " (container)" : ""}`,
    ];
    if (meta?.docs) parts.push(meta.docs);
    if (meta) parts.push(`Modes: ${meta.modes.join(", ")}`);
    else parts.push("No metadata — shown in every mode.");
    return parts.join("\n");
}

function PaletteChip({token, onAppend}: {token: string; onAppend: () => void}) {
    const {attributes, listeners, setNodeRef, isDragging} = useDraggable({
        id: `${PALETTE_PREFIX}${token}`,
    });

    return (
        <button
            ref={setNodeRef}
            type="button"
            onClick={onAppend}
            title={chipTitle(token)}
            className={cn(
                "cursor-grab rounded border px-1.5 py-0.5 font-mono text-3xs transition-colors active:cursor-grabbing",
                isContainerToken(token)
                    ? "border-primary/40 text-primary hover:bg-primary/10"
                    : "hover:bg-muted",
                isDragging && "opacity-40",
            )}
            {...attributes}
            {...listeners}
        >
            {token}
        </button>
    );
}

export default function WidgetPalette({onAppend, mode}: WidgetPaletteProps) {
    const [query, setQuery] = useState("");
    const [showAll, setShowAll] = useState(false);

    /*
     * Built per mode: `getRegisteredWidgetTokens()` applies module contributions lazily
     * on first call, and neither the registry nor the metadata changes afterwards.
     */
    const groups = useMemo(
        () => buildPaletteGroups(showAll ? {} : {mode}),
        [mode, showAll],
    );
    const allGroups = useMemo(() => buildPaletteGroups(), []);

    const hiddenCount = useMemo(() => {
        const shown = new Set(groups.flatMap((group) => group.tokens));
        return allGroups.flatMap((group) => group.tokens).filter((token) => !shown.has(token)).length;
    }, [groups, allGroups]);

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return groups;
        return groups
            .map((group) => ({
                ...group,
                tokens: group.tokens.filter((token) => token.toLowerCase().includes(needle)),
            }))
            .filter((group) => group.tokens.length > 0);
    }, [groups, query]);

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-center gap-2 border-b px-2">
                <IconSearch className="size-3.5 shrink-0 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filter widgets"
                    className="h-8 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
                />
            </div>

            <div className="flex shrink-0 items-center justify-between gap-2 border-b px-2 py-1">
                <Label htmlFor="palette-show-all" className="text-3xs text-muted-foreground">
                    {showAll
                        ? "Showing every registered widget"
                        : `Widgets for ${mode} views${hiddenCount > 0 ? ` · ${hiddenCount} hidden` : ""}`}
                </Label>
                <Switch
                    id="palette-show-all"
                    checked={showAll}
                    onCheckedChange={setShowAll}
                    aria-label="Show widgets from every mode"
                />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {filtered.map((group) => (
                    <div key={group.id} className="mb-3">
                        <p className="mb-1 text-3xs font-medium uppercase tracking-wide text-muted-foreground">
                            {group.label}
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {group.tokens.map((token) => (
                                <PaletteChip
                                    key={token}
                                    token={token}
                                    onAppend={() => onAppend(token)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <p className="px-1 py-4 text-center text-3xs text-muted-foreground">
                        Nothing matches. Turn on the switch above to include widgets from other
                        modes.
                    </p>
                )}
            </div>
        </div>
    );
}
