import {useMemo} from "react";
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {COLUMN_TYPE} from "armonia/src/modules/core/database/filter/typeOperators";
import EntityListPage, {type QuickFilterDef} from "@coreModule/components/entityPage/pages/entityListPage.tsx";
import type {ContentReport} from "armonia/src/modules/core/api/reports/contentReport.dto.ts";
import {REPORT_DECISIONS, REPORT_REASONS, REPORT_STATUSES} from "armonia/src/modules/core/api/reports/report.form.validator.ts";
import ReportCard from "./reportCard.tsx";
import ReportSheetView from "./reportSheetView.tsx";
import ReportActions from "./reportActions.tsx";
import ReportDialogs from "./reportDialogs.tsx";

/**
 * The platform's report desk (D191): what people reported on every company's public pages, open reports first. The
 * reports are platform-only; deciding one needs the permission `decideReports`.
 */
function ReportDesk({resolveLanguageKey}: WithLanguageType) {
    const quickFilters = useMemo<QuickFilterDef[]>(() => [
        {
            field: "status",
            label: resolveLanguageKey("filters.status"),
            type: COLUMN_TYPE.ENUM,
            enumValues: REPORT_STATUSES.map((value) => ({value, label: resolveLanguageKey(`filters.statuses.${value}`)})),
        },
        {
            field: "reason",
            label: resolveLanguageKey("filters.reason"),
            type: COLUMN_TYPE.ENUM,
            enumValues: REPORT_REASONS.map((value) => ({value, label: resolveLanguageKey(`filters.reasons.${value}`)})),
        },
        {
            field: "decision",
            label: resolveLanguageKey("filters.decision"),
            type: COLUMN_TYPE.ENUM,
            enumValues: REPORT_DECISIONS.map((value) => ({value, label: resolveLanguageKey(`filters.decisions.${value}`)})),
        },
    ], [resolveLanguageKey]);

    return (
        <EntityListPage<ContentReport>
            apiUrl="/api/reports/desk"
            collectionName="contentreports"
            accessModel="contentreports"
            tableConfigKey="contentreports"
            buildEditPath={() => ""}
            resolveLanguageKey={resolveLanguageKey}
            quickFilters={quickFilters}
            rowActionMenu={{hideEdit: true, hideDelete: true, hideRestore: true, allowMenuForCustomChildren: true}}
            renderCard={(report, _onDelete, _onRestore, listRef) => (
                <ReportCard report={report} onModifySuccess={(updated: ContentReport) => listRef.current?.updateRow?.(report._id, updated)} />
            )}
            renderSheet={({entity, open, onOpenChange, listRef}) => (
                <ReportSheetView
                    open={open}
                    onOpenChange={onOpenChange}
                    report={entity}
                    onModifySuccess={(updated: ContentReport) => listRef.current?.updateRow?.(entity._id, updated)}
                />
            )}
            renderActionMenuChildren={(report, bindRowAction) => <ReportActions report={report} onAction={bindRowAction} />}
            renderFloatingModals={({action, entity, resetAction, listRef}) => (
                <ReportDialogs
                    action={action}
                    report={entity}
                    onClose={resetAction}
                    onSuccess={(updated) => listRef.current?.updateRow?.(entity._id, updated)}
                />
            )}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/reports/index.tsx"),
    withDebug(true, true, "contentreports"),
)(ReportDesk);
