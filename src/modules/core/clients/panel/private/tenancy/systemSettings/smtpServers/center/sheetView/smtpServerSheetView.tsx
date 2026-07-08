import {compose} from "redux";
import {useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import type {SmtpServer} from "armonia/src/modules/core/api/auxiliary/private/smtpServer/smtpServer.dto.ts";
import {smtpServerEditPath} from "@coreModule/clients/panel/private/tenancy/systemSettings/smtpServers";
import TestSmtpConnection from "@coreModule/clients/panel/private/tenancy/systemSettings/smtpServers/center/actions/testSmtpConnection.tsx";
import TestSmtpConnectionDialog from "@coreModule/components/custom/smtpServers/testSmtpConnectionDialog.tsx";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";

export type SmtpServerSheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    smtpServer?: SmtpServer;
    hideActions?: boolean;
    onDelete?: (response?: DeletedData) => void;
    onRestore?: () => void;
    fetchId?: string;
    onSheetRowPatched?: (row: Record<string, unknown>) => void;
};

const SMTP_SERVER_SINGLE_URL = "/api/auxiliary/smtpServer/single";

function SmtpServerSheetView({
    open,
    onOpenChange,
    smtpServer: smtpServerProp,
    resolveLanguageKey,
    hideActions = false,
    onDelete = () => {},
    onRestore = () => {},
    fetchId,
    onSheetRowPatched,
}: SmtpServerSheetViewOwnProps & WithLanguageType) {
    const access = useAccess("smtpServers");
    const viewConfig = useViewConfig("smtpservers", "sheet");
    const [sheetData, setSheetData] = useState<Record<string, any>>(smtpServerProp || {_id: fetchId});
    const [action, setAction] = useState("");

    useEffect(() => {
        if (!open) setAction("");
    }, [open]);

    useEffect(() => {
        if (!smtpServerProp) return;
        setSheetData(smtpServerProp);
    }, [smtpServerProp]);

    const entityId = smtpServerProp?._id ?? fetchId;
    if (!viewConfig || !entityId) return null;

    const asSmtpServer = sheetData as SmtpServer;

    const refreshSheetData = async () => {
        const res = await apiClient.post<SmtpServer>(SMTP_SERVER_SINGLE_URL, {_id: entityId});
        setSheetData(res.data);
        onSheetRowPatched?.(res.data);
    };

    return (
        <>
            <SheetViewRenderer
                config={viewConfig}
                data={sheetData}
                url={SMTP_SERVER_SINGLE_URL}
                fetchId={fetchId}
                onDataFetched={(data) => setSheetData(data)}
                open={open}
                onOpenChange={onOpenChange}
                resolveLanguageKey={resolveLanguageKey}
                access={access}
                hideActions={hideActions}
                onDelete={onDelete}
                onRestore={onRestore}
                editPath={smtpServerEditPath(asSmtpServer)}
                onSheetRowPatched={onSheetRowPatched}
                actionMenuAllowCustomChildren
                actionMenuChildren={
                    <TestSmtpConnection onAction={(a: string) => setAction(a)} />
                }
            />
            {action === "testSmtpConnection" && (
                <TestSmtpConnectionDialog
                    open={action === "testSmtpConnection"}
                    onOpenChange={(o: boolean) => { if (!o) setAction(""); }}
                    smtpServer={asSmtpServer}
                    onTestComplete={() => { void refreshSheetData(); }}
                />
            )}
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/smtpServers/center/sheetView/smtpServerSheetView.tsx"),
    withDebug(true, true),
)(SmtpServerSheetView);
