import {useMemo, useState} from "react";
import type {ViewConfig, ViewType} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@coreModule/components/ui/dialog.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import type {StudioModelEntry} from "./useStudioCatalog.ts";
import {computeCoverage} from "../coverage/viewCoverage.ts";
import {scaffoldNodes} from "../scaffold/scaffoldView.ts";

type NewViewDialogProps = {
    entry: StudioModelEntry;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (viewKey: string, config: ViewConfig) => void;
};

/** The three keys the Studio understands, minus whatever this model already has. */
const CHOICES: {viewKey: string; viewType: ViewType; viewMode?: "create" | "edit"; label: string}[] = [
    {viewKey: "sheet", viewType: "sheet", label: "Sheet"},
    {viewKey: "form:create", viewType: "form", viewMode: "create", label: "Form · create"},
    {viewKey: "form:edit", viewType: "form", viewMode: "edit", label: "Form · edit"},
];

/**
 * Starts a view for a model that has none.
 *
 * Such a model is currently a dead end: the catalog shows "no views" and there is no way in.
 * `apiUrl` has to be asked for because nothing else carries it — the table config is derived
 * from the schema and never mentions a route, and `accessModel` is conventionally the
 * collection name.
 */
export default function NewViewDialog({entry, open, onOpenChange, onCreate}: NewViewDialogProps) {
    const available = CHOICES.filter((choice) => !entry.viewKeys.includes(choice.viewKey));
    const [viewKey, setViewKey] = useState(available[0]?.viewKey ?? "sheet");
    const [apiUrl, setApiUrl] = useState(entry.apiUrl ?? "");
    const [scaffold, setScaffold] = useState(true);

    const choice = CHOICES.find((c) => c.viewKey === viewKey) ?? CHOICES[0]!;
    const mode = choice.viewType === "form" ? "form" : "sheet";

    /* Sheets are gated on read, forms on write — the same split the rest of the Studio uses. */
    const coverage = useMemo(
        () =>
            computeCoverage(
                [],
                mode === "sheet" ? entry.readPaths : entry.writePaths,
                entry.columns,
            ),
        [mode, entry.readPaths, entry.writePaths, entry.columns],
    );

    const fieldCount = coverage.unbound.filter((path) => path.leaf).length;

    const create = () => {
        const config: ViewConfig = {
            model: entry.collection,
            viewType: choice.viewType,
            ...(choice.viewMode ? {viewMode: choice.viewMode} : {}),
            accessModel: entry.accessModel ?? entry.collection,
            apiUrl: apiUrl.trim(),
            ...(choice.viewMode === "create"
                ? {method: "PUT" as const}
                : choice.viewMode === "edit"
                  ? {method: "PATCH" as const}
                  : {}),
            nodes: scaffold ? scaffoldNodes(coverage.unbound, mode, {groupTitle: entry.collection}) : [],
        };
        onCreate(choice.viewKey, config);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>New view for {entry.collection}</DialogTitle>
                    <DialogDescription>
                        Creates a draft. Nothing is written to source until you export or apply it.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-2xs">View</Label>
                        <div className="flex flex-wrap gap-1.5">
                            {CHOICES.map((option) => {
                                const exists = entry.viewKeys.includes(option.viewKey);
                                return (
                                    <Button
                                        key={option.viewKey}
                                        type="button"
                                        size="sm"
                                        variant={viewKey === option.viewKey ? "default" : "outline"}
                                        disabled={exists}
                                        onClick={() => setViewKey(option.viewKey)}
                                    >
                                        {option.label}
                                        {exists && (
                                            <Badge variant="secondary" className="ml-1 text-3xs">
                                                exists
                                            </Badge>
                                        )}
                                    </Button>
                                );
                            })}
                        </div>
                        {available.length === 0 && (
                            <p className="text-3xs text-muted-foreground">
                                This model already has all three views.
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label className="text-2xs">apiUrl</Label>
                        <Input
                            value={apiUrl}
                            placeholder="/api/auxiliary/thing"
                            className="h-8 font-mono text-2xs"
                            onChange={(event) => setApiUrl(event.target.value)}
                        />
                        <p className="text-3xs text-muted-foreground">
                            The CRUD base path. Nothing in the table config carries it, so it has
                            to be supplied — the preview loads its sample rows from here.
                        </p>
                    </div>

                    <label className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            checked={scaffold}
                            onChange={(event) => setScaffold(event.target.checked)}
                            className="mt-0.5"
                        />
                        <span className="text-2xs">
                            Scaffold from the schema
                            <span className="block text-3xs text-muted-foreground">
                                {fieldCount} {mode === "sheet" ? "readable" : "writable"} path
                                {fieldCount === 1 ? "" : "s"}, grouped, with a widget chosen per
                                column type. Otherwise the view starts empty.
                            </span>
                        </span>
                    </label>
                </div>

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={available.length === 0 || apiUrl.trim() === ""}
                        onClick={create}
                    >
                        Create draft
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
