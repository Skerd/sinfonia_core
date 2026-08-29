import {useMemo, useState} from "react";
import {IconEyeOff, IconUserShield} from "@tabler/icons-react";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Switch} from "@coreModule/components/ui/switch.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {Checkbox} from "@coreModule/components/ui/checkbox.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import type {SimulationState} from "./simulationState.ts";

type AccessSimulatorProps = {
    readPaths: string[];
    writePaths: string[];
    /** Only edit forms consult the write allowlist, so only they show that column. */
    showWrite: boolean;
    state: SimulationState;
    onChange: (next: SimulationState) => void;
    /** Reported back from the mirror, so the effect is visible without hunting for it. */
    summary: {pruned: number; disabled: number; wouldBeDropped: boolean} | null;
};

function toggle(set: ReadonlySet<string>, path: string): Set<string> {
    const next = new Set(set);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    return next;
}

/**
 * Revokes access paths and re-runs maestro's prune against the result.
 *
 * Revocation rather than selection is deliberate: the served config has already been
 * filtered for the signed-in account, so the honest operation is "take something away
 * from what I can see" — the Studio cannot conjure back a node the server already
 * removed, and a checklist that started empty would imply it could.
 */
export default function AccessSimulator({
    readPaths,
    writePaths,
    showWrite,
    state,
    onChange,
    summary,
}: AccessSimulatorProps) {
    const [query, setQuery] = useState("");

    const paths = useMemo(() => {
        const needle = query.trim().toLowerCase();
        const all = showWrite ? [...new Set([...readPaths, ...writePaths])] : readPaths;
        return all.filter((path) => !needle || path.toLowerCase().includes(needle)).sort();
    }, [query, readPaths, writePaths, showWrite]);

    const revokedCount = state.revokedRead.size + state.revokedWrite.size;

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex shrink-0 items-center gap-2 border-b px-2 py-1">
                <IconUserShield className="size-3.5 shrink-0 text-muted-foreground" />
                <Label htmlFor="simulate-on" className="text-3xs text-muted-foreground">
                    Simulate a narrower account
                </Label>
                <Switch
                    id="simulate-on"
                    className="ml-auto"
                    checked={state.enabled}
                    onCheckedChange={(enabled) => onChange({...state, enabled})}
                />
            </div>

            {state.enabled && (
                <>
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b px-2 py-1">
                        {summary && (
                            <>
                                <Badge variant="secondary" className="tabular-nums">
                                    {summary.pruned} pruned
                                </Badge>
                                {summary.disabled > 0 && (
                                    <Badge variant="outline" className="tabular-nums">
                                        {summary.disabled} disabled
                                    </Badge>
                                )}
                                {summary.wouldBeDropped && (
                                    <Badge variant="destructive">view dropped entirely</Badge>
                                )}
                            </>
                        )}
                        {revokedCount > 0 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="ml-auto h-6 text-3xs"
                                onClick={() =>
                                    onChange({
                                        ...state,
                                        revokedRead: new Set(),
                                        revokedWrite: new Set(),
                                    })
                                }
                            >
                                Restore all
                            </Button>
                        )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2 border-b px-2">
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Filter paths"
                            className="h-7 border-0 bg-transparent px-0 text-2xs shadow-none focus-visible:ring-0"
                        />
                        <span className="shrink-0 text-3xs text-muted-foreground">
                            {showWrite ? "read / write" : "read"}
                        </span>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto">
                        {paths.length === 0 ? (
                            <p className="px-2 py-6 text-center text-3xs text-muted-foreground">
                                No access paths loaded for this model.
                            </p>
                        ) : (
                            <ul className="flex flex-col">
                                {paths.map((path) => {
                                    const readRevoked = state.revokedRead.has(path);
                                    const writeRevoked = state.revokedWrite.has(path);
                                    return (
                                        <li
                                            key={path}
                                            className="flex items-center gap-2 px-2 py-0.5 hover:bg-muted/60"
                                        >
                                            <span
                                                className={cn(
                                                    "min-w-0 flex-1 truncate font-mono text-3xs",
                                                    (readRevoked || writeRevoked) &&
                                                        "text-muted-foreground line-through",
                                                )}
                                            >
                                                {path}
                                            </span>
                                            {readPaths.includes(path) && (
                                                <Checkbox
                                                    aria-label={`Revoke read on ${path}`}
                                                    checked={!readRevoked}
                                                    onCheckedChange={() =>
                                                        onChange({
                                                            ...state,
                                                            revokedRead: toggle(
                                                                state.revokedRead,
                                                                path,
                                                            ),
                                                        })
                                                    }
                                                />
                                            )}
                                            {showWrite && writePaths.includes(path) && (
                                                <Checkbox
                                                    aria-label={`Revoke write on ${path}`}
                                                    className="border-warning data-[state=checked]:bg-warning"
                                                    checked={!writeRevoked}
                                                    onCheckedChange={() =>
                                                        onChange({
                                                            ...state,
                                                            revokedWrite: toggle(
                                                                state.revokedWrite,
                                                                path,
                                                            ),
                                                        })
                                                    }
                                                />
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </>
            )}

            {!state.enabled && (
                <p className="flex items-start gap-1 px-2 py-3 text-3xs text-muted-foreground">
                    <IconEyeOff className="mt-px size-3 shrink-0" />
                    <span>
                        Turn this on to revoke paths and watch the preview prune exactly as maestro
                        would. It can only narrow what you already see — nodes the server pruned for
                        this account never reached the Studio.
                    </span>
                </p>
            )}
        </div>
    );
}
