import {useEffect, useMemo, useState} from "react";
import {
    IconSearch,
    IconTable,
    IconForms,
    IconLayoutSidebarRightExpand,
    IconPlus,
    IconChevronDown,
    IconChevronRight,
} from "@tabler/icons-react";
import type {ViewConfig} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {Button} from "@coreModule/components/ui/button.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import NewViewDialog from "./newViewDialog.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Skeleton} from "@coreModule/components/ui/skeleton.tsx";
import type {StudioCatalog, StudioModelEntry} from "./useStudioCatalog.ts";
import {groupByModule} from "./studioModules.ts";
import {usePersistedIdSet} from "./usePersistedIdSet.ts";
import {checkedProgress, useCheckedTargets, type CheckedTargets} from "./checkedTargets.ts";
import {Checkbox} from "@coreModule/components/ui/checkbox.tsx";
import {TABLE_TARGET, type StudioTarget} from "../studioTarget.ts";

/** Collapse state lives per browser, like the pane splitters. */
const COLLAPSED_MODULES_KEY = "studio:catalog:collapsedModules:v1";
const EXPANDED_MODELS_KEY = "studio:catalog:expandedModels:v1";

type ModelCatalogPaneProps = {
    catalog: StudioCatalog;
    selected: StudioTarget | null;
    onSelect: (target: StudioTarget) => void;
    /** Collections with an unexported draft, for the dot marker. */
    draftedCollections: ReadonlySet<string>;
    /** Starts a new view as a draft. */
    onCreateView: (collection: string, viewKey: string, config: ViewConfig) => void;
};

function viewKeyLabel(viewKey: string): string {
    if (viewKey === "sheet") return "Sheet";
    if (viewKey === "form:create") return "Form · create";
    if (viewKey === "form:edit") return "Form · edit";
    if (viewKey === TABLE_TARGET) return "Table";
    return viewKey;
}

function ViewKeyIcon({viewKey}: {viewKey: string}) {
    if (viewKey === TABLE_TARGET) return <IconTable className="size-3.5 shrink-0" />;
    if (viewKey.startsWith("form")) return <IconForms className="size-3.5 shrink-0" />;
    return <IconLayoutSidebarRightExpand className="size-3.5 shrink-0" />;
}

function ModelRow({
    entry,
    selected,
    onSelect,
    hasDraft,
    expanded,
    onToggleExpanded,
    checked,
    onCreateView,
}: {
    entry: StudioModelEntry;
    selected: StudioTarget | null;
    onSelect: (target: StudioTarget) => void;
    hasDraft: boolean;
    expanded: boolean;
    onToggleExpanded: () => void;
    checked: CheckedTargets;
    onCreateView: (collection: string, viewKey: string, config: ViewConfig) => void;
}) {
    const [newViewOpen, setNewViewOpen] = useState(false);
    /* A model with no view config still gets a Table row — table columns exist for every
       registered model, views only for those with a `*.views.ts`. */
    const targets = [...entry.viewKeys, ...(entry.columns.length > 0 ? [TABLE_TARGET] : [])];
    const progress = checkedProgress(entry, checked.isChecked);

    return (
        <div className="mb-1">
            {/* The name toggles; the `+` stays a sibling rather than a button inside one. */}
            <div className="flex items-center gap-1.5 px-2 py-1">
                <button
                    type="button"
                    onClick={onToggleExpanded}
                    aria-expanded={expanded}
                    className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md text-left transition-colors hover:text-primary"
                >
                    {expanded ? (
                        <IconChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                        <IconChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate text-sm font-medium">{entry.collection}</span>
                    {hasDraft && (
                        <span
                            aria-label="has unexported draft"
                            className="size-1.5 shrink-0 rounded-full bg-warning"
                        />
                    )}
                    {entry.viewKeys.length === 0 && (
                        <Badge variant="outline" className="text-3xs">
                            no views
                        </Badge>
                    )}
                    {progress.total > 0 && (
                        <TooltipDisplayer
                            tooltip={`${progress.checked} of ${progress.total} target${progress.total === 1 ? "" : "s"} marked as done`}
                        >
                            <span
                                className={cn(
                                    "ml-auto shrink-0 pr-1 text-3xs tabular-nums",
                                    progress.complete ? "text-success" : "text-muted-foreground",
                                )}
                            >
                                {progress.checked}/{progress.total}
                            </span>
                        </TooltipDisplayer>
                    )}
                </button>
                <TooltipDisplayer
                    tooltip={
                        entry.viewKeys.length === 0
                            ? "This model has no *.views.ts — start one from the schema"
                            : "Add a view this model does not have yet"
                    }
                >
                    <Button
                        type="button"
                        aria-label={`New view for ${entry.collection}`}
                        variant="ghost"
                        size="icon"
                        className="size-5 shrink-0"
                        onClick={() => setNewViewOpen(true)}
                    >
                        <IconPlus className="size-3.5" />
                    </Button>
                </TooltipDisplayer>
            </div>

            <NewViewDialog
                entry={entry}
                open={newViewOpen}
                onOpenChange={setNewViewOpen}
                onCreate={(viewKey, config) => onCreateView(entry.collection, viewKey, config)}
            />
            <div className={cn("flex flex-col", !expanded && "hidden")}>
                {targets.map((viewKey) => {
                    const target = {collection: entry.collection, viewKey};
                    const isActive =
                        selected?.collection === entry.collection && selected?.viewKey === viewKey;
                    const isChecked = checked.isChecked(target);
                    return (
                        <div
                            key={viewKey}
                            className={cn(
                                "flex items-center gap-1.5 rounded-md pl-4 pr-2 transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-muted",
                            )}
                        >
                            <button
                                type="button"
                                onClick={() => onSelect(target)}
                                className="flex min-w-0 flex-1 items-center gap-1.5 py-1 text-left text-2xs"
                            >
                                <ViewKeyIcon viewKey={viewKey} />
                                <span className={cn("truncate", isChecked && !isActive && "text-foreground")}>
                                    {viewKeyLabel(viewKey)}
                                </span>
                            </button>
                            <TooltipDisplayer
                                tooltip={
                                    isChecked
                                        ? "Marked as done — click to reopen"
                                        : "Mark this target as done"
                                }
                            >
                                <Checkbox
                                    aria-label={`Mark ${entry.collection} ${viewKeyLabel(viewKey)} as done`}
                                    checked={isChecked}
                                    onCheckedChange={() => checked.toggle(target)}
                                    className={cn(
                                        "size-3.5 shrink-0",
                                        isActive && "border-primary-foreground/60",
                                    )}
                                />
                            </TooltipDisplayer>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function ModelCatalogPane({
    catalog,
    selected,
    onSelect,
    draftedCollections,
    onCreateView,
}: ModelCatalogPaneProps) {
    const [query, setQuery] = useState("");
    /* Groups open by default, models closed: ~130 models with their view rows expanded is the
       wall of links this pane started as. Both sets survive a reload. */
    const collapsedModules = usePersistedIdSet(COLLAPSED_MODULES_KEY);
    const expandedModels = usePersistedIdSet(EXPANDED_MODELS_KEY);
    const checked = useCheckedTargets();

    /* Opening a target from the palette, a URL or a restored session must reveal the row that
       is now highlighted, so selection expands its model. */
    const selectedCollection = selected?.collection;
    const expandModel = expandedModels.add;
    useEffect(() => {
        if (selectedCollection) expandModel(selectedCollection);
    }, [selectedCollection, expandModel]);

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return catalog.entries;
        return catalog.entries.filter((entry) => entry.collection.includes(needle));
    }, [catalog.entries, query]);

    /* Entries arrive sorted by collection name, so each group stays alphabetical. */
    const groups = useMemo(() => groupByModule(filtered), [filtered]);

    const isFiltering = query.trim().length > 0;

    return (
        <div className="flex h-full min-h-0 flex-col border-r">
            <div className="flex items-center gap-2 border-b p-2">
                <IconSearch className="size-4 shrink-0 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filter models"
                    className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
                <Badge variant="secondary" className="shrink-0 tabular-nums">
                    {filtered.length}
                </Badge>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-1">
                {!catalog.isHydrated && catalog.entries.length === 0 ? (
                    <div className="flex flex-col gap-2 p-2">
                        {Array.from({length: 8}).map((_, i) => (
                            <Skeleton key={i} className="h-6 w-full" />
                        ))}
                    </div>
                ) : (
                    groups.map((group) => {
                        /* A filter that matched inside a collapsed group would hide its own
                           results, so filtering always shows what it found. */
                        const isCollapsed = !isFiltering && collapsedModules.has(group.id);
                        return (
                            <div key={group.id} className="mb-2">
                                <button
                                    type="button"
                                    onClick={() => collapsedModules.toggle(group.id)}
                                    aria-expanded={!isCollapsed}
                                    className="sticky top-0 z-10 flex w-full items-center gap-1 rounded-md bg-background/95 px-1 py-1 text-left backdrop-blur transition-colors hover:bg-muted"
                                >
                                    {isCollapsed ? (
                                        <IconChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                                    ) : (
                                        <IconChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                                    )}
                                    <span className="truncate text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        {group.label}
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className="ml-auto shrink-0 text-3xs tabular-nums"
                                    >
                                        {group.entries.length}
                                    </Badge>
                                </button>

                                {!isCollapsed &&
                                    group.entries.map((entry) => (
                                        <ModelRow
                                            key={entry.collection}
                                            entry={entry}
                                            selected={selected}
                                            onSelect={onSelect}
                                            hasDraft={draftedCollections.has(entry.collection)}
                                            checked={checked}
                                            expanded={expandedModels.has(entry.collection)}
                                            onToggleExpanded={() =>
                                                expandedModels.toggle(entry.collection)
                                            }
                                            onCreateView={onCreateView}
                                        />
                                    ))}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
