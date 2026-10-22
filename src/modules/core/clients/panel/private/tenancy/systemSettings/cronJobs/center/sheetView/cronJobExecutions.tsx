import {useCallback, useEffect, useState} from "react";
import {useSelector} from "react-redux";
import {ChevronDown, RefreshCw} from "lucide-react";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import {accessFieldPathExists} from "@coreModule/helpers/context/accessContext.tsx";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import {DATE_FORMATS, formatDate} from "@coreModule/helpers/general/dateTime.ts";
import {SheetGroup} from "@coreModule/components/viewEngine/widgets/layout/sheet/group.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import type {CronExecution} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.dto.ts";
import type {TableResponse} from "armonia/src/modules/core/types/shared.types.ts";
import {EXECUTION_STATUS_BADGE, formatDurationMs} from "../cronExecutionDisplay.ts";

const PAGE_SIZE = 10;

type CronJobExecutionsProps = {
    jobId: string;
    resolveLanguageKey: ResolveLanguageKey;
    /** Bump to reload from the newest run (e.g. after Run now). */
    refreshNonce?: number;
};

function fetchExecutions(jobId: string, offset: number) {
    return apiClient.post<TableResponse<CronExecution>>("/api/auxiliary/cron-jobs/executions", {offset, limit: PAGE_SIZE, jobId});
}

/** Run history of one job, newest first; a row opens to its error and log lines. */
export default function CronJobExecutions({jobId, resolveLanguageKey, refreshNonce = 0}: CronJobExecutionsProps) {
    const {read} = useAccess("cronexecutions");
    const canRead = accessFieldPathExists(read, "status");
    const canReadError = accessFieldPathExists(read, "error");
    const canReadLogs = accessFieldPathExists(read, "logs");
    const {timezone} = useSelector((state: RootState) => state.authentication.user);

    const [rows, setRows] = useState<CronExecution[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [reloadNonce, setReloadNonce] = useState(0);
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        if (!canRead) return;
        let cancelled = false;
        setLoading(true);
        fetchExecutions(jobId, 0)
            .then((res) => {
                if (cancelled) return;
                setRows(res.data.data);
                setTotal(res.data.total);
            })
            .catch(() => undefined)
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [canRead, jobId, refreshNonce, reloadNonce]);

    const loadMore = useCallback(() => {
        setLoading(true);
        fetchExecutions(jobId, rows.length)
            .then((res) => {
                setRows((prev) => [...prev, ...res.data.data]);
                setTotal(res.data.total);
            })
            .catch(() => undefined)
            .finally(() => setLoading(false));
    }, [jobId, rows.length]);

    if (!canRead) return null;

    const rk = (key: string) => String(resolveLanguageKey(`executions.${key}`));
    const at = (value: string) => formatDate(value, {timeZone: timezone, format: DATE_FORMATS.dateTime});

    return (
        <SheetGroup
            title="executions.title"
            resolveLanguageKey={resolveLanguageKey}
            collapseStorageKey="cronjobs:executions"
            titleActions={(
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setReloadNonce((n) => n + 1)}
                    disabled={loading}
                    aria-label={rk("refresh")}
                >
                    <RefreshCw className={cn("size-4", loading && "animate-spin")} />
                </Button>
            )}
        >
            <div className="flex flex-col gap-2">
                {rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{rk(loading ? "loading" : "empty")}</p>
                ) : (
                    <ul className="flex flex-col divide-y rounded-lg border">
                        {rows.map((row) => {
                            const error = canReadError ? row.error?.message : undefined;
                            const logs = canReadLogs ? row.logs ?? [] : [];
                            const hasDetails = !!error || logs.length > 0 || !!row.nextRetryAt;
                            const open = hasDetails && expanded === row._id;
                            return (
                                <li key={row._id}>
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm enabled:hover:bg-muted/50"
                                        disabled={!hasDetails}
                                        aria-expanded={hasDetails ? open : undefined}
                                        onClick={() => setExpanded(open ? null : row._id)}
                                    >
                                        <Badge variant="outline" className={cn("text-xs", EXECUTION_STATUS_BADGE[row.status])}>
                                            {rk(`statuses.${row.status}`)}
                                        </Badge>
                                        <span className="tabular-nums">{at(row.startedAt)}</span>
                                        {row.attempt > 1 ? (
                                            <span className="text-xs text-muted-foreground">
                                                {rk("attempt").replace("{attempt}", String(row.attempt))}
                                            </span>
                                        ) : null}
                                        <span className="ml-auto tabular-nums text-muted-foreground">
                                            {row.status === "running" ? "…" : formatDurationMs(row.durationMs)}
                                        </span>
                                        <ChevronDown
                                            className={cn("size-4 shrink-0 transition-transform", open && "rotate-180", !hasDetails && "invisible")}
                                            aria-hidden
                                        />
                                    </button>
                                    {open ? (
                                        <div className="flex flex-col gap-2 border-t bg-muted/30 px-3 py-2">
                                            {error ? <p className="text-sm text-destructive">{error}</p> : null}
                                            {row.nextRetryAt ? (
                                                <p className="text-xs text-muted-foreground">
                                                    {rk("nextRetryAt").replace("{at}", at(row.nextRetryAt))}
                                                </p>
                                            ) : null}
                                            {logs.length > 0 ? (
                                                <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-all rounded-md bg-background p-2 font-mono text-2xs">
                                                    {logs.join("\n")}
                                                </pre>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </li>
                            );
                        })}
                    </ul>
                )}
                {rows.length < total ? (
                    <Button type="button" variant="outline" size="sm" className="self-start" onClick={loadMore} disabled={loading}>
                        {rk("loadMore")}
                    </Button>
                ) : null}
            </div>
        </SheetGroup>
    );
}
