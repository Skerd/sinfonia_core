import {compose} from "redux";
import withLanguage, {type ResolveLanguageKey, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import type {CronJob} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import {cronJobEditPath} from "../../cronJobPaths.ts";
import DisplayRow from "@coreModule/components/custom/displayValue/displayRow.tsx";
import DisplayValue from "@coreModule/components/custom/displayValue/displayValue.tsx";
import CopyTooltip from "@coreModule/components/custom/copyTooltip.tsx";
import {IconCalendarClock, IconClock, IconCode, IconHistory} from "@tabler/icons-react";
import CronJobSheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/cronJobs/center/sheetView/cronJobSheetView.tsx";
import EntityCard from "@coreModule/components/custom/systemCards/entityCard.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Separator} from "@coreModule/components/ui/separator.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {
    CARD_INFO_ROWS_TWO_COL_CLASS,
    STATUS_BADGE_SUCCESS,
    STATUS_BADGE_WARNING,
} from "@coreModule/components/custom/cards/entityCard.constants.ts";
import RunCronJob from "../actions/run.tsx";
import PauseCronJob from "../actions/pause.tsx";
import ResumeCronJob from "../actions/resume.tsx";
import CronJobActionDialogs from "../actions/cronJobActionDialogs.tsx";
import type {ReactNode} from "react";

type Props = WithLanguageType & {
    job: CronJob;
    onDelete: (row: CronJob, response?: DeletedData) => void;
    onRestore: () => void;
    onModifySuccess?: (updated?: CronJob) => void;
};

function isPaused(job: CronJob): boolean {
    return !job.active || job.pausedAt != null;
}

function CronJobCardBadges({
    entity,
    resolveLanguageKey,
}: {
    entity: CronJob;
    resolveLanguageKey: ResolveLanguageKey;
}): ReactNode {
    const paused = isPaused(entity);
    return (
        <DisplayValue path="active" value={entity.active}>
            {() => (
                <Badge
                    variant="outline"
                    className={cn("text-xs", paused ? STATUS_BADGE_WARNING : STATUS_BADGE_SUCCESS)}
                >
                    {String(resolveLanguageKey(paused ? "paused" : "active"))}
                </Badge>
            )}
        </DisplayValue>
    );
}

function CronJobCard({job, resolveLanguageKey, onDelete, onRestore, onModifySuccess}: Props) {
    return (
        <EntityCard
            resource="cronjobs"
            entity={job}
            onDelete={onDelete}
            onRestore={onRestore}
            hideDelete
            hideRestore
            editPath={cronJobEditPath}
            Sheet={CronJobSheetView}
            sheetEntityProp="cronJob"
            deleteUrl="/api/auxiliary/cron-jobs"
            restoreUrl="/api/auxiliary/cron-jobs/restore"
            failedTitle={String(resolveLanguageKey("failedTitle"))}
            failedDescription={String(resolveLanguageKey("failedDescription"))}
            titlePath="name"
            sheetProps={({setEntity}) => ({
                onModifySuccess: (updated?: CronJob) => {
                    if (updated) setEntity(updated);
                    onModifySuccess?.(updated);
                },
            })}
            extraDialogs={({action, setAction, entity, setEntity}) => (
                <CronJobActionDialogs
                    action={action}
                    job={entity}
                    onClose={() => setAction("")}
                    onSuccess={(updated) => {
                        setEntity(updated);
                        onModifySuccess?.(updated);
                        setAction("");
                    }}
                />
            )}
        >
            {({entity, setAction}) => (
                <>
                    <EntityCard.Header
                        titlePath="name"
                        title={
                            <span className="flex items-center gap-1 truncate">
                                {entity.name}
                                <CopyTooltip text={entity.name} />
                            </span>
                        }
                        badges={<CronJobCardBadges entity={entity} resolveLanguageKey={resolveLanguageKey} />}
                    >
                        <RunCronJob job={entity} onAction={setAction} />
                        <PauseCronJob job={entity} onAction={setAction} />
                        <ResumeCronJob job={entity} onAction={setAction} />
                    </EntityCard.Header>
                    <Separator className="-mx-(--density-pad) w-auto self-stretch" />
                    <EntityCard.Body className={CARD_INFO_ROWS_TWO_COL_CLASS}>
                        <DisplayRow
                            icon={IconCode}
                            label={resolveLanguageKey("handler")}
                            tooltip={resolveLanguageKey("handler")}
                            path="handler"
                            value={entity.handler}
                        />
                        <DisplayRow
                            icon={IconClock}
                            label={resolveLanguageKey("cronExpression")}
                            tooltip={resolveLanguageKey("cronExpression")}
                            path="cronExpression"
                            value={entity.cronExpression}
                        />
                        <DisplayRow
                            icon={IconCalendarClock}
                            label={resolveLanguageKey("nextRunAt")}
                            tooltip={resolveLanguageKey("nextRunAt")}
                            path="nextRunAt"
                            type="dateTime"
                            value={entity.nextRunAt}
                        />
                        <DisplayRow
                            icon={IconHistory}
                            label={resolveLanguageKey("lastRunAt")}
                            tooltip={resolveLanguageKey("lastRunAt")}
                            path="lastRunAt"
                            type="dateTime"
                            value={entity.lastRunAt}
                        />
                    </EntityCard.Body>
                </>
            )}
        </EntityCard>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/cronJobs/center/cardView/cronJobCard.tsx"),
    withDebug(true, true, "cronjobs"),
)(CronJobCard);
