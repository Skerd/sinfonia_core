import {useEffect, useMemo, useState} from "react";
import {useSearchParams} from "react-router-dom";
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {IconCode, IconEye, IconEyeOff, IconGripVertical, IconRotate, IconTrash} from "@tabler/icons-react";
import type {
    TableColumnConfig,
} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type";
import {tableConfigToFilterConfig} from "armonia/src/modules/core/database/filter/pathUtils.ts";
import {listChromeParam, LIST_VIEW_PARAM} from "@coreModule/helpers/hooks/useListUrlState.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Checkbox} from "@coreModule/components/ui/checkbox.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import CardAndTableView from "@coreModule/components/custom/cardAndTableView.tsx";
import {useTableConfigContext} from "@coreModule/helpers/context/tableConfigContext.tsx";
import type {TableResponse} from "armonia/src/modules/core/types/shared.types.ts";
import {cn} from "@coreModule/components/lib/utils.ts";
import type {StudioModelEntry} from "../catalog/useStudioCatalog.ts";
import {useStudioDrafts} from "../draft/studioDraftProvider.tsx";
import ColumnInspector from "./columnInspector.tsx";
import LintPanel from "../lint/lintPanel.tsx";
import {lintTableColumns} from "../lint/tableLint.ts";
import {computeCoverage} from "../coverage/viewCoverage.ts";
import DeviceFrame from "../preview/deviceFrame.tsx";
import DeviceToggle from "../preview/deviceToggle.tsx";
import {usePreviewDevice} from "../preview/previewDevice.ts";
import {useCheckedTargets} from "../catalog/checkedTargets.ts";
import FieldsPane from "../fields/fieldsPane.tsx";
import {buildModelFields} from "../fields/modelFields.ts";
import ExportDialog from "../export/exportDialog.tsx";
import {dynamicTableConfigToTs, tableChangeList} from "../export/dynamicTableConfigToTs.ts";
import {singularizeCollection} from "../export/viewConfigToTs.ts";
import {studioTableConfigKey, TABLE_TARGET} from "../studioTarget.ts";

type TableEditorProps = {
    entry: StudioModelEntry;
};

function SortableColumnRow({
    column,
    selected,
    onSelect,
    onToggleVisible,
    onRemove,
}: {
    column: TableColumnConfig;
    selected: boolean;
    onSelect: () => void;
    onToggleVisible: () => void;
    onRemove: () => void;
}) {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id: column.id,
    });

    return (
        <div
            ref={setNodeRef}
            style={{transform: CSS.Transform.toString(transform), transition}}
            className={cn(
                "group/col flex items-center gap-1 rounded-md pr-1 transition-colors",
                selected ? "bg-primary/10 ring-1 ring-primary/40" : "hover:bg-muted/60",
                isDragging && "opacity-40",
            )}
        >
            <button
                type="button"
                aria-label="Drag to reorder"
                className="cursor-grab p-1 text-muted-foreground/60 active:cursor-grabbing"
                {...attributes}
                {...listeners}
            >
                <IconGripVertical className="size-3.5" />
            </button>

            <button
                type="button"
                onClick={onSelect}
                className="flex min-w-0 flex-1 items-center gap-1.5 py-1 text-left"
            >
                <span className={cn("truncate font-mono text-2xs", !column.visible && "opacity-50")}>
                    {column.id}
                </span>
                <Badge variant="outline" className="shrink-0 px-1 text-3xs">
                    {column.cellType}
                </Badge>
                {!column.filterConfig && (
                    <Badge variant="secondary" className="shrink-0 px-1 text-3xs">
                        no filter
                    </Badge>
                )}
            </button>

            <TooltipDisplayer tooltip={column.visible ? "Hide by default" : "Show by default"}>
                <Button
                    type="button"
                    aria-label={column.visible ? "Hide by default" : "Show by default"}
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={onToggleVisible}
                >
                    {column.visible ? <IconEye className="size-3.5" /> : <IconEyeOff className="size-3.5" />}
                </Button>
            </TooltipDisplayer>
            <TooltipDisplayer tooltip="Remove the column entirely (hideColumn)">
                <Button
                    type="button"
                    aria-label="Remove column"
                    variant="ghost"
                    size="icon"
                    className="size-6 opacity-0 transition-opacity group-hover/col:opacity-100"
                    onClick={onRemove}
                >
                    <IconTrash className="size-3.5 text-destructive" />
                </Button>
            </TooltipDisplayer>
        </div>
    );
}

export default function TableEditor({entry}: TableEditorProps) {
    const tableCtx = useTableConfigContext();
    const {getTableDraft, setTableDraft, clearTableDraft} = useStudioDrafts();

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [leftTab, setLeftTab] = useState<"columns" | "fields">("columns");
    const [previewDevice, setPreviewDevice] = usePreviewDevice();
    const checked = useCheckedTargets();
    const checkedTarget = {collection: entry.collection, viewKey: TABLE_TARGET};
    const [exportOpen, setExportOpen] = useState(false);
    const [, setSearchParams] = useSearchParams();

    const draft = getTableDraft(entry.collection);
    const columns = draft ?? entry.columns;
    const previewKey = studioTableConfigKey(entry.collection);

    const pristineById = useMemo(
        () => new Map(entry.columns.map((column) => [column.id, column])),
        [entry.columns],
    );

    /*
     * Depend on the two callbacks, never on the context object.
     * `TableConfigProvider` rebuilds its value whenever `configs` changes, so an effect
     * keyed on the context would re-run on its own write — setConfig → new value →
     * effect → setConfig, which React kills as "Maximum update depth exceeded".
     * `setConfig` and `clearConfig` are `useCallback([])`, so they are stable.
     */
    const setTableConfig = tableCtx?.setConfig;
    const clearTableConfig = tableCtx?.clearConfig;

    /* Mirror the draft into the context under the Studio's own key so the preview below
       renders through the unmodified `CardAndTableView`. */
    useEffect(() => {
        if (!setTableConfig) return;
        setTableConfig(previewKey, {
            columns,
            filters: tableConfigToFilterConfig(columns),
            columnVisibility: Object.fromEntries(columns.map((column) => [column.id, column.visible])),
        });
    }, [setTableConfig, previewKey, columns]);

    useEffect(() => {
        return () => {
            clearTableConfig?.(previewKey);
        };
    }, [clearTableConfig, previewKey]);

    /*
     * `CardAndTableView` defaults to card view, and cards are not what this editor is
     * about — `cardRender` here is deliberately empty. Seed the documented list-chrome
     * URL param instead of forcing the mode, so the toggle still works afterwards.
     */
    const viewParam = listChromeParam(LIST_VIEW_PARAM, previewKey);
    useEffect(() => {
        setSearchParams(
            (prev) => {
                if (prev.get(viewParam)) return prev;
                const next = new URLSearchParams(prev);
                next.set(viewParam, "table");
                return next;
            },
            {replace: true},
        );
    }, [setSearchParams, viewParam]);

    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 4}}),
        useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
    );

    const commit = (next: TableColumnConfig[], coalesceKey?: string) =>
        setTableDraft(entry.collection, next, coalesceKey ? {coalesceKey} : undefined);

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;
        if (!over || active.id === over.id) return;
        const from = columns.findIndex((column) => column.id === active.id);
        const to = columns.findIndex((column) => column.id === over.id);
        if (from < 0 || to < 0) return;
        commit(arrayMove(columns, from, to));
    };

    const findings = useMemo(
        () => lintTableColumns(columns, {readPaths: entry.readPaths}),
        [columns, entry.readPaths],
    );

    /* Columns are opt-in per schema path via `dynamicTableConfiguration`, so "unbound" here
       means a readable path the table simply does not show. */
    const coverage = useMemo(
        () =>
            computeCoverage(
                columns.map((column) => ({
                    render: "#column",
                    field: {name: column.id, widget: "#column"},
                })),
                entry.readPaths,
                columns,
            ),
        [columns, entry.readPaths],
    );

    /* Same list the view editor shows, minus the binding info a table has no notion of. */
    const fields = useMemo(
        () =>
            buildModelFields({
                readPaths: entry.readPaths,
                writePaths: entry.writePaths,
                columns,
            }),
        [entry.readPaths, entry.writePaths, columns],
    );

    const selected = columns.find((column) => column.id === selectedId) ?? null;
    const changes = useMemo(
        () => (draft ? tableChangeList(entry.columns, draft) : []),
        [draft, entry.columns],
    );

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2">
                <TooltipDisplayer
                    tooltip={
                        checked.isChecked(checkedTarget)
                            ? "Marked as done — click to reopen"
                            : "Mark this table as done"
                    }
                >
                    <Checkbox
                        aria-label={`Mark ${entry.collection} table as done`}
                        checked={checked.isChecked(checkedTarget)}
                        onCheckedChange={() => checked.toggle(checkedTarget)}
                    />
                </TooltipDisplayer>
                <span className="font-mono text-sm">{entry.collection}</span>
                <Badge variant="outline">table</Badge>
                {draft && <Badge variant="secondary">draft</Badge>}
                <span className="text-3xs text-muted-foreground">
                    {columns.length} columns · derived from the Mongoose schema ·{" "}
                    {coverage.unbound.length} readable path
                    {coverage.unbound.length === 1 ? "" : "s"} with no column
                </span>

                <div className="ml-auto flex items-center gap-2">
                    <DeviceToggle device={previewDevice} onSelect={setPreviewDevice} />
                    <TooltipDisplayer tooltip="Discard this table's draft">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={!draft}
                            onClick={() => {
                                clearTableDraft(entry.collection);
                                setSelectedId(null);
                            }}
                        >
                            <IconRotate className="size-4" />
                            Reset
                        </Button>
                    </TooltipDisplayer>
                    <Button type="button" size="sm" onClick={() => setExportOpen(true)}>
                        <IconCode className="size-4" />
                        Export
                    </Button>
                </div>
            </div>

            <div className="flex min-h-0 flex-1 overflow-hidden">
                <div className="flex w-80 shrink-0 flex-col overflow-hidden border-r">
                    <div className="flex shrink-0 items-center gap-1 border-b px-2 py-1">
                        {(["columns", "fields"] as const).map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setLeftTab(tab)}
                                className={cn(
                                    "rounded px-1.5 py-0.5 text-3xs font-medium uppercase tracking-wide transition-colors",
                                    leftTab === tab
                                        ? "bg-muted text-foreground"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {tab}
                                <span className="ml-1 tabular-nums">
                                    {tab === "columns" ? columns.length : fields.length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {leftTab === "fields" ? (
                        <FieldsPane
                            fields={fields}
                            mode="table"
                            /* No `onAdd`: a column is generated from the schema's
                               `dynamicTableConfiguration`, so one cannot be conjured here. */
                            onReveal={(field) =>
                                field.column && setSelectedId(field.column.id)
                            }
                        />
                    ) : (
                        <div className="min-h-0 flex-1 overflow-y-auto p-1">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={columns.map((column) => column.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="flex flex-col gap-px">
                                        {columns.map((column) => (
                                            <SortableColumnRow
                                                key={column.id}
                                                column={column}
                                                selected={selectedId === column.id}
                                                onSelect={() => setSelectedId(column.id)}
                                                onToggleVisible={() =>
                                                    commit(
                                                        columns.map((c) =>
                                                            c.id === column.id
                                                                ? {...c, visible: !c.visible}
                                                                : c,
                                                        ),
                                                    )
                                                }
                                                onRemove={() => {
                                                    commit(columns.filter((c) => c.id !== column.id));
                                                    if (selectedId === column.id) setSelectedId(null);
                                                }}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col overflow-hidden p-3">
                    {entry.apiUrl ? (
                        <DeviceFrame device={previewDevice}>
                            <CardAndTableView<TableResponse<Record<string, unknown> & {_id: string}>>
                                /* Remount when the draft changes so the table rebuilds its column defs. */
                                key={`${previewKey}:${columns.map((c) => c.id).join("|")}`}
                                url={entry.apiUrl}
                                tableConfigKey={previewKey}
                                access={entry.accessModel ?? entry.collection}
                                configurations={{limit: 10}}
                                containersClassName={{scrollRootClassName: "flex-full"}}
                                tableConfigOptions={{
                                    filterConfig: {placeholder: "Search", fields: {}},
                                }}
                                renderFunctions={{
                                    cardRender: () => <></>,
                                    action: () => null,
                                }}
                            />
                        </DeviceFrame>
                    ) : (
                        <p className="p-4 text-2xs text-muted-foreground">
                            No view config for this model, so its CRUD base path is unknown — the
                            live table preview needs one. Column editing and export still work.
                        </p>
                    )}
                    <LintPanel
                        findings={findings}
                        selectedPath={selectedId}
                        onSelectPath={setSelectedId}
                    />
                </div>

                <div className="w-80 shrink-0 overflow-y-auto border-l">
                    {selected ? (
                        <ColumnInspector
                            key={selected.id}
                            column={selected}
                            pristine={pristineById.get(selected.id)}
                            onChange={(next, coalesceKey) =>
                                commit(
                                    columns.map((c) => (c.id === next.id ? next : c)),
                                    coalesceKey ? `${next.id}:${coalesceKey}` : undefined,
                                )
                            }
                        />
                    ) : (
                        <p className="p-4 text-2xs text-muted-foreground">
                            Select a column to edit it.
                        </p>
                    )}
                </div>
            </div>

            <ExportDialog
                open={exportOpen}
                onOpenChange={setExportOpen}
                title={`Export ${entry.collection} · table`}
                filePathHint={`maestro/modules/*/database/schemas/${singularizeCollection(entry.collection)}/${singularizeCollection(entry.collection)}.ts`}
                code={dynamicTableConfigToTs(entry.collection, entry.columns, columns)}
                changes={changes}
                findings={findings}
                notes={[
                    "Table columns are generated from Mongoose schema paths, so these blocks go on the schema file, not a views file.",
                ]}
            />
        </div>
    );
}
