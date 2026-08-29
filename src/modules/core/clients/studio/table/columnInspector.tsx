import {useMemo, useState, type ReactNode} from "react";
import type {
    TableColumnConfig,
} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type";
import {COLUMN_TYPE} from "armonia/src/modules/core/database/filter/typeOperators";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Separator} from "@coreModule/components/ui/separator.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@coreModule/components/ui/collapsible.tsx";
import {IconAlertTriangle, IconChevronRight, IconX} from "@tabler/icons-react";
import {csvToList, Row, ToggleRow} from "../inspector/inspectorControls.tsx";
import {
    clearColumnMetaKey,
    columnDeadEntries,
    columnRelevanceFor,
    type ColumnInspectorKey,
} from "./columnRelevance.ts";

type ColumnInspectorProps = {
    column: TableColumnConfig;
    /** The served column, used to restore `filterConfig` when filtering is re-enabled. */
    pristine: TableColumnConfig | undefined;
    /** `coalesceKey` names the control, so typing collapses into one undo entry. */
    onChange: (next: TableColumnConfig, coalesceKey?: string) => void;
};

const CELL_TYPES = Object.values(COLUMN_TYPE);

type Slot = {key: ColumnInspectorKey; render: () => ReactNode};

export default function ColumnInspector({column, pristine, onChange}: ColumnInspectorProps) {
    const [advancedOpen, setAdvancedOpen] = useState(false);

    const setMeta = (patch: Record<string, unknown>, coalesceKey?: string) => {
        const merged = {...(column.meta ?? {}), ...patch} as Record<string, unknown>;
        for (const [key, value] of Object.entries(merged)) {
            if (value === undefined) delete merged[key];
        }
        onChange(
            {
                ...column,
                meta: Object.keys(merged).length > 0
                    ? (merged as unknown as TableColumnConfig["meta"])
                    : undefined,
            },
            coalesceKey,
        );
    };

    /* `filterConfig` is derived server-side from the Mongoose SchemaType — it cannot be
       authored, only switched off. Toggling restores the served value verbatim. */
    const canFilter = !!pristine?.filterConfig;

    const dead = useMemo(() => columnDeadEntries(column), [column]);

    const slots: Slot[] = [
        {
            key: "visible",
            render: () => (
                <ToggleRow
                    label="visible"
                    hint="Default visibility. Users can still toggle it per table."
                    checked={column.visible}
                    onCheckedChange={(value) => onChange({...column, visible: value})}
                />
            ),
        },
        {
            key: "sortable",
            render: () => (
                <ToggleRow
                    label="sortable"
                    checked={column.sortable}
                    onCheckedChange={(value) => onChange({...column, sortable: value})}
                />
            ),
        },
        {
            key: "filterable",
            render: () => (
                <ToggleRow
                    label="filterable"
                    hint={
                        canFilter
                            ? "Off exports `filterable: false`."
                            : "This path has no derived filter config, so it is never filterable."
                    }
                    checked={!!column.filterConfig}
                    onCheckedChange={(value) =>
                        onChange({
                            ...column,
                            filterConfig: value ? pristine?.filterConfig : undefined,
                        })
                    }
                />
            ),
        },
        {
            key: "cellType",
            render: () => (
                <Row
                    label="cellType"
                    hint="Overrides what the schema type would infer, and decides which meta keys apply."
                >
                    <select
                        value={column.cellType}
                        onChange={(e) =>
                            onChange({...column, cellType: e.target.value as COLUMN_TYPE})
                        }
                        className="h-8 rounded border bg-background px-2 font-mono text-2xs"
                    >
                        {CELL_TYPES.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </Row>
            ),
        },
        {
            key: "meta.refDisplayKey",
            render: () => (
                <Row
                    label="meta.refDisplayKey"
                    hint='Comma-separated paths on the populated doc. Prefix "!" for a literal. Defaults to ["name"].'
                >
                    <Input
                        value={column.meta?.refDisplayKey?.join(", ") ?? ""}
                        className="h-8 font-mono text-2xs"
                        onChange={(e) => setMeta({refDisplayKey: csvToList(e.target.value)}, "meta.refDisplayKey")}
                    />
                </Row>
            ),
        },
        {
            key: "dtoPath",
            render: () => (
                <Row label="dtoPath" hint="Read the value from this path instead of accessorPath.">
                    <Input
                        value={column.dtoPath ?? ""}
                        className="h-8 font-mono text-2xs"
                        onChange={(e) => onChange({...column, dtoPath: e.target.value || undefined}, "dtoPath")}
                    />
                </Row>
            ),
        },
        {
            key: "meta.className",
            render: () => (
                <Row label="meta.className" hint="Applied to the column header and cells.">
                    <Input
                        value={column.meta?.className ?? ""}
                        className="h-8 font-mono text-2xs"
                        onChange={(e) => setMeta({className: e.target.value || undefined}, "meta.className")}
                    />
                </Row>
            ),
        },
        {
            key: "meta.maxInlineItems",
            render: () => (
                <Row
                    label="meta.maxInlineItems"
                    hint="Ref badges shown before collapsing to a popover. Client default 2."
                >
                    <Input
                        type="number"
                        min={1}
                        value={column.meta?.maxInlineItems ?? ""}
                        className="h-8 font-mono text-2xs"
                        onChange={(e) =>
                            setMeta(
                                {
                                    maxInlineItems: e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                },
                                "meta.maxInlineItems",
                            )
                        }
                    />
                </Row>
            ),
        },
        {
            key: "meta.hrefTemplate",
            render: () => (
                <Row
                    label="meta.hrefTemplate"
                    hint="In-app path for objectId cells; {_id} is substituted."
                >
                    <Input
                        value={column.meta?.hrefTemplate ?? ""}
                        className="h-8 font-mono text-2xs"
                        onChange={(e) => setMeta({hrefTemplate: e.target.value || undefined}, "meta.hrefTemplate")}
                    />
                </Row>
            ),
        },
    ];

    const primary = slots.filter((slot) => columnRelevanceFor(slot.key, column).state === "primary");
    const advanced = slots.filter(
        (slot) => columnRelevanceFor(slot.key, column).state === "advanced",
    );

    return (
        <div className="flex flex-col gap-4 p-3">
            <div>
                <p className="text-3xs uppercase tracking-wide text-muted-foreground">Column</p>
                <p className="mt-1 font-mono text-sm">{column.id}</p>
                <p className="text-3xs text-muted-foreground">
                    id, accessorPath and labelKey are all the schema path — the backend never
                    differentiates them.
                </p>
            </div>

            {dead.length > 0 && (
                <div className="rounded border border-warning/40 bg-warning/10 p-2">
                    <p className="mb-1.5 flex items-center gap-1 text-3xs font-medium uppercase tracking-wide text-warning">
                        <IconAlertTriangle className="size-3 shrink-0" />
                        Dead config
                    </p>
                    <div className="flex flex-col gap-2">
                        {dead.map((entry) => (
                            <div key={entry.key} className="flex items-start gap-2">
                                <div className="min-w-0 flex-1">
                                    <p className="font-mono text-3xs">
                                        {entry.key}
                                        <span className="text-muted-foreground">
                                            {" = "}
                                            {JSON.stringify(entry.value)}
                                        </span>
                                    </p>
                                    <p className="text-3xs text-muted-foreground">{entry.reason}</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Remove ${entry.key}`}
                                    className="size-6 shrink-0"
                                    onClick={() => onChange(clearColumnMetaKey(column, entry.key))}
                                >
                                    <IconX className="size-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-3">
                {primary.map((slot) => (
                    <div key={slot.key}>{slot.render()}</div>
                ))}
            </div>

            {advanced.length > 0 && (
                <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                    <CollapsibleTrigger className="flex w-full items-center gap-1 text-3xs text-muted-foreground hover:text-foreground">
                        <IconChevronRight
                            className={`size-3 transition-transform ${advancedOpen ? "rotate-90" : ""}`}
                        />
                        Advanced
                        <Badge variant="outline" className="ml-1 px-1 text-3xs tabular-nums">
                            {advanced.length}
                        </Badge>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 flex flex-col gap-3 border-l pl-2">
                        {advanced.map((slot) => (
                            <div key={slot.key}>{slot.render()}</div>
                        ))}
                    </CollapsibleContent>
                </Collapsible>
            )}

            <Separator />

            <div>
                <p className="mb-1 text-3xs uppercase tracking-wide text-muted-foreground">
                    Derived filter (read-only)
                </p>
                {column.filterConfig ? (
                    <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="font-mono text-3xs">
                                {column.filterConfig.type}
                            </Badge>
                            {column.filterConfig.ref && (
                                <Badge variant="secondary" className="font-mono text-3xs">
                                    ref: {column.filterConfig.ref}
                                </Badge>
                            )}
                        </div>
                        <p className="font-mono text-3xs text-muted-foreground">
                            {column.filterConfig.operators.join(", ")}
                        </p>
                        {column.filterConfig.apiUrl && (
                            <p className="font-mono text-3xs text-muted-foreground">
                                {column.filterConfig.apiUrl}
                            </p>
                        )}
                        {!!column.filterConfig.enumValues?.length && (
                            <p className="font-mono text-3xs text-muted-foreground">
                                {column.filterConfig.enumValues.join(" · ")}
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="flex items-start gap-1 text-3xs text-muted-foreground">
                        <IconAlertTriangle className="mt-px size-3 shrink-0" />
                        No filter config. `tableConfigToFilterConfig` drops columns without
                        operators, so this path never reaches the Filter Builder.
                    </p>
                )}
            </div>
        </div>
    );
}
