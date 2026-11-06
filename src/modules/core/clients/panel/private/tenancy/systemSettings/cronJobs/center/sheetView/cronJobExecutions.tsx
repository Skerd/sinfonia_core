import {IconChevronDown, IconRefresh} from "@tabler/icons-react";
import {useMemo, useState} from "react";
import {useSelector} from "react-redux";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import {accessFieldPathExists} from "@coreModule/helpers/context/accessContext.tsx";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
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

const EXECUTIONS_REQUEST = {method: "post" as const, url: "/api/auxiliary/cron-jobs/executions", data: {}};

/** Run history of one job, newest first; a row opens to its error and log lines. */
export default function CronJobExecutions({jobId, resolveLanguageKey, refreshNonce = 0}: CronJobExecutionsProps) {
    const {read} = useAccess("cronexecutions");
    const canRead = accessFieldPathExists(read, "status");
    const canReadError = accessFieldPathExists(read, "error");
    const canReadLogs = accessFieldPathExists(read, "logs");
    const {timezone} = useSelector((state: RootState) => state.authentication.user);

    const [rows, setRows] = useState<CronExecution[]>([]);
    const [total, setTotal] = useState(0);
    const [reloadNonce, setReloadNonce] = useState(0);
    const [expanded, setExpanded] = useState<string | null>(null);

    // The newest page again whenever the job, a refresh or access changes; `loadMore` appends the next one.
    const listKey = canRead ? `${jobId}|${refreshNonce}|${reloadNonce}` : "";
    const [request, setRequest] = useState({listKey, offset: 0, count: listKey ? 1 : 0});
    if (request.listKey !== listKey) {
        setRequest({listKey, offset: 0, count: listKey ? request.count + 1 : request.count});
    }
    const body = useMemo(() => ({offset: request.offset, limit: PAGE_SIZE, jobId}), [request.offset, jobId]);
    // Silent: a failed load keeps what is on screen.
    const {loading} = useHttpRequest<TableResponse<CronExecution>>(EXECUTIONS_REQUEST, body, request.count, true, {
        success: (data) => {
            setRows((prev) => (request.offset === 0 ? data.data : [...prev, ...data.data]));
            setTotal(data.total);
        },
    });

    const loadMore = () => setRequest((current) => ({...current, offset: rows.length, count: current.count + 1}));

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
                    <IconRefresh className={cn("size-4", loading && "animate-spin")} />
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
                                    <Button variant="bare"
                                        type="button"
                                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm enabled:hover:bg-muted/50 disabled:pointer-events-auto disabled:opacity-100"
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
                                        <IconChevronDown
                                            className={cn("size-4 shrink-0 transition-transform", open && "rotate-180", !hasDetails && "invisible")}
                                            aria-hidden
                                        />
                                    </Button>
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
