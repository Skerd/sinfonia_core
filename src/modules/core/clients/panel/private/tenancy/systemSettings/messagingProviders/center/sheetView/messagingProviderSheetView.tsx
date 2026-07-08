import {compose} from "redux";
import {useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import type {MessagingProvider} from "armonia/src/modules/core/api/auxiliary/private/messagingProvider/messagingProvider.dto.ts";
import {messagingProviderEditPath} from "@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders";
import ActivateMessagingProvider from "@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders/center/actions/activateMessagingProvider.tsx";
import DeactivateMessagingProvider from "@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders/center/actions/deactivateMessagingProvider.tsx";
import TestMessagingProviderConnection from "@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders/center/actions/testMessagingProviderConnection.tsx";
import SetMessagingProviderActiveDialog from "@coreModule/components/custom/messagingProviders/setMessagingProviderActiveDialog.tsx";
import TestMessagingProviderConnectionDialog from "@coreModule/components/custom/messagingProviders/testMessagingProviderConnectionDialog.tsx";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";

export type MessagingProviderSheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    messagingProvider?: MessagingProvider;
    hideActions?: boolean;
    onDelete?: (response?: DeletedData) => void;
    onRestore?: () => void;
    fetchId?: string;
    onSheetRowPatched?: (row: Record<string, unknown>) => void;
};

const MESSAGING_PROVIDER_SINGLE_URL = "/api/auxiliary/messagingProvider/single";

function MessagingProviderSheetView({
    open,
    onOpenChange,
    messagingProvider: messagingProviderProp,
    resolveLanguageKey,
    hideActions = false,
    onDelete = () => {},
    onRestore = () => {},
    fetchId,
    onSheetRowPatched,
}: MessagingProviderSheetViewOwnProps & WithLanguageType) {
    const access = useAccess("messagingProviders");
    const viewConfig = useViewConfig("messagingproviders", "sheet");
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(messagingProviderProp || {_id: fetchId});
    const [action, setAction] = useState("");

    useEffect(() => {
        if (!open) setAction("");
    }, [open]);

    useEffect(() => {
        if (!messagingProviderProp) return;
        setSheetData(messagingProviderProp);
    }, [messagingProviderProp]);

    const entityId = messagingProviderProp?._id ?? fetchId;
    if (!viewConfig || !entityId) return null;

    const asMessagingProvider = sheetData as MessagingProvider;

    const refreshSheetData = async () => {
        const res = await apiClient.post<MessagingProvider>(MESSAGING_PROVIDER_SINGLE_URL, {_id: entityId});
        setSheetData(res.data);
        onSheetRowPatched?.(res.data);
    };

    return (
        <>
            <SheetViewRenderer
                config={viewConfig}
                data={sheetData}
                url={MESSAGING_PROVIDER_SINGLE_URL}
                fetchId={fetchId}
                onDataFetched={(data) => setSheetData(data)}
                open={open}
                onOpenChange={onOpenChange}
                resolveLanguageKey={resolveLanguageKey}
                access={access}
                hideActions={hideActions}
                onDelete={onDelete}
                onRestore={onRestore}
                editPath={messagingProviderEditPath(asMessagingProvider)}
                onSheetRowPatched={onSheetRowPatched}
                actionMenuAllowCustomChildren
                actionMenuChildren={
                    <>
                        <TestMessagingProviderConnection onAction={(a: string) => setAction(a)} />
                        <ActivateMessagingProvider messagingProvider={asMessagingProvider} onAction={(a: string) => setAction(a)} />
                        <DeactivateMessagingProvider messagingProvider={asMessagingProvider} onAction={(a: string) => setAction(a)} />
                    </>
                }
            />
            {(action === "activateMessagingProvider" || action === "deactivateMessagingProvider") && (
                <SetMessagingProviderActiveDialog
                    open={action === "activateMessagingProvider" || action === "deactivateMessagingProvider"}
                    onOpenChange={(o: boolean) => { if (!o) setAction(""); }}
                    messagingProvider={asMessagingProvider}
                    targetActive={action === "activateMessagingProvider"}
                    onSuccess={(provider) => {
                        setSheetData(provider);
                        onSheetRowPatched?.(provider);
                    }}
                />
            )}
            {action === "testMessagingProviderConnection" && (
                <TestMessagingProviderConnectionDialog
                    open={action === "testMessagingProviderConnection"}
                    onOpenChange={(o: boolean) => { if (!o) setAction(""); }}
                    messagingProvider={asMessagingProvider}
                    onTestComplete={() => { void refreshSheetData(); }}
                />
            )}
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/messagingProviders/center/sheetView/messagingProviderSheetView.tsx"),
    withDebug(true, true),
)(MessagingProviderSheetView);
