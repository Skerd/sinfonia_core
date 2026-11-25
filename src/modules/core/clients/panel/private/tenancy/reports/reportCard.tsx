import {compose} from "redux";
import {IconBuilding, IconCalendar, IconExternalLink, IconFlag, IconGavel, IconMessageCircle, IconUser} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import EntityCard from "@coreModule/components/entityPage/list/card/entityCard.tsx";
import EntityCardRow from "@coreModule/components/entityPage/list/card/entityCardRow.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Separator} from "@coreModule/components/ui/separator.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {
    CARD_INFO_ROWS_TWO_COL_CLASS,
    STATUS_BADGE_DANGER,
    STATUS_BADGE_NEUTRAL,
    STATUS_BADGE_WARNING,
} from "@coreModule/components/entityPage/list/entityCard.constants.ts";
import type {ContentReport} from "armonia/src/modules/core/api/reports/contentReport.dto.ts";
import type {ReportDecision} from "armonia/src/modules/core/api/reports/report.form.validator.ts";
import ReportSheetView from "./reportSheetView.tsx";
import ReportActions from "./reportActions.tsx";
import ReportDialogs from "./reportDialogs.tsx";

const DECISION_TONE: Record<ReportDecision, string> = {
    dismissed: STATUS_BADGE_NEUTRAL,
    itemHidden: STATUS_BADGE_WARNING,
    companyHidden: STATUS_BADGE_WARNING,
    companySuspended: STATUS_BADGE_DANGER,
    accountBanned: STATUS_BADGE_DANGER,
};

type Props = WithLanguageType & {
    report: ContentReport;
    onModifySuccess?: (updated: ContentReport) => void;
};

/** One report: what was reported, by whom and why, and the decision once there is one. */
function ReportCard({report, onModifySuccess, resolveLanguageKey}: Props) {
    return (
        <EntityCard
            resource="contentreports"
            entity={report}
            singleUrl="/api/reports/desk/single"
            hideDelete
            hideRestore
            hideEdit
            editPath={() => ""}
            Sheet={ReportSheetView}
            sheetEntityProp="report"
            deleteUrl="/api/reports/desk"
            restoreUrl="/api/reports/desk/restore"
            failedTitle={resolveLanguageKey("failedTitle")}
            failedDescription={resolveLanguageKey("failedDescription")}
            titlePath="recordTitle"
            sheetProps={({setEntity}) => ({
                onModifySuccess: (updated: ContentReport) => {
                    setEntity(updated);
                    onModifySuccess?.(updated);
                },
            })}
            extraDialogs={({action, setAction, entity, setEntity}) => action ? (
                <ReportDialogs
                    action={action}
                    report={entity}
                    onClose={() => setAction("")}
                    onSuccess={(updated) => {
                        setEntity(updated);
                        onModifySuccess?.(updated);
                    }}
                />
            ) : null}
        >
            {({entity, setAction}) => (
                <>
                    <EntityCard.Header
                        titlePath="recordTitle"
                        title={entity.recordTitle}
                        // A reported business is its own company: its name is already the title.
                        subtitle={entity.recordTitle === entity.recordCompanyName ? entity.kindLabel : `${entity.kindLabel} · ${entity.recordCompanyName}`}
                        // The kind's label is the server's; access follows the stored kind.
                        subtitlePath="kind"
                        badges={entity.status === "open" ? (
                            <Badge variant="outline" className={cn("text-xs", STATUS_BADGE_WARNING)}>{resolveLanguageKey("statuses.open")}</Badge>
                        ) : entity.decision ? (
                            <Badge variant="outline" className={cn("text-xs", DECISION_TONE[entity.decision])}>
                                {resolveLanguageKey(`decisions.${entity.decision}`)}
                                {entity.undoneAt ? ` · ${resolveLanguageKey("undone")}` : ""}
                            </Badge>
                        ) : null}
                    >
                        <ReportActions report={entity} onAction={setAction} />
                    </EntityCard.Header>
                    <Separator className="-mx-(--density-pad) w-auto self-stretch" />
                    <EntityCard.Body className={CARD_INFO_ROWS_TWO_COL_CLASS}>
                        <EntityCardRow icon={IconFlag} label={resolveLanguageKey("reason")} tooltip={resolveLanguageKey("reason")} path="reason"
                            value={resolveLanguageKey(`reasons.${entity.reason}`)} />
                        <EntityCardRow icon={IconUser} label={resolveLanguageKey("reporter")} tooltip={resolveLanguageKey("reporter")} path="reporterEmail"
                            value={entity.reporterEmail} />
                        <EntityCardRow icon={IconCalendar} label={resolveLanguageKey("createdAt")} tooltip={resolveLanguageKey("createdAt")} path="createdAt"
                            type="dateTime" value={entity.createdAt} />
                        {entity.recordTitle !== entity.recordCompanyName ? (
                            <EntityCardRow icon={IconBuilding} label={resolveLanguageKey("company")} tooltip={resolveLanguageKey("company")} path="recordCompanyName"
                                value={entity.recordCompanyName} />
                        ) : null}
                        {entity.comment ? (
                            <EntityCardRow icon={IconMessageCircle} label={resolveLanguageKey("comment")} tooltip={entity.comment} path="comment"
                                value={entity.comment} />
                        ) : null}
                        {entity.decisionNote ? (
                            <EntityCardRow icon={IconGavel} label={resolveLanguageKey("decisionNote")} tooltip={entity.decisionNote} path="decisionNote"
                                value={entity.decisionNote} />
                        ) : null}
                        {entity.recordUrl ? (
                            <EntityCardRow icon={IconExternalLink} label={resolveLanguageKey("page")} tooltip={entity.recordUrl} path="recordUrl"
                                value={entity.recordUrl}>
                                {() => (
                                    <a href={entity.recordUrl} target="_blank" rel="noopener noreferrer" className="truncate underline underline-offset-2"
                                        onClick={(event) => event.stopPropagation()}>
                                        {resolveLanguageKey("openLink")}
                                    </a>
                                )}
                            </EntityCardRow>
                        ) : null}
                    </EntityCard.Body>
                </>
            )}
        </EntityCard>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/reports/reportCard.tsx"),
    withDebug(true, true, "contentreports"),
)(ReportCard);
