import {useEffect, useState} from "react";
import {Activity, CheckCircle2, Gauge, PlayCircle, XCircle} from "lucide-react";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import {KpiCard} from "@coreModule/components/custom/kpiCard.tsx";
import {Skeleton} from "@coreModule/components/ui/skeleton.tsx";
import type {CronJobMetrics as Metrics} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.dto.ts";
import {formatDurationMs} from "./cronExecutionDisplay.ts";

/** Runs start and finish without the page knowing, so the tiles refresh on their own. */
const REFRESH_MS = 30_000;
const GRID_CLASS = "grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5";

type CronJobMetricsProps = {
    resolveLanguageKey: ResolveLanguageKey;
};

/** The company's scheduled actions at a glance: how many run, and how the last 24 hours went. */
export default function CronJobMetrics({resolveLanguageKey}: CronJobMetricsProps) {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const load = () => {
            apiClient.post<Metrics>("/api/auxiliary/cron-jobs/metrics", {})
                .then((res) => {
                    if (cancelled) return;
                    setMetrics(res.data);
                    setFailed(false);
                })
                // A failed refresh keeps the last figures on screen.
                .catch(() => {
                    if (!cancelled) setFailed(true);
                });
        };
        load();
        const timer = setInterval(load, REFRESH_MS);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, []);

    const rk = (key: string) => String(resolveLanguageKey(`metrics.${key}`));

    if (!metrics) {
        return failed ? null : (
            <div className={GRID_CLASS}>
                {Array.from({length: 5}, (_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
        );
    }

    return (
        <div className={GRID_CLASS}>
            <KpiCard
                compact
                icon={PlayCircle}
                title={rk("active")}
                value={metrics.activeJobs}
                subtitle={rk("pausedCount").replace("{count}", String(metrics.pausedJobs))}
            />
            <KpiCard
                compact
                icon={Activity}
                variant={metrics.runningExecutions > 0 ? "primary" : "default"}
                title={rk("running")}
                value={metrics.runningExecutions}
            />
            <KpiCard
                compact
                icon={CheckCircle2}
                variant="success"
                title={rk("succeeded24h")}
                value={metrics.successLast24h}
            />
            <KpiCard
                compact
                icon={XCircle}
                variant={metrics.failedLast24h > 0 ? "danger" : "default"}
                title={rk("failed24h")}
                value={metrics.failedLast24h}
            />
            <KpiCard
                compact
                icon={Gauge}
                title={rk("avgDuration24h")}
                value={formatDurationMs(metrics.successLast24h > 0 ? metrics.avgDurationMsLast24h : undefined)}
            />
        </div>
    );
}
