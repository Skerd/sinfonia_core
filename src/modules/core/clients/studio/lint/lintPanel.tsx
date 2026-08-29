import {useMemo, useState} from "react";
import {
    IconAlertTriangle,
    IconChevronDown,
    IconChevronUp,
    IconCircleCheck,
    IconCircleX,
} from "@tabler/icons-react";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {countBySeverity, type LintFinding} from "./viewLint.ts";

type LintPanelProps = {
    findings: LintFinding[];
    /** Selects the offending node in the tree. */
    onSelectPath: (path: string) => void;
    selectedPath: string | null;
};

export default function LintPanel({findings, onSelectPath, selectedPath}: LintPanelProps) {
    const {errors, warnings} = useMemo(() => countBySeverity(findings), [findings]);
    /*
     * Open by default when something is actually wrong, and respect an explicit choice
     * afterwards. The previous rule also required `findings.length <= 12`, which collapsed
     * the panel precisely when a config had the most wrong with it.
     */
    const [choice, setChoice] = useState<boolean | null>(null);
    const expanded = choice ?? errors > 0;

    return (
        <div className="shrink-0 border-t">
            <button
                type="button"
                onClick={() => setChoice(!expanded)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-muted/60"
            >
                {findings.length === 0 ? (
                    <IconCircleCheck className="size-3.5 shrink-0 text-success" />
                ) : (
                    <IconAlertTriangle
                        className={cn(
                            "size-3.5 shrink-0",
                            errors > 0 ? "text-destructive" : "text-warning",
                        )}
                    />
                )}
                <span className="text-3xs font-medium uppercase tracking-wide text-muted-foreground">
                    Checks
                </span>
                {findings.length === 0 ? (
                    <span className="text-3xs text-muted-foreground">
                        Nothing inert or unresolvable in this config.
                    </span>
                ) : (
                    <>
                        {errors > 0 && (
                            <Badge variant="destructive" className="tabular-nums">
                                {errors} error{errors === 1 ? "" : "s"}
                            </Badge>
                        )}
                        {warnings > 0 && (
                            <Badge variant="secondary" className="tabular-nums">
                                {warnings} warning{warnings === 1 ? "" : "s"}
                            </Badge>
                        )}
                    </>
                )}
                <span className="ml-auto text-muted-foreground">
                    {expanded ? (
                        <IconChevronDown className="size-3.5" />
                    ) : (
                        <IconChevronUp className="size-3.5" />
                    )}
                </span>
            </button>

            {expanded && findings.length > 0 && (
                <ul className="max-h-48 overflow-y-auto border-t">
                    {findings.map((finding, index) => (
                        <li key={`${finding.rule}-${finding.path}-${index}`}>
                            <Button
                                type="button"
                                variant="ghost"
                                className={cn(
                                    "h-auto w-full justify-start gap-2 rounded-none px-3 py-1.5 text-left",
                                    selectedPath === finding.path && "bg-primary/10",
                                )}
                                onClick={() => onSelectPath(finding.path)}
                            >
                                {finding.severity === "error" ? (
                                    <IconCircleX className="mt-px size-3.5 shrink-0 text-destructive" />
                                ) : (
                                    <IconAlertTriangle className="mt-px size-3.5 shrink-0 text-warning" />
                                )}
                                <span className="min-w-0 flex-1 whitespace-normal">
                                    <span className="font-mono text-3xs text-muted-foreground">
                                        nodes[{finding.path}] {finding.label}
                                    </span>
                                    <span className="block text-2xs">{finding.message}</span>
                                </span>
                                <Badge variant="outline" className="shrink-0 font-mono text-3xs">
                                    {finding.rule}
                                </Badge>
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
