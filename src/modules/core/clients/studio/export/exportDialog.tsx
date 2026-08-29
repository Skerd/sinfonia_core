import {useEffect, useState} from "react";
import {toast} from "sonner";
import {IconCopy, IconAlertTriangle} from "@tabler/icons-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@coreModule/components/ui/dialog.tsx";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@coreModule/components/ui/tabs.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {type Change, formatChange} from "./changeList.ts";
import {countBySeverity, type LintFinding} from "../lint/viewLint.ts";
import ApplyToSourcePanel from "../source/applyToSourcePanel.tsx";

type ExportDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    /** Where the generated code belongs in the repo. */
    filePathHint: string;
    code: string;
    changes: Change[];
    /** Extra caveats specific to this export (e.g. column order). */
    notes?: string[];
    /** Static checks on the config being exported, surfaced before it is copied. */
    findings?: LintFinding[];
    /**
     * `${model}:${viewKey}`. When set and the dev-server source routes are up, the dialog
     * offers to write property changes straight into the real file.
     */
    sourceTarget?: string;
    /** Clears the draft once its changes are in source. */
    onAppliedToSource?: () => void;
    /** Which tab to open on. Lets the header's Apply button skip straight to it. */
    defaultTab?: "changes" | "code" | "source";
};

const CHANGE_TONE: Record<Change["kind"], string> = {
    added: "text-success",
    removed: "text-destructive",
    moved: "text-info",
    changed: "text-warning",
};

export default function ExportDialog({
    open,
    onOpenChange,
    title,
    filePathHint,
    code,
    changes,
    notes = [],
    findings = [],
    sourceTarget,
    onAppliedToSource,
    defaultTab = "changes",
}: ExportDialogProps) {
    const {errors, warnings} = countBySeverity(findings);
    const [tab, setTab] = useState<string>(defaultTab);

    /* Reopening from a different entry point should land on that entry point's tab. */
    useEffect(() => {
        if (open) setTab(defaultTab);
    }, [open, defaultTab]);

    const copy = async (text: string, what: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${what} copied`);
        } catch {
            toast.error("Clipboard unavailable — select the text and copy manually");
        }
    };

    const changeText = changes.map((change) => `- ${formatChange(change)}`).join("\n");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription asChild>
                        <div className="flex flex-col gap-1">
                            <span>
                                Target: <code className="text-2xs">{filePathHint}</code>
                            </span>
                            <span className="flex items-start gap-1 text-2xs text-warning">
                                <IconAlertTriangle className="mt-px size-3 shrink-0" />
                                <span>
                                    Apply the <strong>change list</strong> to the real file. The
                                    generated code comes from the API payload, so imported constants
                                    appear as literals and shared node fragments appear expanded —
                                    it is a reference, not a paste-over.
                                </span>
                            </span>
                            {(errors > 0 || warnings > 0) && (
                                <span className="flex items-start gap-1 text-2xs text-warning">
                                    <IconAlertTriangle className="mt-px size-3 shrink-0" />
                                    <span>
                                        The Checks panel reports {errors} error
                                        {errors === 1 ? "" : "s"} and {warnings} warning
                                        {warnings === 1 ? "" : "s"} on this config — worth clearing
                                        before it goes into source.
                                    </span>
                                </span>
                            )}
                            {notes.map((note) => (
                                <span key={note} className="text-2xs text-muted-foreground">
                                    {note}
                                </span>
                            ))}
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
                    <div className="flex items-center justify-between gap-2">
                        <TabsList>
                            <TabsTrigger value="changes">
                                Change list
                                <Badge variant="secondary" className="ml-1.5 tabular-nums">
                                    {changes.length}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="code">TypeScript</TabsTrigger>
                            {sourceTarget && (
                                <TabsTrigger value="source">Apply to source</TabsTrigger>
                            )}
                        </TabsList>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                tab === "code"
                                    ? copy(code, "TypeScript")
                                    : copy(changeText, "Change list")
                            }
                        >
                            <IconCopy className="size-4" />
                            Copy
                        </Button>
                    </div>

                    <TabsContent value="changes" className="min-h-0 flex-1 overflow-y-auto">
                        {changes.length === 0 ? (
                            <p className="p-4 text-sm text-muted-foreground">
                                No differences from the served config.
                            </p>
                        ) : (
                            <ul className="flex flex-col gap-1 p-1">
                                {changes.map((change, index) => (
                                    <li
                                        key={`${change.kind}-${change.to ?? change.from}-${index}`}
                                        className="flex items-start gap-2 rounded border px-2 py-1 font-mono text-2xs"
                                    >
                                        <span className={CHANGE_TONE[change.kind]}>{change.kind}</span>
                                        <span className="min-w-0 break-words">
                                            {formatChange(change)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </TabsContent>

                    <TabsContent value="code" className="min-h-0 flex-1 overflow-auto">
                        <pre className="rounded border bg-muted/40 p-3 font-mono text-2xs leading-relaxed">
                            {code}
                        </pre>
                    </TabsContent>

                    {sourceTarget && (
                        <TabsContent value="source" className="min-h-0 flex-1 overflow-y-auto">
                            <ApplyToSourcePanel
                                target={sourceTarget}
                                changes={changes}
                                onApplied={() => onAppliedToSource?.()}
                            />
                        </TabsContent>
                    )}
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
