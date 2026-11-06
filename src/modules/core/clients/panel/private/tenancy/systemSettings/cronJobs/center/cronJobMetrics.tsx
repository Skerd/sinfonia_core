import {IconActivity, IconCircleCheck, IconGauge, IconPlayerPlay, IconCircleX} from "@tabler/icons-react";
import {useEffect, useState} from "react";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {KpiCard} from "@coreModule/components/custom/kpiCard.tsx";
import {Skeleton} from "@coreModule/components/ui/skeleton.tsx";
import type {CronJobMetrics as Metrics} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.dto.ts";
import {formatDurationMs} from "./cronExecutionDisplay.ts";

/** Runs start and finish without the page knowing, so the tiles refresh on their own. */
const REFRESH_MS = 30_000;
const METRICS_REQUEST = {method: "post" as const, url: "/api/auxiliary/cron-jobs/metrics", data: {}};
const GRID_CLASS = "grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5";

type CronJobMetricsProps = {
    resolveLanguageKey: ResolveLanguageKey;
};

/** The company's scheduled actions at a glance: how many run, and how the last 24 hours went. */
export default function CronJobMetrics({resolveLanguageKey}: CronJobMetricsProps) {
    const [refreshCount, setRefreshCount] = useState(1);
    // A failed refresh keeps the last figures on screen: the hook only replaces data on success.
    const {data: metrics, error} = useHttpRequest<Metrics>(METRICS_REQUEST, {}, refreshCount);
    const failed = !!error;

    useEffect(() => {
        const timer = setInterval(() => setRefreshCount((count) => count + 1), REFRESH_MS);
        return () => clearInterval(timer);
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
                icon={IconPlayerPlay}
                title={rk("active")}
                value={metrics.activeJobs}
                subtitle={rk("pausedCount").replace("{count}", String(metrics.pausedJobs))}
            />
            <KpiCard
                compact
                icon={IconActivity}
                variant={metrics.runningExecutions > 0 ? "primary" : "default"}
                title={rk("running")}
                value={metrics.runningExecutions}
            />
            <KpiCard
                compact
                icon={IconCircleCheck}
                variant="success"
                title={rk("succeeded24h")}
                value={metrics.successLast24h}
            />
            <KpiCard
                compact
                icon={IconCircleX}
                variant={metrics.failedLast24h > 0 ? "danger" : "default"}
                title={rk("failed24h")}
                value={metrics.failedLast24h}
            />
            <KpiCard
                compact
                icon={IconGauge}
                title={rk("avgDuration24h")}
                value={formatDurationMs(metrics.successLast24h > 0 ? metrics.avgDurationMsLast24h : undefined)}
            />
        </div>
    );
}
