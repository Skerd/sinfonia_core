import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import EntityListPage from "@coreModule/components/entityPage/EntityListPage.tsx";
import {IconPlus} from "@tabler/icons-react";
import type {CronJob} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import CronJobCard from "./center/cardView/cronJobCard.tsx";

export function cronJobEditPath(job: Pick<CronJob, "_id" | "name">) {
    const params = new URLSearchParams();
    params.set("cronJobId", job._id);
    if (job.name) params.set("cronJobName", job.name);
    return `/tenancy/cronJobs/edit?${params.toString()}`;
}

function AllCronJobs({resolveLanguageKey}: WithLanguageType) {
    return (
        <EntityListPage<CronJob>
            apiUrl="/api/auxiliary/cron-jobs"
            collectionName="cronjobs"
            accessModel="cronJobs"
            tableConfigKey="cronjobs"
            createPath="/tenancy/cronJobs/create"
            createIcon={<IconPlus />}
            createLanguageKey="createCronJob"
            buildEditPath={cronJobEditPath}
            resolveLanguageKey={resolveLanguageKey}
            sheetLanguagePath="src/modules/core/clients/panel/private/tenancy/systemSettings/cronJobs/center/sheetView/cronJobSheetView.tsx"
            cardViewClassName="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3"
            renderCard={(job, onDelete, onRestore) => (
                <CronJobCard
                    job={job}
                    onDelete={(row, response?: DeletedData) => onDelete(row ?? job, response)}
                    onRestore={() => onRestore(job)}
                />
            )}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/cronJobs/index.tsx"),
    withDebug(true, true),
)(AllCronJobs);
