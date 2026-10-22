import {compose} from "redux";
import {useEffect, useRef, useState} from "react";
import {useSelector} from "react-redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import {accessFieldPathExists} from "@coreModule/helpers/context/accessContext.tsx";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {DATE_FORMATS, formatDate} from "@coreModule/helpers/general/dateTime.ts";
import {SheetGroup} from "@coreModule/components/viewEngine/widgets/layout/sheet/group.tsx";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import type {CronJob} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.dto.ts";
import {cronJobEditPath} from "../../cronJobPaths.ts";
import RunCronJob from "../actions/run.tsx";
import PauseCronJob from "../actions/pause.tsx";
import ResumeCronJob from "../actions/resume.tsx";
import CronJobActionDialogs from "../actions/cronJobActionDialogs.tsx";
import CronJobExecutions from "./cronJobExecutions.tsx";

/** Run now only makes the job due; the scheduler picks it up within a tick or two. */
const RUN_PICKUP_DELAY_MS = 2_500;

export type CronJobSheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cronJob?: CronJob;
    hideActions?: boolean;
    onDelete?: (response?: DeletedData) => void;
    onRestore?: () => void;
    onModifySuccess?: (updated?: CronJob) => void;
    onSheetRowPatched?: (row: Record<string, unknown>) => void;
    fetchId?: string;
};

function CronJobSheetView({
    open,
    onOpenChange,
    cronJob: cronJobProp,
    resolveLanguageKey,
    hideActions = false,
    onDelete = () => {},
    onRestore = () => {},
    onModifySuccess,
    onSheetRowPatched,
    fetchId,
}: CronJobSheetViewOwnProps & WithLanguageType) {
    const access = useAccess("cronjobs");
    const viewConfig = useViewConfig("cronjobs", "sheet");
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(cronJobProp || {_id: fetchId});
    const [action, setAction] = useState("");
    const [executionsNonce, setExecutionsNonce] = useState(0);
    const pickupTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const {timezone} = useSelector((state: RootState) => state.authentication.user);

    useEffect(() => () => clearTimeout(pickupTimer.current), []);

    useEffect(() => {
        if (!open) setAction("");
    }, [open]);

    useEffect(() => {
        if (!cronJobProp) return;
        setSheetData(cronJobProp);
    }, [cronJobProp]);

    const entityId = cronJobProp?._id ?? fetchId;
    const asJob = sheetData as CronJob;
    // A paused job has no upcoming runs, whatever its expression says.
    const showNextRuns = accessFieldPathExists(access.read, "cronExpression")
        && asJob.active && !asJob.pausedAt && !!asJob.nextRunsPreview?.length;

    if (!viewConfig) {
        return null;
    }
    if (!entityId) {
        return null;
    }

    const handleWorkflowSuccess = (updated: CronJob) => {
        if (action === "run") {
            clearTimeout(pickupTimer.current);
            pickupTimer.current = setTimeout(() => setExecutionsNonce((n) => n + 1), RUN_PICKUP_DELAY_MS);
        }
        setSheetData(updated);
        onModifySuccess?.(updated);
        onSheetRowPatched?.(updated);
        setAction("");
    };

    return (
        <>
            <SheetViewRenderer
                config={viewConfig}
                data={sheetData}
                url="/api/auxiliary/cron-jobs/single"
                fetchId={fetchId}
                onDataFetched={(data) => setSheetData(data)}
                open={open}
                onOpenChange={onOpenChange}
                resolveLanguageKey={resolveLanguageKey}
                access={access}
                hideActions={hideActions}
                hideDelete
                hideRestore
                onDelete={onDelete}
                onRestore={onRestore}
                editPath={cronJobEditPath(asJob)}
                actionMenuAllowCustomChildren
                onSheetRowPatched={(row) => {
                    setSheetData(row);
                    onSheetRowPatched?.(row);
                }}
                actionMenuChildren={
                    <>
                        <RunCronJob job={asJob} onAction={setAction} />
                        <PauseCronJob job={asJob} onAction={setAction} />
                        <ResumeCronJob job={asJob} onAction={setAction} />
                    </>
                }
            >
                {showNextRuns ? (
                    <SheetGroup title="nextRuns" resolveLanguageKey={resolveLanguageKey} collapseStorageKey="cronjobs:nextRuns">
                        <ol className="flex flex-col gap-1 text-sm tabular-nums">
                            {asJob.nextRunsPreview?.map((run) => (
                                <li key={run}>{formatDate(run, {timeZone: timezone, format: DATE_FORMATS.dateTime})}</li>
                            ))}
                        </ol>
                    </SheetGroup>
                ) : null}
                <CronJobExecutions jobId={entityId} resolveLanguageKey={resolveLanguageKey} refreshNonce={executionsNonce} />
            </SheetViewRenderer>
            <CronJobActionDialogs
                action={action}
                job={asJob}
                onClose={() => setAction("")}
                onSuccess={handleWorkflowSuccess}
            />
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/cronJobs/center/sheetView/cronJobSheetView.tsx"),
    withDebug(true, true, "cronjobs")
)(CronJobSheetView);
