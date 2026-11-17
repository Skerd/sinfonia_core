import {compose} from "redux";
import {useEffect, useRef, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import type {CronJob} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.dto.ts";
import {cronJobEditPath} from "../../cronJobPaths.ts";
import RunCronJob from "../actions/run.tsx";
import PauseCronJob from "../actions/pause.tsx";
import ResumeCronJob from "../actions/resume.tsx";
import CronJobActionDialogs from "../actions/cronJobActionDialogs.tsx";
import {CronJobRunsRefresh} from "./cronJobRunsRefresh.ts";

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

    useEffect(() => () => clearTimeout(pickupTimer.current), []);

    useEffect(() => {
        if (!open) setAction("");
    }, [open]);

    useEffect(() => {
        if (!cronJobProp) return;
        setSheetData(cronJobProp);
    }, [cronJobProp]);

    const entityId = cronJobProp?._id ?? fetchId;

    // Run now only makes the job due; once the scheduler has run it, its row has the new Last run and the next slot.
    // Reload the row with the run history, or the sheet keeps "Next run" at the moment Run now was pressed (TD-B239).
    const {data: reloadedJob} = useHttpRequest<CronJob>(
        {method: "post", url: "/api/auxiliary/cron-jobs/single", data: {_id: entityId}},
        {},
        executionsNonce,
    );
    useEffect(() => {
        if (!reloadedJob) return;
        setSheetData(reloadedJob);
        onSheetRowPatched?.(reloadedJob);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reloadedJob]);
    const asJob = sheetData as CronJob;

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
        // The view places the run history above Lifecycle (`#CronJobRuns`); Run now reloads it through this context.
        <CronJobRunsRefresh.Provider value={executionsNonce}>
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
            />
            <CronJobActionDialogs
                action={action}
                job={asJob}
                onClose={() => setAction("")}
                onSuccess={handleWorkflowSuccess}
            />
        </CronJobRunsRefresh.Provider>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/cronJobs/center/sheetView/cronJobSheetView.tsx"),
    withDebug(true, true, "cronjobs")
)(CronJobSheetView);
