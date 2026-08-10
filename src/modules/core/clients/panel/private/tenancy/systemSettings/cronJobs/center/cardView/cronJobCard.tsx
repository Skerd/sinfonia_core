import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import type {CronJob} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import {cronJobEditPath} from "../../index.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import InfoRow from "@coreModule/components/custom/infoRow.tsx";
import {InfoRowGroup} from "@coreModule/components/custom/infoRowGroup.tsx";
import {Clock, Code, Cog, Power} from "lucide-react";
import DeleteAction from "@coreModule/components/custom/actions/deleteAction.tsx";
import RestoreAction from "@coreModule/components/custom/actions/restoreAction.tsx";
import ActionMenu from "@coreModule/components/custom/actions/menu/actionMenu.tsx";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import {useEntityCard} from "@coreModule/helpers/hooks/useEntityCard.ts";
import {EntityCardShell} from "@coreModule/components/custom/cards/EntityCardShell.tsx";
import {EntityTextCardHeader} from "@coreModule/components/custom/cards/EntityTextCardHeader.tsx";
import {CARD_BODY_CLASS} from "@coreModule/components/custom/cards/entityCard.constants.ts";

type Props = WithLanguageType & {
    job: CronJob;
    onDelete: (row: CronJob, response?: DeletedData) => void;
    onRestore: () => void;
};

function CronJobCard({job: jobProp, resolveLanguageKey, onDelete: onDeleteProp, onRestore: onRestoreProp}: Props) {
    const {
        action,
        setAction,
        entity: job,
        hideAfterDeletion,
        onDelete,
        onRestore,
    } = useEntityCard({
        entityProp: jobProp,
        onDeleteProp,
        onRestoreProp,
    });

    const {read, restore} = useAccess("cronJobs");
    const viewConfig = useViewConfig("cronjobs", "sheet");
    const isActive = job.active && !job.pausedAt;

    if (hideAfterDeletion || !restore) {
        return <></>;
    }
    if (!read || !Object.keys(read).length) {
        return <HiddenElement />;
    }

    return (
        <>
            <EntityCardShell onClick={() => setAction("view")}>
                <div className="w-full min-w-0">
                    <EntityTextCardHeader
                        title={job.name ? job.name : <ValueNotSet />}
                        subtitle={job.code ?? undefined}
                        showTitle={!!read?.name}
                        showSubtitle={!!read?.code}
                        actionMenu={
                            <ActionMenu
                                accessModel="cronJobs"
                                deletedData={job}
                                onAction={(a: string) => setAction(a)}
                                editPath={cronJobEditPath(job)}
                            />
                        }
                    />
                    <div className={CARD_BODY_CLASS}>
                        <InfoRowGroup>
                            <InfoRow
                                icon={Cog}
                                label={resolveLanguageKey("handler")}
                                tooltip={resolveLanguageKey("handler")}
                                show={!!read?.handler}
                                value={job.handler}
                            />
                            <InfoRow
                                icon={Clock}
                                label={resolveLanguageKey("nextRunAt")}
                                tooltip={resolveLanguageKey("nextRunAt")}
                                show={!!read?.nextRunAt}
                                value={job.nextRunAt ?? "—"}
                            />
                            <InfoRow
                                icon={Power}
                                label={resolveLanguageKey("active")}
                                tooltip={resolveLanguageKey("active")}
                                show={!!read?.active}
                                value={resolveLanguageKey(isActive ? "yes" : "no")}
                            />
                            <InfoRow
                                icon={Code}
                                label={resolveLanguageKey("code")}
                                tooltip={resolveLanguageKey("code")}
                                show={!!read?.code}
                                value={job.code}
                            />
                        </InfoRowGroup>
                    </div>
                </div>
            </EntityCardShell>

            {!!action && (
                <>
                    {action === "view" && viewConfig && (
                        <SheetViewRenderer
                            config={viewConfig}
                            data={job}
                            url="/api/auxiliary/cron-jobs/single"
                            fetchId={job._id}
                            open={action === "view"}
                            onOpenChange={(o) => { if (!o) setAction(""); }}
                            resolveLanguageKey={resolveLanguageKey}
                            access={read}
                            onDelete={onDelete}
                            onRestore={onRestore}
                            editPath={cronJobEditPath(job)}
                        />
                    )}
                    {action === "delete" && (
                        <DeleteAction
                            accessModel="cronJobs"
                            deleteId={job._id}
                            openAlert={action === "delete"}
                            name={read?.name && job.name}
                            confirmName={read?.name && job.name}
                            onSuccess={onDelete}
                            onCancel={() => setAction("")}
                            url="/api/auxiliary/cron-jobs"
                        />
                    )}
                    {action === "restore" && (
                        <RestoreAction
                            accessModel="cronJobs"
                            deleteId={job._id}
                            openAlert={action === "restore"}
                            name={read?.name && job.name}
                            confirmName={read?.name && job.name}
                            onSuccess={onRestore}
                            onCancel={() => setAction("")}
                            url="/api/auxiliary/cron-jobs/restore"
                        />
                    )}
                </>
            )}
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/cronJobs/center/cardView/cronJobCard.tsx"),
    withDebug(true, true),
)(CronJobCard);
