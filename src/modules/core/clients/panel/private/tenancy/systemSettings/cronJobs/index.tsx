import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import EntityListPage from "@coreModule/components/entityPage/EntityListPage.tsx";
import type {CronJob} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import CronJobCard from "./center/cardView/cronJobCard.tsx";
import CronJobSheetView from "./center/sheetView/cronJobSheetView.tsx";
import RunCronJob from "./center/actions/run.tsx";
import PauseCronJob from "./center/actions/pause.tsx";
import ResumeCronJob from "./center/actions/resume.tsx";
import CronJobActionDialogs from "./center/actions/cronJobActionDialogs.tsx";
import {cronJobEditPath} from "./cronJobPaths.ts";

function AllCronJobs({resolveLanguageKey}: WithLanguageType) {
    return (
        <EntityListPage<CronJob>
            apiUrl="/api/auxiliary/cron-jobs"
            collectionName="cronjobs"
            accessModel="cronjobs"
            tableConfigKey="cronjobs"
            hideCreate
            buildEditPath={cronJobEditPath}
            resolveLanguageKey={resolveLanguageKey}
            renderSheet={({entity, open, onOpenChange, onDelete, onRestore, listRef}) => (
                <CronJobSheetView
                    open={open}
                    onOpenChange={onOpenChange}
                    cronJob={entity}
                    onDelete={onDelete}
                    onRestore={onRestore}
                    onModifySuccess={(updated?: CronJob) => updated && listRef.current?.updateRow?.(entity._id, updated)}
                    onSheetRowPatched={(row: Record<string, unknown>) => listRef.current?.updateRow?.(entity._id, row as CronJob)}
                />
            )}
            rowActionMenu={{
                hideDelete: true,
                hideRestore: true,
                allowMenuForCustomChildren: true,
            }}
            renderCard={(job, onDelete, onRestore, listRef) => (
                <CronJobCard
                    job={job}
                    onDelete={(row: CronJob, response?: DeletedData) => onDelete(row ?? job, response)}
                    onRestore={() => onRestore(job)}
                    onModifySuccess={(updated?: CronJob) => updated && listRef.current?.updateRow?.(job._id, updated)}
                />
            )}
            renderActionMenuChildren={(job, bindRowAction) => (
                <>
                    <RunCronJob job={job} onAction={bindRowAction} />
                    <PauseCronJob job={job} onAction={bindRowAction} />
                    <ResumeCronJob job={job} onAction={bindRowAction} />
                </>
            )}
            renderFloatingModals={({action, entity, resetAction, listRef}) => (
                <CronJobActionDialogs
                    action={action}
                    job={entity}
                    onClose={resetAction}
                    onSuccess={(updated: CronJob) => {
                        listRef.current?.updateRow?.(entity._id, updated);
                        resetAction();
                    }}
                />
            )}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/cronJobs/index.tsx"),
    withDebug(true, true, "cronjobs"),
)(AllCronJobs);
