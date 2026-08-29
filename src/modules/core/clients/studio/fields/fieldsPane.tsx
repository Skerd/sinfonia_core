import {useMemo, useState} from "react";
import {IconAlertTriangle, IconEyeOff, IconPlus} from "@tabler/icons-react";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {Switch} from "@coreModule/components/ui/switch.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {
    filterFields,
    isRendered,
    summarizeFields,
    type FieldRenderSite,
    type FieldScope,
    type FieldStatusFilter,
    type FieldsMode,
    type ModelField,
} from "./modelFields.ts";

type FieldsPaneProps = {
    fields: ModelField[];
    mode: FieldsMode;
    /** Must match the scope the fields were built with; it decides how a row is labelled. */
    scope?: FieldScope;
    /** Jumps to the node (or column) that renders a field. */
    onReveal?: (field: ModelField, site?: FieldRenderSite) => void;
    /** Adds an unrendered field. Omitted where the editor has no way to create one. */
    onAdd?: (field: ModelField) => void;
};

const STATUS_LABEL: Record<FieldStatusFilter, string> = {
    all: "all",
    rendered: "rendered",
    missing: "missing",
};

/** Dimmed parent prefix, so an indented row still says which path it is. */
function FieldPath({field}: {field: ModelField}) {
    const prefix = field.path.slice(0, field.path.length - field.name.length);
    return (
        <span className="min-w-0 flex-1 truncate font-mono text-2xs" title={field.path}>
            {prefix && <span className="text-muted-foreground/60">{prefix}</span>}
            {field.name}
        </span>
    );
}

/**
 * Every field of the model, and what the open configuration does with it.
 *
 * Sits beside the coverage pane rather than replacing it: coverage is a worklist of what to
 * add next, this is the reference you scan when checking a config against the schema — which
 * is why nothing is filtered out of it by default, not even paths a bound ancestor already
 * covers or paths bound but missing from the allowlist.
 */
export default function FieldsPane({
    fields,
    mode,
    scope = "all",
    onReveal,
    onAdd,
}: FieldsPaneProps) {
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState<FieldStatusFilter>("all");
    const [leavesOnly, setLeavesOnly] = useState(false);

    const summary = useMemo(() => summarizeFields(fields, mode), [fields, mode]);
    const visible = useMemo(
        () => filterFields(fields, mode, {query, status, leavesOnly}),
        [fields, mode, query, status, leavesOnly],
    );

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex shrink-0 items-center gap-2 border-b px-2 py-1">
                <span className="text-3xs text-muted-foreground">
                    {summary.rendered} of {summary.total}{" "}
                    {scope === "writable" ? "writable " : ""}field
                    {summary.total === 1 ? "" : "s"} {mode === "table" ? "have a column" : "rendered"}
                </span>
                {summary.unknown > 0 && (
                    <TooltipDisplayer tooltip="Bound here but in neither allowlist — a typo, or a path the API computes">
                        <Badge variant="outline" className="shrink-0 gap-1 px-1 text-3xs text-warning">
                            <IconAlertTriangle className="size-3" />
                            {summary.unknown} off-schema
                        </Badge>
                    </TooltipDisplayer>
                )}
            </div>

            <div className="flex shrink-0 items-center gap-2 border-b px-2 py-1">
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filter fields"
                    className="h-7 border-0 bg-transparent px-0 text-2xs shadow-none focus-visible:ring-0"
                />
                <Label htmlFor="fields-leaves" className="shrink-0 text-3xs text-muted-foreground">
                    leaves only
                </Label>
                <Switch id="fields-leaves" checked={leavesOnly} onCheckedChange={setLeavesOnly} />
            </div>

            <div className="flex shrink-0 items-center gap-1 border-b px-2 py-1">
                {(["all", "rendered", "missing"] as const).map((option) => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => setStatus(option)}
                        className={cn(
                            "rounded px-1.5 py-0.5 text-3xs font-medium uppercase tracking-wide transition-colors",
                            status === option
                                ? "bg-muted text-foreground"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        {STATUS_LABEL[option]}
                        {option !== "all" && (
                            <span className="ml-1 tabular-nums">
                                {option === "rendered" ? summary.rendered : summary.missing}
                            </span>
                        )}
                    </button>
                ))}
                <span className="ml-auto text-3xs tabular-nums text-muted-foreground">
                    {visible.length} shown
                </span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                {visible.length === 0 ? (
                    <p className="px-2 py-6 text-center text-3xs text-muted-foreground">
                        {fields.length === 0
                            ? scope === "writable"
                                ? "No writable paths for this account, so this form has nothing to offer."
                                : "No readable paths for this account, so there is nothing to list."
                            : "Nothing matches the filter."}
                    </p>
                ) : (
                    <ul className="flex flex-col">
                        {visible.map((field) => {
                            const site = field.renderedBy[0];
                            const rendered = isRendered(field, mode);
                            const canReveal = !!onReveal && rendered;
                            return (
                                <li
                                    key={field.path}
                                    className={cn(
                                        "group/field flex items-center gap-1.5 py-1 pr-1 hover:bg-muted/60",
                                        !field.inAllowlist && "bg-warning/5",
                                    )}
                                    /* Indent by depth so a subtree reads as one, without a
                                       second tree widget to keep in sync with the first. */
                                    style={{paddingLeft: 8 + field.depth * 10}}
                                >
                                    {canReveal ? (
                                        <button
                                            type="button"
                                            onClick={() => onReveal?.(field, site)}
                                            className="flex min-w-0 flex-1 items-center text-left hover:text-primary"
                                            title={
                                                mode === "table"
                                                    ? `Select the ${field.path} column`
                                                    : `Select the node bound to ${field.path}`
                                            }
                                        >
                                            <FieldPath field={field} />
                                        </button>
                                    ) : (
                                        <FieldPath field={field} />
                                    )}

                                    {!field.inAllowlist && (
                                        <TooltipDisplayer tooltip="Not in the read or write allowlist">
                                            <IconAlertTriangle className="size-3 shrink-0 text-warning" />
                                        </TooltipDisplayer>
                                    )}
                                    {/* In a write-scoped list every row is writable but the
                                        bound exceptions, so the exception is what gets a mark. */}
                                    {scope === "writable"
                                        ? !field.writable && (
                                              <TooltipDisplayer tooltip="Bound by this form but not writable — maestro serves it disabled">
                                                  <Badge
                                                      variant="outline"
                                                      className="shrink-0 px-1 text-3xs text-muted-foreground"
                                                  >
                                                      read-only
                                                  </Badge>
                                              </TooltipDisplayer>
                                          )
                                        : field.writable && (
                                              <TooltipDisplayer tooltip="Writable by this account">
                                                  <Badge
                                                      variant="outline"
                                                      className="shrink-0 px-1 text-3xs"
                                                  >
                                                      w
                                                  </Badge>
                                              </TooltipDisplayer>
                                          )}
                                    {field.column && (
                                        <TooltipDisplayer
                                            tooltip={
                                                field.column.visible
                                                    ? `Table column · ${field.column.cellType}`
                                                    : `Table column, hidden by default · ${field.column.cellType}`
                                            }
                                        >
                                            <Badge
                                                variant="outline"
                                                className="shrink-0 gap-1 px-1 text-3xs"
                                            >
                                                {!field.column.visible && (
                                                    <IconEyeOff className="size-3" />
                                                )}
                                                {field.column.cellType}
                                            </Badge>
                                        </TooltipDisplayer>
                                    )}

                                    {mode === "view" && site && (
                                        <Badge
                                            variant="secondary"
                                            className="shrink-0 px-1 font-mono text-3xs"
                                        >
                                            {site.widget}
                                            {field.renderedBy.length > 1 &&
                                                ` ×${field.renderedBy.length}`}
                                        </Badge>
                                    )}
                                    {mode === "view" && !site && field.coveredByAncestor && (
                                        <TooltipDisplayer tooltip="Shown through a bound ancestor node, without a node of its own">
                                            <span className="shrink-0 text-3xs text-muted-foreground">
                                                via parent
                                            </span>
                                        </TooltipDisplayer>
                                    )}

                                    {onAdd && !rendered ? (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-label={`Add ${field.path}`}
                                            className="size-6 shrink-0 opacity-0 transition-opacity group-hover/field:opacity-100"
                                            onClick={() => onAdd(field)}
                                        >
                                            <IconPlus className="size-3.5" />
                                        </Button>
                                    ) : (
                                        onAdd && <span className="size-6 shrink-0" />
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
