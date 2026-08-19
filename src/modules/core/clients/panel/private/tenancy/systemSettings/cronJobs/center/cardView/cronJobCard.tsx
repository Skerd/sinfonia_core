import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import type {CronJob} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import {cronJobEditPath} from "../../index.tsx";
import DisplayRow from "@coreModule/components/custom/displayValue/displayRow.tsx";
import {Clock, Code, Cog, Power} from "lucide-react";
import CronJobSheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/cronJobs/center/sheetView/cronJobSheetView.tsx";
import EntityCard from "@coreModule/components/custom/systemCards/entityCard.tsx";

type Props = WithLanguageType & {
    job: CronJob;
    onDelete: (row: CronJob, response?: DeletedData) => void;
    onRestore: () => void;
};

function CronJobCard({job, resolveLanguageKey, onDelete, onRestore}: Props) {
    return (
        <EntityCard
            resource="cronJobs"
            entity={job}
            onDelete={onDelete}
            
            onRestore={onRestore}
            editPath={cronJobEditPath}
            Sheet={CronJobSheetView}
            sheetEntityProp="cronJob"
            deleteUrl="/api/auxiliary/cron-jobs"
            restoreUrl="/api/auxiliary/cron-jobs/restore"
            failedTitle=""
            failedDescription=""
            titlePath="name"
        >
            {({entity}) => (
                <>
                    <EntityCard.Header
                        titlePath="name"
                        title={entity.name}
                        subtitle={entity.code}
                        subtitlePath="code"
                    />
                    <EntityCard.Body>
                        <DisplayRow
                            icon={Cog}
                            label={resolveLanguageKey("handler")}
                            tooltip={resolveLanguageKey("handler")}
                            path="handler"
                            value={entity.handler}
                        />
                        <DisplayRow
                            icon={Clock}
                            label={resolveLanguageKey("nextRunAt")}
                            tooltip={resolveLanguageKey("nextRunAt")}
                            path="nextRunAt"
                            type="dateTime"
                            value={entity.nextRunAt}
                        />
                        <DisplayRow
                            icon={Power}
                            label={resolveLanguageKey("active")}
                            tooltip={resolveLanguageKey("active")}
                            path="active"
                            type="boolean"
                            value={entity.active && !entity.pausedAt}
                        />
                        <DisplayRow
                            icon={Code}
                            label={resolveLanguageKey("code")}
                            tooltip={resolveLanguageKey("code")}
                            path="code"
                            value={entity.code}
                        />
                    </EntityCard.Body>
                </>
            )}
        </EntityCard>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/cronJobs/center/cardView/cronJobCard.tsx"),
    withDebug(true, true, "cronJobs"),
)(CronJobCard);
