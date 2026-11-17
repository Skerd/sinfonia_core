import {useContext} from "react";
import {useSelector} from "react-redux";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import {accessFieldPathExists} from "@coreModule/helpers/context/accessContext.tsx";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {DATE_FORMATS, formatDate} from "@coreModule/helpers/general/dateTime.ts";
import {SheetGroup} from "@coreModule/components/viewEngine/widgets/layout/sheet/group.tsx";
import type {CronJob} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.dto.ts";
import CronJobExecutions from "./cronJobExecutions.tsx";
import {CronJobRunsRefresh} from "./cronJobRunsRefresh.ts";

type CronJobRunsProps = {
    job: CronJob;
    /** The scheduled-action sheet's dictionary, which holds the run labels. */
    resolveLanguageKey: ResolveLanguageKey;
};

/** The job's next runs and its run history, placed by the sheet view above Lifecycle (`#CronJobRuns`, UX-03, TD-F67). */
export default function CronJobRuns({job, resolveLanguageKey}: CronJobRunsProps) {
    const access = useAccess("cronjobs");
    const refreshNonce = useContext(CronJobRunsRefresh);
    const {timezone} = useSelector((state: RootState) => state.authentication.user);
    // A paused job has no upcoming runs, whatever its expression says.
    const showNextRuns = accessFieldPathExists(access.read, "cronExpression")
        && job.active && !job.pausedAt && !!job.nextRunsPreview?.length;

    return (
        <>
            {showNextRuns ? (
                <SheetGroup title="nextRuns" resolveLanguageKey={resolveLanguageKey} collapseStorageKey="cronjobs:nextRuns">
                    <ol className="flex flex-col gap-1 text-sm tabular-nums">
                        {job.nextRunsPreview?.map((run) => (
                            <li key={run}>{formatDate(run, {timeZone: timezone, format: DATE_FORMATS.mediumDateTime})}</li>
                        ))}
                    </ol>
                </SheetGroup>
            ) : null}
            <CronJobExecutions jobId={job._id} resolveLanguageKey={resolveLanguageKey} refreshNonce={refreshNonce} />
        </>
    );
}
