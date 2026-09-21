import {useEffect, useRef} from "react";
import {SortableContext, useSortable, verticalListSortingStrategy} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {
    IconAlertTriangle,
    IconChevronDown,
    IconChevronRight,
    IconCopy,
    IconGripVertical,
    IconTrash,
} from "@tabler/icons-react";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import type {ChangeKind} from "../export/changeList.ts";
import type {LintFinding} from "../lint/viewLint.ts";
import type {FlatNode} from "./nodeTreeOps.ts";
import {TREE_INDENT_PX, type TreeProjection} from "./treeProjection.ts";

type NodeTreeProps = {
    rows: FlatNode[];
    selectedKey: string | null;
    onSelectKey: (key: string) => void;
    collapsedKeys: ReadonlySet<string>;
    onToggleCollapse: (key: string) => void;
    onDelete: (key: string) => void;
    onDuplicate: (key: string) => void;
    /** Live drop indicator while something is being dragged. */
    projection: TreeProjection | null;
    activeKey: string | null;
    /** Lint findings keyed by node path, badged on the owning row. */
    findingsByPath?: Map<string, LintFinding[]>;
    /** How each node differs from the served config, keyed by node path. */
    changesByPath?: Map<string, ChangeKind>;
    /**
     * Filtering shows a subset in document order, so a drop's computed index would not be
     * the index the user is looking at. Dragging is disabled rather than silently wrong.
     */
    dragDisabledReason?: string;
};

/** Dot colour per change kind, matching the export dialog's own tones. */
const CHANGE_DOT: Record<ChangeKind, string> = {
    added: "bg-success",
    removed: "bg-destructive",
    moved: "bg-info",
    changed: "bg-warning",
};

/** Short, scannable label for a row: the widget or tag that will actually render. */
function rowLabel(row: FlatNode): string {
    const {node} = row;
    if (node.field) return node.field.widget;
    return node.render;
}

/** The title / field name that tells two `#SheetGroup`s apart at a glance. */
function rowDetail(row: FlatNode): string | null {
    const {node} = row;
    if (node.field?.name) return node.field.name;
    const title = node.props?.title;
    if (typeof title === "string" && title) return title;
    const columns = node.props?.columns;
    if (typeof columns === "number") return `${columns} cols`;
    return null;
}

function NodeTreeRow({
    row,
    selected,
    onSelect,
    collapsed,
    onToggleCollapse,
    onDelete,
    onDuplicate,
    dropDepth,
    isDragActive,
    findings,
    change,
    dragDisabled,
}: {
    row: FlatNode;
    selected: boolean;
    onSelect: () => void;
    collapsed: boolean;
    onToggleCollapse: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    /** Depth of the drop indicator to draw under this row, or `null`. */
    dropDepth: number | null;
    isDragActive: boolean;
    findings: LintFinding[];
    change?: ChangeKind;
    dragDisabled?: string;
}) {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id: row.key,
    });

    /*
     * Bring a newly selected row into view. Selection arrives from the lint panel, the
     * coverage pane, keyboard navigation and the URL on reload — none of which knew where
     * the row was on screen, so the selection could land entirely offscreen.
     *
     * `block: "nearest"` scrolls only when the row is actually out of view, so clicking a
     * visible row never jerks the list. Skipped mid-drag, which would fight dnd-kit.
     */
    const rowElement = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (!selected || isDragActive) return;
        rowElement.current?.scrollIntoView({block: "nearest"});
    }, [selected, isDragActive]);

    const detail = rowDetail(row);
    const {node} = row;

    return (
        <div className="relative" ref={rowElement}>
            <div
                ref={setNodeRef}
                style={{
                    transform: CSS.Transform.toString(transform),
                    transition,
                    paddingLeft: row.depth * TREE_INDENT_PX,
                }}
                className={cn(
                    "group/row flex items-center gap-1 rounded-md pr-1 transition-colors",
                    selected ? "bg-primary/10 ring-1 ring-primary/40" : "hover:bg-muted/60",
                    isDragging && "opacity-40",
                )}
            >
                {dragDisabled ? (
                    <span
                        aria-hidden
                        className="p-1 text-muted-foreground/25"
                        title={dragDisabled}
                    >
                        <IconGripVertical className="size-3.5" />
                    </span>
                ) : (
                    <button
                        type="button"
                        aria-label="Drag to move"
                        className="cursor-grab p-1 text-muted-foreground/60 active:cursor-grabbing"
                        {...attributes}
                        {...listeners}
                    >
                        <IconGripVertical className="size-3.5" />
                    </button>
                )}

                {row.childCount > 0 ? (
                    <button
                        type="button"
                        aria-label={collapsed ? "Expand" : "Collapse"}
                        onClick={onToggleCollapse}
                        className="p-0.5 text-muted-foreground"
                    >
                        {collapsed ? (
                            <IconChevronRight className="size-3.5" />
                        ) : (
                            <IconChevronDown className="size-3.5" />
                        )}
                    </button>
                ) : (
                    <span className="w-[1.125rem]" />
                )}

                <button
                    type="button"
                    onClick={onSelect}
                    className="flex min-w-0 flex-1 items-center gap-1.5 py-1 text-left"
                >
                    {/* The token is the identity of the row — it never truncates; the
                        detail (field name / title) gives way first. */}
                    <span
                        className={cn(
                            "shrink-0 font-mono text-2xs",
                            node.field ? "text-foreground" : "text-primary",
                        )}
                    >
                        {rowLabel(row)}
                    </span>
                    {detail && (
                        <span className="min-w-0 truncate text-3xs text-muted-foreground">
                            {detail}
                        </span>
                    )}
                    {node.dependent && (
                        <TooltipDisplayer tooltip={`Hidden unless "${node.dependent}" has a value`}>
                            <Badge variant="outline" className="shrink-0 px-1 text-3xs">
                                dep
                            </Badge>
                        </TooltipDisplayer>
                    )}
                    {!!node.dependentAny?.length && (
                        <TooltipDisplayer
                            tooltip={`Hidden unless any of: ${node.dependentAny.join(", ")}`}
                        >
                            <Badge variant="outline" className="shrink-0 px-1 text-3xs">
                                depAny
                            </Badge>
                        </TooltipDisplayer>
                    )}
                    {node.permissions && (
                        <TooltipDisplayer
                            tooltip={`Permission gated: ${JSON.stringify(node.permissions)}`}
                        >
                            <Badge variant="secondary" className="shrink-0 px-1 text-3xs">
                                perm
                            </Badge>
                        </TooltipDisplayer>
                    )}
                    {node.field?.required && (
                        <span aria-hidden className="shrink-0 text-3xs text-destructive">
                            *
                        </span>
                    )}
                    {change && (
                        <TooltipDisplayer tooltip={`${change} since the served config`}>
                            <span
                                aria-label={`${change} since the served config`}
                                className={cn(
                                    "size-1.5 shrink-0 rounded-full",
                                    CHANGE_DOT[change],
                                )}
                            />
                        </TooltipDisplayer>
                    )}
                    {findings.length > 0 && (
                        <TooltipDisplayer
                            tooltip={findings.map((finding) => finding.message).join("\n")}
                        >
                            <IconAlertTriangle
                                aria-label={`${findings.length} check finding(s)`}
                                className={cn(
                                    "size-3.5 shrink-0",
                                    findings.some((finding) => finding.severity === "error")
                                        ? "text-destructive"
                                        : "text-warning",
                                )}
                            />
                        </TooltipDisplayer>
                    )}
                </button>

                {!isDragActive && (
                    <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover/row:opacity-100">
                        <TooltipDisplayer tooltip="Duplicate">
                            <Button type="button" aria-label="Duplicate node" variant="ghost" size="icon" className="size-6" onClick={onDuplicate}>
                                <IconCopy className="size-3.5" />
                            </Button>
                        </TooltipDisplayer>
                        <TooltipDisplayer tooltip="Delete">
                            <Button type="button" aria-label="Delete node" variant="ghost" size="icon" className="size-6" onClick={onDelete}>
                                <IconTrash className="size-3.5 text-destructive" />
                            </Button>
                        </TooltipDisplayer>
                    </div>
                )}
            </div>

            {dropDepth !== null && (
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 -bottom-px h-0.5 bg-primary"
                    style={{marginLeft: dropDepth * TREE_INDENT_PX + 24}}
                />
            )}
        </div>
    );
}

export default function NodeTree({
    rows,
    selectedKey,
    onSelectKey,
    collapsedKeys,
    onToggleCollapse,
    onDelete,
    onDuplicate,
    projection,
    activeKey,
    findingsByPath,
    changesByPath,
    dragDisabledReason,
}: NodeTreeProps) {
    const rowKeys = rows.map((row) => row.key);

    return (
        <SortableContext items={rowKeys} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-px p-1">
                {/* Drop indicator above the first row, for "move to the very top". */}
                {projection?.afterKey === null && (
                    <div aria-hidden className="ml-6 h-0.5 bg-primary" />
                )}
                {rows.map((row) => (
                    <NodeTreeRow
                        key={row.key}
                        row={row}
                        selected={selectedKey === row.key}
                        onSelect={() => onSelectKey(row.key)}
                        collapsed={collapsedKeys.has(row.key)}
                        onToggleCollapse={() => onToggleCollapse(row.key)}
                        onDelete={() => onDelete(row.key)}
                        onDuplicate={() => onDuplicate(row.key)}
                        dropDepth={projection?.afterKey === row.key ? projection.depth : null}
                        isDragActive={activeKey !== null}
                        findings={findingsByPath?.get(row.key) ?? []}
                        change={changesByPath?.get(row.key)}
                        dragDisabled={dragDisabledReason}
                    />
                ))}
                {rows.length === 0 && (
                    <p className="px-2 py-6 text-center text-2xs text-muted-foreground">
                        No nodes. Drag a widget from the palette to start.
                    </p>
                )}
            </div>
        </SortableContext>
    );
}
