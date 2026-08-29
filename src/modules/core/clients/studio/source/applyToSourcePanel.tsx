import {useMemo, useState} from "react";
import {toast} from "sonner";
import {IconAlertTriangle, IconArrowRight, IconDeviceFloppy, IconShieldCheck} from "@tabler/icons-react";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@coreModule/components/ui/alert.tsx";
import type {Change} from "../export/changeList.ts";
import {
    applyToSource,
    shortPath,
    type ApplyResponse,
    type SourceEdit,
} from "./sourceClient.ts";

type ApplyToSourcePanelProps = {
    /** `${model}:${viewKey}`. */
    target: string;
    changes: Change[];
    /** Cleared once the write succeeds, so the draft stops diverging from source. */
    onApplied: () => void;
};

/**
 * Writes the change list back into the real `*.views.ts`.
 *
 * Only property changes are written. `diffNodeTrees` also reports adds, removes and moves,
 * and splicing whole nodes in and out of a source array is a materially riskier operation
 * than setting a key — those stay in the change list for the developer, and this panel says
 * so rather than quietly dropping them.
 */
export default function ApplyToSourcePanel({target, changes, onApplied}: ApplyToSourcePanelProps) {
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<ApplyResponse | null>(null);
    /** Set when the server refused because the node array is shared. */
    const [pendingShared, setPendingShared] = useState<string[] | null>(null);

    const {edits, unsupported} = useMemo(() => {
        const supported: SourceEdit[] = [];
        const rest: Change[] = [];
        for (const change of changes) {
            if (change.kind === "changed" && change.keys?.length && change.to && change.node) {
                for (const key of change.keys) {
                    const value = (change.node as unknown as Record<string, unknown>)[key];
                    supported.push(
                        value === undefined
                            ? {kind: "removeProperty", nodePath: change.to, property: key}
                            : {kind: "setProperty", nodePath: change.to, property: key, value},
                    );
                }
            } else {
                rest.push(change);
            }
        }
        return {edits: supported, unsupported: rest};
    }, [changes]);

    const run = async (confirmShared: boolean) => {
        setBusy(true);
        setPendingShared(null);
        const response = await applyToSource({target, edits, confirmShared});
        setBusy(false);
        setResult(response);

        if (!response.ok && response.sharedWith?.length) {
            setPendingShared(response.sharedWith);
            return;
        }
        if (response.ok) {
            const applied = response.outcomes.filter((o) => o.status === "applied").length;
            toast.success(
                `Wrote ${applied} edit${applied === 1 ? "" : "s"} to ${shortPath(response.file ?? "")}`,
            );
            if (applied > 0) onApplied();
        } else {
            toast.error(response.error ?? "Could not write to source");
        }
    };

    if (edits.length === 0) {
        return (
            <p className="p-4 text-2xs text-muted-foreground">
                Nothing here can be written automatically. Adds, removes and moves are node-level
                changes; apply those from the change list by hand.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-3 p-1">
            <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" disabled={busy} onClick={() => run(false)}>
                    <IconDeviceFloppy className="size-4" />
                    {busy ? "Writing…" : `Apply ${edits.length} edit${edits.length === 1 ? "" : "s"}`}
                </Button>
                {unsupported.length > 0 && (
                    <Badge variant="outline">
                        {unsupported.length} left for the change list
                    </Badge>
                )}
            </div>

            {pendingShared && (
                <Alert variant="destructive">
                    <IconAlertTriangle className="size-4" />
                    <AlertTitle>These nodes are shared</AlertTitle>
                    <AlertDescription>
                        <div className="flex flex-col gap-2">
                            <span>
                                Writing here changes every config below, because they are the same
                                array in source — not copies.
                            </span>
                            <ul className="font-mono text-3xs">
                                {pendingShared.map((key) => (
                                    <li key={key}>{key}</li>
                                ))}
                            </ul>
                            <div>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    disabled={busy}
                                    onClick={() => run(true)}
                                >
                                    <IconArrowRight className="size-4" />
                                    Write to all {pendingShared.length}
                                </Button>
                            </div>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {result && !result.ok && !pendingShared && (
                <Alert variant="destructive">
                    <IconAlertTriangle className="size-4" />
                    <AlertTitle>Nothing was written</AlertTitle>
                    <AlertDescription>{result.error}</AlertDescription>
                </Alert>
            )}

            {result?.ok && (
                <div className="flex flex-col gap-2">
                    {result.backupFile && (
                        <p className="flex items-start gap-1 text-3xs text-muted-foreground">
                            <IconShieldCheck className="mt-px size-3 shrink-0 text-success" />
                            <span>
                                Backup of the previous file:{" "}
                                <code className="break-all">{result.backupFile}</code>
                            </span>
                        </p>
                    )}
                    <ul className="flex flex-col gap-1">
                        {result.outcomes.map((outcome, index) => (
                            <li
                                key={`${outcome.edit.nodePath}-${outcome.edit.property}-${index}`}
                                className="flex items-start gap-2 rounded border px-2 py-1 font-mono text-3xs"
                            >
                                <span
                                    className={
                                        outcome.status === "applied"
                                            ? "text-success"
                                            : "text-warning"
                                    }
                                >
                                    {outcome.status}
                                </span>
                                <span className="min-w-0 break-words">
                                    nodes[{outcome.edit.nodePath}].{outcome.edit.property}
                                    {outcome.reason && (
                                        <span className="text-muted-foreground"> — {outcome.reason}</span>
                                    )}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
