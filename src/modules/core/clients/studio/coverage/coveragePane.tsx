import {useMemo, useState} from "react";
import {IconAlertTriangle, IconPlus, IconWand} from "@tabler/icons-react";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Switch} from "@coreModule/components/ui/switch.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import type {Coverage, CoveragePath} from "./viewCoverage.ts";
import {widgetForPath} from "../scaffold/scaffoldView.ts";

type CoveragePaneProps = {
    coverage: Coverage;
    mode: "sheet" | "form";
    /** Inserts one path as a bound node. */
    onAdd: (entry: CoveragePath) => void;
    /** Inserts every listed path, grouped. */
    onScaffold: (entries: CoveragePath[]) => void;
    /** Whether the view already has nodes, so scaffolding would append to them. */
    hasExistingNodes: boolean;
};

/**
 * Which allowed paths this view does not show.
 *
 * The comparison is against the read/write allowlist rather than the schema, so every
 * row here is a field the account may see and the view omits — the same list maestro
 * prunes against, which is what makes it actionable rather than merely interesting.
 */
export default function CoveragePane({
    coverage,
    mode,
    onAdd,
    onScaffold,
    hasExistingNodes,
}: CoveragePaneProps) {
    const [query, setQuery] = useState("");
    const [leavesOnly, setLeavesOnly] = useState(true);

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return coverage.unbound.filter(
            (entry) =>
                (!leavesOnly || entry.leaf) &&
                (!needle || entry.path.toLowerCase().includes(needle)),
        );
    }, [coverage.unbound, leavesOnly, query]);

    const boundCount = coverage.bound.length;

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex shrink-0 items-center gap-2 border-b px-2 py-1">
                <span className="text-3xs text-muted-foreground">
                    {boundCount} bound · {coverage.unbound.length} unbound of {coverage.total}{" "}
                    {mode === "sheet" ? "readable" : "writable"} paths
                </span>
                <TooltipDisplayer
                    tooltip={
                        hasExistingNodes
                            ? "Appends a group per batch of listed fields to the existing tree"
                            : "Builds a starting view from the listed fields"
                    }
                >
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="ml-auto h-6 text-3xs"
                        disabled={visible.length === 0}
                        onClick={() => onScaffold(visible)}
                    >
                        <IconWand className="size-3.5" />
                        Scaffold {visible.length}
                    </Button>
                </TooltipDisplayer>
            </div>

            <div className="flex shrink-0 items-center gap-2 border-b px-2 py-1">
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filter paths"
                    className="h-7 border-0 bg-transparent px-0 text-2xs shadow-none focus-visible:ring-0"
                />
                <Label htmlFor="coverage-leaves" className="shrink-0 text-3xs text-muted-foreground">
                    leaves only
                </Label>
                <Switch id="coverage-leaves" checked={leavesOnly} onCheckedChange={setLeavesOnly} />
            </div>

            {coverage.unknown.length > 0 && (
                <div className="shrink-0 border-b bg-warning/10 px-2 py-1">
                    <p className="flex items-start gap-1 text-3xs text-warning">
                        <IconAlertTriangle className="mt-px size-3 shrink-0" />
                        <span>
                            Bound but not in the allowlist:{" "}
                            <span className="font-mono">{coverage.unknown.join(", ")}</span>
                        </span>
                    </p>
                </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto">
                {visible.length === 0 ? (
                    <p className="px-2 py-6 text-center text-3xs text-muted-foreground">
                        {coverage.unbound.length === 0
                            ? "Every allowed path is bound in this view."
                            : "Nothing matches the filter."}
                    </p>
                ) : (
                    <ul className="flex flex-col">
                        {visible.map((entry) => (
                            <li
                                key={entry.path}
                                className="group/cov flex items-center gap-1.5 px-2 py-1 hover:bg-muted/60"
                            >
                                <span className="min-w-0 flex-1 truncate font-mono text-2xs">
                                    {entry.path}
                                </span>
                                {entry.cellType && (
                                    <Badge variant="outline" className="shrink-0 px-1 text-3xs">
                                        {entry.cellType}
                                    </Badge>
                                )}
                                <Badge variant="secondary" className="shrink-0 px-1 font-mono text-3xs">
                                    {widgetForPath(entry, mode)}
                                </Badge>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Add ${entry.path}`}
                                    className="size-6 shrink-0 opacity-0 transition-opacity group-hover/cov:opacity-100"
                                    onClick={() => onAdd(entry)}
                                >
                                    <IconPlus className="size-3.5" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
