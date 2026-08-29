import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useSearchParams} from "react-router-dom";
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragMoveEvent,
    type DragOverEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import {sortableKeyboardCoordinates} from "@dnd-kit/sortable";
import {
    IconChevronDown,
    IconChevronUp,
    IconCode,
    IconDeviceFloppy,
    IconRotate,
} from "@tabler/icons-react";
import type {ViewConfig, ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Empty, EmptyDescription, EmptyHeader, EmptyTitle} from "@coreModule/components/ui/empty.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {useViewConfigContext} from "@coreModule/helpers/context/viewConfigContext.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import type {StudioModelEntry} from "../catalog/useStudioCatalog.ts";
import {useStudioDrafts} from "../draft/studioDraftProvider.tsx";
import NodeTree from "../tree/nodeTree.tsx";
import {
    adjustPathAfterRemoval,
    ancestorKeys,
    duplicateNodeAt,
    insertNodeAt,
    moveNode,
    nodeAt,
    parsePathKey,
    pathKey,
    removeNodeAt,
    updateNodeAt,
    type NodePath,
} from "../tree/nodeTreeOps.ts";
import {
    flattenForDrag,
    PALETTE_PREFIX,
    projectDrop,
    type TreeProjection,
} from "../tree/treeProjection.ts";
import {countMatches, filterTreeRows} from "../tree/treeFilter.ts";
import WidgetPalette from "../palette/widgetPalette.tsx";
import {createPaletteNode} from "../palette/widgetCatalog.ts";
import LintPanel from "../lint/lintPanel.tsx";
import {useSplitter} from "../layout/useSplitter.ts";
import SplitterHandle from "../layout/splitterHandle.tsx";
import CoveragePane from "../coverage/coveragePane.tsx";
import FieldsPane from "../fields/fieldsPane.tsx";
import {buildModelFields, toCoveragePath, type FieldScope} from "../fields/modelFields.ts";
import AccessSimulator from "../simulate/accessSimulator.tsx";
import {EMPTY_SIMULATION, type SimulationState} from "../simulate/simulationState.ts";
import {appliesWriteAllowlist, simulateViewConfig} from "../simulate/filterNodesMirror.ts";
import {useSourceIndex, targetKey} from "../source/sourceClient.ts";
import {computeCoverage, type CoveragePath} from "../coverage/viewCoverage.ts";
import {scaffoldNode, scaffoldNodes} from "../scaffold/scaffoldView.ts";
import {findingsByPath, lintViewConfig} from "../lint/viewLint.ts";
import {
    getRegisteredWidgetTokens,
    getWidgetMeta,
    resolveIcon,
} from "@coreModule/components/viewEngine/widgetRegistry.ts";
import NodeInspector from "../inspector/nodeInspector.tsx";
import DeviceFrame from "../preview/deviceFrame.tsx";
import DeviceToggle from "../preview/deviceToggle.tsx";
import {usePreviewDevice} from "../preview/previewDevice.ts";
import SheetPreview from "../preview/sheetPreview.tsx";
import FormPreview from "../preview/formPreview.tsx";
import {useSampleRows} from "../preview/useSampleRows.ts";
import {useStudioLanguage} from "../preview/previewLanguage.ts";
import ExportDialog from "../export/exportDialog.tsx";
import {suggestExportName, viewConfigToTs} from "../export/viewConfigToTs.ts";
import {diffNodeTrees, nodeLabel, type ChangeKind} from "../export/changeList.ts";

/** Selected node and collapsed nodes, as positional keys in the URL. */
const NODE_PARAM = "node";
const COLLAPSED_PARAM = "collapsed";

type ViewEditorProps = {
    entry: StudioModelEntry;
    viewKey: string;
};

export default function ViewEditor({entry, viewKey}: ViewEditorProps) {
    const viewCtx = useViewConfigContext();
    const {getViewDraft, setViewDraft, clearViewDraft, undo, redo} = useStudioDrafts();

    /* The pristine server payload, deliberately read through `getApiViewConfig` so the
       editor's "reset" and change list compare against the source, not the draft. */
    const apiConfig = viewCtx?.getApiViewConfig(entry.collection, viewKey);
    const draft = getViewDraft(entry.collection, viewKey);
    const config: ViewConfig | undefined = draft ?? apiConfig;

    const mode: "sheet" | "form" = config?.viewType === "form" ? "form" : "sheet";

    /*
     * Selection and collapse live in the URL alongside `model` / `view`, so a reload —
     * or a link pasted to someone else — lands on the same node rather than at the top
     * of the tree. Both are positional keys, which is exactly what the tree already uses.
     */
    const [searchParams, setSearchParams] = useSearchParams();

    const selectedKey = searchParams.get(NODE_PARAM);
    const setSelectedKey = useCallback(
        (next: string | null) => {
            setSearchParams(
                (prev) => {
                    const params = new URLSearchParams(prev);
                    if (next) params.set(NODE_PARAM, next);
                    else params.delete(NODE_PARAM);
                    return params;
                },
                {replace: true},
            );
        },
        [setSearchParams],
    );

    const collapsedKeys = useMemo<ReadonlySet<string>>(
        () => new Set((searchParams.get(COLLAPSED_PARAM) ?? "").split(",").filter(Boolean)),
        [searchParams],
    );
    const setCollapsedKeys = useCallback(
        (update: (prev: ReadonlySet<string>) => ReadonlySet<string>) => {
            setSearchParams(
                (prev) => {
                    const params = new URLSearchParams(prev);
                    const current = new Set(
                        (params.get(COLLAPSED_PARAM) ?? "").split(",").filter(Boolean),
                    );
                    const next = [...update(current)];
                    if (next.length > 0) params.set(COLLAPSED_PARAM, next.join(","));
                    else params.delete(COLLAPSED_PARAM);
                    return params;
                },
                {replace: true},
            );
        },
        [setSearchParams],
    );
    const [activeId, setActiveId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);
    const [offsetLeft, setOffsetLeft] = useState(0);
    const [languagePath, setLanguagePath] = useState("");
    const [sampleIndex, setSampleIndex] = useState(0);
    const [exportOpen, setExportOpen] = useState(false);
    const [exportTab, setExportTab] = useState<"changes" | "source">("changes");
    const [paletteOpen, setPaletteOpen] = useState(true);
    const [treeQuery, setTreeQuery] = useState("");

    /* Pane sizes, remembered per developer rather than compiled in. */
    const leftPane = useSplitter("studio:pane:tree", 384, {min: 240, max: 720});
    const rightPane = useSplitter("studio:pane:inspector", 320, {min: 260, max: 640, edge: "end"});
    const toolBox = useSplitter("studio:pane:tools", 224, {
        min: 120,
        max: 640,
        direction: "vertical",
    });
    const [leftTab, setLeftTab] = useState<"palette" | "fields" | "coverage" | "access">(
        "palette",
    );
    const [previewDevice, setPreviewDevice] = usePreviewDevice();
    const [simulation, setSimulation] = useState<SimulationState>(EMPTY_SIMULATION);

    const {resolveLanguageKey} = useStudioLanguage(languagePath);
    const {rows, loading: rowsLoading, error: rowsError} = useSampleRows(config?.apiUrl);
    const sampleRow = rows[sampleIndex] ?? rows[0] ?? null;

    const nodes = useMemo(() => config?.nodes ?? [], [config]);

    const commitNodes = useCallback(
        (next: ViewNode[], coalesceKey?: string) => {
            if (!config) return;
            setViewDraft(
                entry.collection,
                viewKey,
                {...config, nodes: next},
                coalesceKey ? {coalesceKey} : undefined,
            );
        },
        [config, entry.collection, setViewDraft, viewKey],
    );

    /* A tree row is dragged by its positional key; a palette chip by `palette:<token>`. */
    const activeTreeKey = activeId && !activeId.startsWith(PALETTE_PREFIX) ? activeId : null;
    const activePaletteToken = activeId?.startsWith(PALETTE_PREFIX)
        ? activeId.slice(PALETTE_PREFIX.length)
        : null;

    /**
     * Selects a node and makes sure it can actually be seen.
     *
     * Expanding first is not cosmetic: `flattenForDrag` omits collapsed subtrees entirely,
     * so selecting a node inside a collapsed group renders nothing at all. Every caller that
     * selects a node the user did not click goes through here.
     */
    const revealPath = useCallback(
        (key: string) => {
            const ancestors = ancestorKeys(key);
            if (ancestors.length > 0) {
                setCollapsedKeys((prev) => {
                    if (!ancestors.some((ancestor) => prev.has(ancestor))) return prev;
                    const next = new Set(prev);
                    for (const ancestor of ancestors) next.delete(ancestor);
                    return next;
                });
            }
            setSelectedKey(key);
        },
        [setCollapsedKeys, setSelectedKey],
    );

    const allRows = useMemo(
        () => flattenForDrag(nodes, collapsedKeys, activeTreeKey),
        [nodes, collapsedKeys, activeTreeKey],
    );

    /* Filtering keeps matches plus their ancestors, so the result still reads as a tree. */
    const rowsFlat = useMemo(() => filterTreeRows(allRows, treeQuery), [allRows, treeQuery]);
    const treeMatches = useMemo(() => countMatches(allRows, treeQuery), [allRows, treeQuery]);
    const filtering = treeQuery.trim() !== "";

    const projection = useMemo<TreeProjection | null>(() => {
        if (!activeId || !overId) return null;
        return projectDrop({
            flat: rowsFlat,
            activeKey: activeTreeKey,
            overKey: overId,
            offsetLeft,
        });
    }, [activeId, activeTreeKey, offsetLeft, overId, rowsFlat]);

    const sensors = useSensors(
        // A small threshold so a click on a row selects it instead of starting a drag.
        useSensor(PointerSensor, {activationConstraint: {distance: 4}}),
        useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
    );

    const resetDrag = () => {
        setActiveId(null);
        setOverId(null);
        setOffsetLeft(0);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const currentProjection = projection;
        resetDrag();
        if (!currentProjection || !event.over) return;

        if (activePaletteToken) {
            commitNodes(
                insertNodeAt(
                    nodes,
                    currentProjection.destination,
                    createPaletteNode(activePaletteToken, mode),
                ),
            );
            return;
        }
        if (!activeTreeKey) return;
        const from = parsePathKey(activeTreeKey);
        commitNodes(moveNode(nodes, from, currentProjection.destination));
        /* Positional keys shift after a move. `moveNode` inserts at exactly this path, so
           following it there keeps the dragged node selected instead of dropping it. */
        revealPath(pathKey(adjustPathAfterRemoval(currentProjection.destination, from)));
    };

    const selectedPath = selectedKey ? parsePathKey(selectedKey) : null;
    const selectedNode = selectedPath ? nodeAt(nodes, selectedPath) : undefined;

    /* Ancestors of the selection, outermost first, for the inspector's breadcrumb. */
    const breadcrumb = useMemo(() => {
        if (!selectedPath) return [];
        const crumbs: {key: string; label: string}[] = [];
        for (let depth = 1; depth <= selectedPath.length; depth++) {
            const prefix = selectedPath.slice(0, depth);
            const node = nodeAt(nodes, prefix);
            if (!node) break;
            crumbs.push({key: pathKey(prefix), label: nodeLabel(node)});
        }
        return crumbs;
    }, [nodes, selectedPath]);

    const deleteAt = useCallback(
        (key: string) => {
            commitNodes(removeNodeAt(nodes, parsePathKey(key)).nodes);
            setSelectedKey(null);
        },
        [commitNodes, nodes, setSelectedKey],
    );

    const duplicateAt = useCallback(
        (key: string) => commitNodes(duplicateNodeAt(nodes, parsePathKey(key))),
        [commitNodes, nodes],
    );

    const changes = useMemo(
        () => (apiConfig && draft ? diffNodeTrees(apiConfig.nodes, draft.nodes) : []),
        [apiConfig, draft],
    );

    /* Language keys are only checkable once a dictionary is chosen; without one the
       Studio shows raw keys on purpose, and every key would look unresolved. */
    const languageActive = languagePath.trim().length > 0;
    const findings = useMemo(() => {
        if (!config) return [];
        return lintViewConfig(config, {
            viewType: mode,
            viewMode: config.viewMode,
            readPaths: entry.readPaths,
            writePaths: entry.writePaths,
            knownTokens: getRegisteredWidgetTokens(),
            getMeta: getWidgetMeta,
            iconResolves: (token) => !!resolveIcon(token),
            languageKeyResolves: languageActive
                ? (key) => resolveLanguageKey(key, true) !== null
                : undefined,
        });
    }, [config, mode, entry.readPaths, entry.writePaths, languageActive, resolveLanguageKey]);

    const findingsForRow = useMemo(() => findingsByPath(findings), [findings]);

    /* Property changes are the only kind the source writer applies; adds, removes and moves
       stay in the change list for a human. Counting them here keeps the button honest. */
    const writableEdits = useMemo(
        () =>
            changes
                .filter((change) => change.kind === "changed" && change.to && change.keys?.length)
                .reduce((total, change) => total + (change.keys?.length ?? 0), 0),
        [changes],
    );

    /* Which rows differ from the served config, so the tree shows the draft's shape at a
       glance instead of only inside the export dialog. */
    const changesForRow = useMemo(() => {
        const map = new Map<string, ChangeKind>();
        for (const change of changes) {
            const path = change.to ?? change.from;
            /* `added` outranks `changed` on the same row: it is the larger statement. */
            if (path && !map.has(path)) map.set(path, change.kind);
        }
        return map;
    }, [changes]);

    /* The source index is dev-server only; everything below degrades to nothing without it. */
    const source = useSourceIndex();
    const sourceKey = targetKey({collection: entry.collection, viewKey});
    const sourceEntry = source.byTarget.get(sourceKey);
    /*
     * `form:create` and `form:edit` routinely point at the *same* array in source, but the
     * API serves them already materialised — so the Studio has always shown them as
     * independent. Saying so up front beats discovering it at write time.
     */
    const sharedTargets = source.sharedWith(sourceKey).filter((key) => key !== sourceKey);

    /* Sheets are gated on the read allowlist, forms on the write allowlist — the same
       split maestro applies, so "unbound" means the same thing here as it does there. */
    const coverage = useMemo(
        () =>
            computeCoverage(
                nodes,
                mode === "sheet" ? entry.readPaths : entry.writePaths,
                entry.columns,
            ),
        [nodes, mode, entry.readPaths, entry.writePaths, entry.columns],
    );

    /*
     * An edit form is gated on the write allowlist, so that is the list of fields it could
     * ever offer; everywhere else the read paths are the subject. Same condition the mirror
     * uses to decide whether the write allowlist applies at all.
     */
    const fieldScope: FieldScope = config && appliesWriteAllowlist(config) ? "writable" : "all";

    /* The whole model, not just what this view is missing. */
    const fields = useMemo(
        () =>
            buildModelFields({
                readPaths: entry.readPaths,
                writePaths: entry.writePaths,
                columns: entry.columns,
                nodes,
                scope: fieldScope,
            }),
        [entry.readPaths, entry.writePaths, entry.columns, nodes, fieldScope],
    );

    /** Appends into the selected container when there is one, else at root level. */
    const appendNode = useCallback(
        (node: ViewNode) => {
            const path = selectedKey ? parsePathKey(selectedKey) : null;
            const target = path ? nodeAt(nodes, path) : undefined;
            const destination: NodePath =
                path && target && !target.field
                    ? [...path, (target.children ?? []).length]
                    : [nodes.length];
            commitNodes(insertNodeAt(nodes, destination, node));
            revealPath(pathKey(destination));
        },
        [commitNodes, nodes, revealPath, selectedKey],
    );

    const scaffoldFrom = useCallback(
        (entries: CoveragePath[]) => {
            const generated = scaffoldNodes(entries, mode, {groupTitle: entry.collection});
            if (generated.length === 0) return;
            commitNodes([...nodes, ...generated]);
        },
        [commitNodes, entry.collection, mode, nodes],
    );

    const appendFromPalette = (token: string) =>
        appendNode(createPaletteNode(token, mode));

    /*
     * Revoking narrows the allowlists the served config was already filtered against, so
     * the preview can only ever lose nodes here — which is exactly what a more restricted
     * account would experience.
     */
    const simulated = useMemo(() => {
        if (!config || !simulation.enabled) return null;
        return simulateViewConfig(config, {
            read: new Set(entry.readPaths.filter((path) => !simulation.revokedRead.has(path))),
            write: new Set(entry.writePaths.filter((path) => !simulation.revokedWrite.has(path))),
        });
    }, [config, simulation, entry.readPaths, entry.writePaths]);

    /** What the preview renders: the draft, or the draft as a narrower account sees it. */
    const previewConfig = useMemo(
        () => (config && simulated ? {...config, nodes: simulated.nodes} : config),
        [config, simulated],
    );

    const leftPaneRef = useRef<HTMLDivElement | null>(null);

    /*
     * Editor shortcuts. Deliberately inert while a field has focus: every one of these
     * keys means something else inside a text input or the JSON editor, and stealing
     * Backspace from a textarea would be worse than having no shortcut at all.
     */
    useEffect(() => {
        const isEditing = (target: EventTarget | null): boolean => {
            const element = target as HTMLElement | null;
            if (!element) return false;
            const tag = element.tagName;
            return (
                tag === "INPUT" ||
                tag === "TEXTAREA" ||
                tag === "SELECT" ||
                element.isContentEditable
            );
        };

        const onKeyDown = (event: KeyboardEvent) => {
            const meta = event.metaKey || event.ctrlKey;

            if (meta && event.key.toLowerCase() === "z") {
                event.preventDefault();
                if (event.shiftKey) redo();
                else undo();
                return;
            }

            if (isEditing(event.target)) return;

            if (event.key === "/") {
                event.preventDefault();
                setPaletteOpen(true);
                /* Focus after the pane has had a chance to mount. */
                requestAnimationFrame(() => leftPaneRef.current?.querySelector("input")?.focus());
                return;
            }

            if (!selectedKey) return;

            if (meta && event.key.toLowerCase() === "d") {
                event.preventDefault();
                duplicateAt(selectedKey);
                return;
            }

            if (event.key === "Delete" || event.key === "Backspace") {
                event.preventDefault();
                deleteAt(selectedKey);
                return;
            }

            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                const index = rowsFlat.findIndex((row) => row.key === selectedKey);
                if (index < 0) return;
                const next = rowsFlat[index + (event.key === "ArrowDown" ? 1 : -1)];
                if (next) revealPath(next.key);
                return;
            }

            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                const row = rowsFlat.find((item) => item.key === selectedKey);
                if (!row?.childCount) return;
                event.preventDefault();
                setCollapsedKeys((prev) => {
                    const next = new Set(prev);
                    if (event.key === "ArrowLeft") next.add(selectedKey);
                    else next.delete(selectedKey);
                    return next;
                });
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [
        deleteAt,
        duplicateAt,
        redo,
        revealPath,
        rowsFlat,
        selectedKey,
        setCollapsedKeys,
        setSelectedKey,
        undo,
    ]);

    if (!config) {
        return (
            <Empty className="h-full">
                <EmptyHeader>
                    <EmptyTitle>No config for {viewKey}</EmptyTitle>
                    <EmptyDescription>
                        `{entry.collection}` has no `{viewKey}` view, or every node in it was pruned
                        for this account by the server-side permission filter.
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(event: DragStartEvent) => setActiveId(String(event.active.id))}
            onDragMove={(event: DragMoveEvent) => setOffsetLeft(event.delta.x)}
            onDragOver={(event: DragOverEvent) => setOverId(event.over ? String(event.over.id) : null)}
            onDragEnd={handleDragEnd}
            onDragCancel={resetDrag}
        >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2">
                    <span className="font-mono text-sm">{entry.collection}</span>
                    <Badge variant="outline">{viewKey}</Badge>
                    {draft && <Badge variant="secondary">draft</Badge>}
                    <span className="text-3xs text-muted-foreground">{config.apiUrl}</span>
                    {sourceEntry && (
                        <TooltipDisplayer
                            tooltip={`Declared as \`${sourceEntry.declName}\` in ${sourceEntry.file}`}
                        >
                            <Badge variant="outline" className="font-mono text-3xs">
                                {sourceEntry.file.split("/").slice(-1)[0]}
                            </Badge>
                        </TooltipDisplayer>
                    )}
                    {sharedTargets.length > 0 && (
                        <TooltipDisplayer
                            tooltip={
                                `\`${sourceEntry?.nodesIdentifier ?? "nodes"}\` is the same array as ` +
                                `${sharedTargets.join(", ")} — editing one edits them all.`
                            }
                        >
                            <Badge variant="destructive" className="text-3xs">
                                nodes shared with {sharedTargets.join(", ")}
                            </Badge>
                        </TooltipDisplayer>
                    )}
                    {sourceEntry && !sourceEntry.addressable && (
                        <TooltipDisplayer tooltip={sourceEntry.unaddressableReason ?? ""}>
                            <Badge variant="outline" className="text-3xs">
                                not writable
                            </Badge>
                        </TooltipDisplayer>
                    )}

                    <div className="ml-auto flex items-center gap-2">
                        <TooltipDisplayer tooltip="Resolve language keys against a withLanguage path; empty shows raw keys">
                            <Input
                                value={languagePath}
                                onChange={(e) => setLanguagePath(e.target.value)}
                                placeholder="language path (optional)"
                                className="h-7 w-64 font-mono text-3xs"
                            />
                        </TooltipDisplayer>
                        {rows.length > 1 && (
                            <select
                                value={sampleIndex}
                                onChange={(e) => setSampleIndex(Number(e.target.value))}
                                className="h-7 rounded border bg-background px-1 text-3xs"
                            >
                                {rows.map((row, index) => (
                                    <option key={row._id} value={index}>
                                        {String(row.name ?? row._id)}
                                    </option>
                                ))}
                            </select>
                        )}
                        <TooltipDisplayer tooltip="Discard this view's draft">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={!draft}
                                onClick={() => {
                                    clearViewDraft(entry.collection, viewKey);
                                    setSelectedKey(null);
                                }}
                            >
                                <IconRotate className="size-4" />
                                Reset
                            </Button>
                        </TooltipDisplayer>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setExportTab("changes");
                                setExportOpen(true);
                            }}
                        >
                            <IconCode className="size-4" />
                            Export
                        </Button>
                        {sourceEntry?.addressable && writableEdits > 0 && (
                            <TooltipDisplayer tooltip="Write these property changes into the real *.views.ts">
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => {
                                        setExportTab("source");
                                        setExportOpen(true);
                                    }}
                                >
                                    <IconDeviceFloppy className="size-4" />
                                    Apply {writableEdits}
                                </Button>
                            </TooltipDisplayer>
                        )}
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 overflow-hidden">
                    {/* Palette and tree share the pane rather than sitting in tabs: a
                        widget is dragged from one into the other, so both must be mounted
                        and visible at the same time. */}
                    <div
                        className="flex shrink-0 flex-col border-r"
                        style={{width: leftPane.size}}
                    >
                        <div className="flex shrink-0 items-center gap-1 border-b px-2 py-1">
                            {(["palette", "fields", "coverage", "access"] as const).map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => {
                                        setLeftTab(tab);
                                        setPaletteOpen(true);
                                    }}
                                    className={cn(
                                        "rounded px-1.5 py-0.5 text-3xs font-medium uppercase tracking-wide transition-colors",
                                        leftTab === tab && paletteOpen
                                            ? "bg-muted text-foreground"
                                            : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    {tab}
                                    {tab === "coverage" && coverage.unbound.length > 0 && (
                                        <Badge
                                            variant="secondary"
                                            className="ml-1 px-1 text-3xs tabular-nums"
                                        >
                                            {coverage.unbound.length}
                                        </Badge>
                                    )}
                                </button>
                            ))}
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="ml-auto h-6 text-3xs"
                                onClick={() => setPaletteOpen((open) => !open)}
                            >
                                {paletteOpen ? (
                                    <IconChevronUp className="size-3.5" />
                                ) : (
                                    <IconChevronDown className="size-3.5" />
                                )}
                            </Button>
                        </div>
                        {paletteOpen && (
                            <div
                                ref={leftPaneRef}
                                className="shrink-0 overflow-hidden border-b"
                                style={{height: toolBox.size}}
                            >
                                {leftTab === "palette" && (
                                    <WidgetPalette onAppend={appendFromPalette} mode={mode} />
                                )}
                                {leftTab === "fields" && (
                                    <FieldsPane
                                        fields={fields}
                                        mode="view"
                                        scope={fieldScope}
                                        onReveal={(_field, site) => site && revealPath(site.nodeKey)}
                                        onAdd={(field) =>
                                            appendNode(scaffoldNode(toCoveragePath(field), mode))
                                        }
                                    />
                                )}
                                {leftTab === "coverage" && (
                                    <CoveragePane
                                        coverage={coverage}
                                        mode={mode}
                                        hasExistingNodes={nodes.length > 0}
                                        onAdd={(path) => appendNode(scaffoldNode(path, mode))}
                                        onScaffold={scaffoldFrom}
                                    />
                                )}
                                {leftTab === "access" && (
                                    <AccessSimulator
                                        readPaths={entry.readPaths}
                                        writePaths={entry.writePaths}
                                        showWrite={appliesWriteAllowlist(config)}
                                        state={simulation}
                                        onChange={setSimulation}
                                        summary={simulated}
                                    />
                                )}
                            </div>
                        )}

                        {paletteOpen && <SplitterHandle splitter={toolBox} direction="vertical" />}

                        <div className="flex shrink-0 items-center gap-2 border-b px-2 py-1">
                            <span className="text-3xs font-medium uppercase tracking-wide text-muted-foreground">
                                Tree
                            </span>
                            <Input
                                value={treeQuery}
                                onChange={(e) => setTreeQuery(e.target.value)}
                                placeholder="Filter nodes"
                                className="h-6 border-0 bg-transparent px-0 text-3xs shadow-none focus-visible:ring-0"
                            />
                            {filtering && (
                                <TooltipDisplayer tooltip="Dragging is off while filtering — a drop index would not match what you see">
                                    <Badge variant="outline" className="shrink-0 text-3xs tabular-nums">
                                        {treeMatches} hit{treeMatches === 1 ? "" : "s"}
                                    </Badge>
                                </TooltipDisplayer>
                            )}
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            <NodeTree
                                    rows={rowsFlat}
                                    selectedKey={selectedKey}
                                    onSelectKey={revealPath}
                                    collapsedKeys={collapsedKeys}
                                    onToggleCollapse={(key) =>
                                        setCollapsedKeys((prev) => {
                                            const next = new Set(prev);
                                            if (next.has(key)) next.delete(key);
                                            else next.add(key);
                                            return next;
                                        })
                                    }
                                    onDelete={deleteAt}
                                    onDuplicate={duplicateAt}
                                projection={filtering ? null : projection}
                                activeKey={activeTreeKey}
                                dragDisabledReason={
                                    filtering
                                        ? "Dragging is off while the tree is filtered."
                                        : undefined
                                }
                                findingsByPath={findingsForRow}
                                changesByPath={changesForRow}
                            />
                        </div>
                    </div>

                    <SplitterHandle splitter={leftPane} />

                    <div className={cn("flex min-w-0 flex-1 flex-col overflow-hidden")}>
                        {rowsError && (
                            <p className="shrink-0 border-b bg-destructive/10 px-3 py-1.5 text-3xs text-destructive">
                                Sample rows unavailable: {rowsError}
                            </p>
                        )}
                        {rowsLoading && (
                            <p className="shrink-0 border-b px-3 py-1.5 text-3xs text-muted-foreground">
                                Loading sample rows…
                            </p>
                        )}
                        {simulation.enabled && simulated && (
                            <p className="shrink-0 border-b bg-info/10 px-3 py-1.5 text-3xs text-info">
                                Simulating a narrower account: {simulated.pruned} node(s) pruned
                                {simulated.disabled > 0 && `, ${simulated.disabled} field(s) disabled`}
                                {simulated.wouldBeDropped &&
                                    " — maestro would drop this view entirely for such an account"}
                                .
                            </p>
                        )}
                        <div className="flex shrink-0 items-center gap-2 border-b px-2 py-1">
                            <span className="text-3xs font-medium uppercase tracking-wide text-muted-foreground">
                                Preview
                            </span>
                            <DeviceToggle
                                className="ml-auto"
                                device={previewDevice}
                                onSelect={setPreviewDevice}
                            />
                        </div>

                        <DeviceFrame device={previewDevice}>
                            {mode === "sheet" ? (
                                <SheetPreview
                                    config={previewConfig!}
                                    row={sampleRow}
                                    resolveLanguageKey={resolveLanguageKey}
                                />
                            ) : (
                                <FormPreview
                                    config={previewConfig!}
                                    row={sampleRow}
                                    resolveLanguageKey={resolveLanguageKey}
                                    formExtras={undefined}
                                />
                            )}
                        </DeviceFrame>
                        <LintPanel
                            findings={findings}
                            selectedPath={selectedKey}
                            onSelectPath={revealPath}
                        />
                    </div>

                    <SplitterHandle splitter={rightPane} />

                    <div
                        className="shrink-0 overflow-y-auto border-l"
                        style={{width: rightPane.size}}
                    >
                        {selectedNode && selectedPath ? (
                            <NodeInspector
                                key={selectedKey ?? ""}
                                node={selectedNode}
                                mode={mode}
                                viewMode={config.viewMode}
                                breadcrumb={breadcrumb}
                                onSelectCrumb={revealPath}
                                sourceTarget={source.available ? sourceKey : undefined}
                                nodePath={selectedKey}
                                readPaths={entry.readPaths}
                                writePaths={entry.writePaths}
                                onChange={(next, coalesceKey) =>
                                    commitNodes(
                                        updateNodeAt(nodes, selectedPath, () => next),
                                        /* Namespaced by node, so moving to another field
                                           starts a fresh undo entry. */
                                        coalesceKey ? `${selectedKey}:${coalesceKey}` : undefined,
                                    )
                                }
                            />
                        ) : (
                            <p className="p-4 text-2xs text-muted-foreground">
                                Select a node in the tree to edit it.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <DragOverlay dropAnimation={null}>
                {activeId && (
                    <div className="rounded border bg-background px-2 py-1 font-mono text-2xs shadow-md">
                        {activePaletteToken ?? nodeAt(nodes, parsePathKey(activeId))?.render ?? activeId}
                    </div>
                )}
            </DragOverlay>

            <ExportDialog
                open={exportOpen}
                onOpenChange={setExportOpen}
                title={`Export ${entry.collection} · ${viewKey}`}
                filePathHint={`maestro/modules/*/database/schemas/*/*.views.ts`}
                code={viewConfigToTs(config, {exportName: suggestExportName(config)})}
                changes={changes}
                findings={findings}
                defaultTab={exportTab}
                sourceTarget={sourceEntry?.addressable ? sourceKey : undefined}
                onAppliedToSource={() => {
                    /* The draft is now what source says, so keeping it would show the same
                       change list forever. */
                    clearViewDraft(entry.collection, viewKey);
                    setExportOpen(false);
                }}
            />
        </DndContext>
    );
}
