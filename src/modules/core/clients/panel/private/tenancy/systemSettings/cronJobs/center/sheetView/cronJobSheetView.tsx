import {compose} from "redux";
import {useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import type {CronJob} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.dto.ts";
import {cronJobEditPath} from "../../index.tsx";

export type CronJobSheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cronJob?: CronJob;
    /** Alias used by the list card (`sheetEntityProp="data"`). */
    data?: CronJob;
    hideActions?: boolean;
    onDelete?: (response?: DeletedData) => void;
    onRestore?: () => void;
    fetchId?: string;
};

function CronJobSheetView({
    open,
    onOpenChange,
    cronJob: cronJobProp,
    data: dataProp,
    resolveLanguageKey,
    hideActions = false,
    onDelete = () => {},
    onRestore = () => {},
    fetchId,
}: CronJobSheetViewOwnProps & WithLanguageType) {
    const access = useAccess("cronJobs");
    const viewConfig = useViewConfig("cronjobs", "sheet");
    const bootstrap = cronJobProp ?? dataProp;
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(bootstrap || {_id: fetchId});

    useEffect(() => {
        if (!bootstrap) return;
        setSheetData(bootstrap);
    }, [bootstrap]);

    const entityId = bootstrap?._id ?? fetchId;

    if (!viewConfig) {
        return null;
    }
    if (!entityId) {
        return null;
    }

    return (
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
            onDelete={onDelete}
            onRestore={onRestore}
            editPath={cronJobEditPath(sheetData as CronJob)}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/cronJobs/center/sheetView/cronJobSheetView.tsx"),
    withDebug(true, true)
)(CronJobSheetView);
