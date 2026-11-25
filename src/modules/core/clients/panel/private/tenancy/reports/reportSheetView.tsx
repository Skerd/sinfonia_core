import {compose} from "redux";
import {useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import type {ContentReport} from "armonia/src/modules/core/api/reports/contentReport.dto.ts";
import ReportActions from "./reportActions.tsx";
import ReportDialogs from "./reportDialogs.tsx";

export type ReportSheetViewProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    report?: ContentReport;
    fetchId?: string;
    hideActions?: boolean;
    /** The report after a decision or an undo, for the list and the card. */
    onModifySuccess?: (updated: ContentReport) => void;
};

/** One report on the desk: the server's sheet view, with the desk's decide and undo actions. */
function ReportSheetView({open, onOpenChange, report, fetchId, hideActions = false, onModifySuccess, resolveLanguageKey}: ReportSheetViewProps & WithLanguageType) {
    const access = useAccess("contentreports");
    const viewConfig = useViewConfig("contentreports", "sheet");
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(report ?? {_id: fetchId});
    const [action, setAction] = useState("");

    useEffect(() => {
        if (report) setSheetData(report);
    }, [report]);

    const current = sheetData as ContentReport;
    if (!viewConfig || !(report?._id ?? fetchId)) return null;

    return (
        <>
            <SheetViewRenderer
                config={viewConfig}
                data={sheetData}
                url="/api/reports/desk/single"
                fetchId={fetchId}
                onDataFetched={(data) => setSheetData(data)}
                open={open}
                onOpenChange={onOpenChange}
                resolveLanguageKey={resolveLanguageKey}
                access={access}
                hideActions={hideActions}
                hideEdit
                hideDelete
                hideRestore
                actionMenuAllowCustomChildren
                editPath=""
                actionMenuChildren={<ReportActions report={current} onAction={setAction} />}
            />
            {action ? (
                <ReportDialogs
                    action={action}
                    report={current}
                    onClose={() => setAction("")}
                    onSuccess={(updated) => {
                        setSheetData(updated);
                        onModifySuccess?.(updated);
                    }}
                />
            ) : null}
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/reports/reportSheetView.tsx"),
    withDebug(true, true, "contentreports"),
)(ReportSheetView);
