import {IconArrowBackUp, IconGavel} from "@tabler/icons-react";
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useActionAccess} from "@coreModule/helpers/hooks/useActionAccess.ts";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import type {ContentReport} from "armonia/src/modules/core/api/reports/contentReport.dto.ts";

/** The desk's own row actions (D191): decide an open report, undo a decision that changed something. */
export type ReportAction = "decide" | "undo";

/** Whether this report's decision changed something the platform can take back. */
export function canUndoReport(report: ContentReport): boolean {
    return report.status === "closed" && !!report.decision && report.decision !== "dismissed" && !report.undoneAt;
}

type Props = WithLanguageType & {
    report: ContentReport;
    onAction: (action: ReportAction) => void;
};

function ReportActions({report, onAction, resolveLanguageKey}: Props) {
    const canDecide = useActionAccess("contentreports", "decideReports");
    if (!canDecide) return <></>;
    if (report.status === "open") {
        return (
            <DropdownMenuItem onClick={() => onAction("decide")}>
                <IconGavel size={16} />
                {resolveLanguageKey("decide")}
            </DropdownMenuItem>
        );
    }
    if (!canUndoReport(report)) return <></>;
    return (
        <DropdownMenuItem onClick={() => onAction("undo")}>
            <IconArrowBackUp size={16} />
            {resolveLanguageKey(`undo.${report.decision}`)}
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/reports/reportActions.tsx"),
    withDebug(true, true, "contentreports"),
)(ReportActions);
