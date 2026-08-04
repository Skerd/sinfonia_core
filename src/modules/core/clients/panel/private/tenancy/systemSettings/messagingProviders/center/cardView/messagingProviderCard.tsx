import {compose} from "redux";
import {memo, useEffect, useImperativeHandle, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import DeletedInfo from "@coreModule/components/custom/deletedInfo";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import InfoRow from "@coreModule/components/custom/infoRow.tsx";
import {InfoRowGroup} from "@coreModule/components/custom/infoRowGroup.tsx";
import {MessageSquare, Phone, Power} from "lucide-react";
import MessagingProviderSheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders/center/sheetView/messagingProviderSheetView.tsx";
import DeleteAction from "@coreModule/components/custom/actions/deleteAction.tsx";
import type {DeletedData, SingleForm} from "armonia/src/modules/core/types/shared.types.ts";
import RestoreAction from "@coreModule/components/custom/actions/restoreAction.tsx";
import ActionMenu from "@coreModule/components/custom/actions/menu/actionMenu.tsx";
import ActivateMessagingProvider from "@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders/center/actions/activateMessagingProvider.tsx";
import DeactivateMessagingProvider from "@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders/center/actions/deactivateMessagingProvider.tsx";
import TestMessagingProviderConnection from "@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders/center/actions/testMessagingProviderConnection.tsx";
import SetMessagingProviderActiveDialog from "@coreModule/components/custom/messagingProviders/setMessagingProviderActiveDialog.tsx";
import TestMessagingProviderConnectionDialog from "@coreModule/components/custom/messagingProviders/testMessagingProviderConnectionDialog.tsx";
import type {MessagingProvider} from "armonia/src/modules/core/api/auxiliary/private/messagingProvider/messagingProvider.dto.ts";
import {messagingProviderEditPath} from "@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders";
import {useEntityCard} from "@coreModule/helpers/hooks/useEntityCard.ts";
import {EntityCardShell} from "@coreModule/components/custom/cards/EntityCardShell.tsx";
import {EntityTextCardHeader} from "@coreModule/components/custom/cards/EntityTextCardHeader.tsx";
import {EntityCardFetchGuard} from "@coreModule/components/custom/cards/EntityCardFetchGuard.tsx";
import {CARD_BODY_CLASS} from "@coreModule/components/custom/cards/entityCard.constants.ts";

type MessagingProviderCardProps = WithLanguageType & WithAxiosType<MessagingProvider, SingleForm> & {
    messagingProvider: MessagingProvider;
    fetchId?: string;
    hideActions?: boolean;
    onDelete?: (deleted?: MessagingProvider, response?: DeletedData) => void;
    onRestore?: () => void;
    sheetOnly?: boolean;
    small?: boolean;
};

const MESSAGING_PROVIDER_API_URL = "/api/auxiliary/messagingProvider";

const MessagingProviderCard = memo(function MessagingProviderCard({
    messagingProvider: messagingProviderProp,
    resolveLanguageKey,
    fetchId,
    onFilterChange,
    loading,
    error,
    innerRef,
    hideActions,
    onDelete: onDeleteProp,
    onRestore: onRestoreProp,
    sheetOnly = false,
}: MessagingProviderCardProps) {
    const {
        action,
        setAction,
        entity: messagingProvider,
        setEntity: setMessagingProvider,
        hideAfterDeletion,
        onDelete,
        onRestore,
    } = useEntityCard({
        entityProp: messagingProviderProp,
        onDeleteProp,
        onRestoreProp,
        syncPropOnChange: !fetchId,
    });
    const [forceReload, setForceReload] = useState(1);

    const {read, restore} = useAccess("messagingProviders");

    useEffect(() => {
        if (fetchId) onFilterChange({_id: fetchId});
    }, [fetchId, forceReload]);

    useImperativeHandle(innerRef, () => ({
        success: (data: MessagingProvider) => setMessagingProvider(data),
    }));

    if (hideAfterDeletion || !restore) return null;
    if (!read || !Object.keys(read).length) return <HiddenElement />;
    if (!messagingProvider) return null;

    const providerTypeLabel = resolveLanguageKey(`providerTypeValues.${messagingProvider.providerType}`);

    return (
        <EntityCardFetchGuard
            fetchId={fetchId}
            loading={loading}
            error={error}
            failedTitle={resolveLanguageKey("failedTitle")}
            failedDescription={resolveLanguageKey("failedDescription")}
            onRetry={() => setForceReload((n) => n + 1)}
        >
            <>
                {!sheetOnly && (
                    <EntityCardShell onClick={() => setAction("view")}>
                        <div className="flex w-full items-stretch">
                            {(read.deletedBy || read.deletedAt) && (
                                <DeletedInfo deletedAt={messagingProvider.deletedAt} deletedBy={messagingProvider.deletedBy} />
                            )}
                            <div className="w-full min-w-0">
                                <EntityTextCardHeader
                                    title={messagingProvider.name ? messagingProvider.name : <ValueNotSet />}
                                    showTitle={!!read?.name}
                                    hideActions={hideActions}
                                    actionMenu={
                                        <ActionMenu
                                            accessModel="messagingProviders"
                                            deletedData={messagingProvider}
                                            onAction={(a: string) => setAction(a)}
                                            editPath={messagingProviderEditPath(messagingProvider)}
                                            allowMenuForCustomChildren
                                        >
                                            <TestMessagingProviderConnection onAction={(a: string) => setAction(a)} />
                                            <ActivateMessagingProvider messagingProvider={messagingProvider} onAction={(a: string) => setAction(a)} />
                                            <DeactivateMessagingProvider messagingProvider={messagingProvider} onAction={(a: string) => setAction(a)} />
                                        </ActionMenu>
                                    }
                                />
                                <div className={CARD_BODY_CLASS}>
                                    <InfoRowGroup>
                                        <InfoRow
                                            icon={MessageSquare}
                                            label={resolveLanguageKey("providerType")}
                                            tooltip={resolveLanguageKey("providerType")}
                                            show={!!read?.providerType}
                                            value={
                                                messagingProvider.providerType ? providerTypeLabel : <ValueNotSet />
                                            }
                                        />
                                        <InfoRow
                                            icon={Power}
                                            label={resolveLanguageKey("active")}
                                            tooltip={resolveLanguageKey("active")}
                                            show={!!read?.active}
                                            value={resolveLanguageKey(messagingProvider.active ? "yes" : "no")}
                                        />
                                        <InfoRow
                                            icon={Phone}
                                            label={resolveLanguageKey("fromPhone")}
                                            tooltip={resolveLanguageKey("fromPhone")}
                                            show={!!read?.fromPhone}
                                            value={messagingProvider.fromPhone || <ValueNotSet />}
                                        />
                                    </InfoRowGroup>
                                </div>
                            </div>
                        </div>
                    </EntityCardShell>
                )}
                {!!action && (
                    <>
                        {action === "view" && (
                            <MessagingProviderSheetView
                                open={action === "view"}
                                onOpenChange={() => setAction("")}
                                messagingProvider={messagingProvider}
                                fetchId={fetchId}
                                onDelete={onDelete}
                                onRestore={onRestore}
                                onSheetRowPatched={(row: MessagingProvider) => setMessagingProvider(row as MessagingProvider)}
                            />
                        )}
                        {action === "delete" && (
                            <DeleteAction
                                accessModel="messagingProviders"
                                deleteId={messagingProvider._id}
                                openAlert={action === "delete"}
                                name={read?.name && messagingProvider.name}
                                confirmName={read?.name && messagingProvider.name}
                                onSuccess={onDelete}
                                onCancel={() => setAction("")}
                                url={MESSAGING_PROVIDER_API_URL}
                            />
                        )}
                        {action === "restore" && (
                            <RestoreAction
                                accessModel="messagingProviders"
                                deleteId={messagingProvider._id}
                                openAlert={action === "restore"}
                                name={read?.name && messagingProvider.name}
                                confirmName={read?.name && messagingProvider.name}
                                onSuccess={onRestore}
                                onCancel={() => setAction("")}
                                url={`${MESSAGING_PROVIDER_API_URL}/restore`}
                            />
                        )}
                        {(action === "activateMessagingProvider" || action === "deactivateMessagingProvider") && (
                            <SetMessagingProviderActiveDialog
                                open={action === "activateMessagingProvider" || action === "deactivateMessagingProvider"}
                                onOpenChange={(o: boolean) => { if (!o) setAction(""); }}
                                messagingProvider={messagingProvider}
                                targetActive={action === "activateMessagingProvider"}
                                onSuccess={(provider: MessagingProvider) => {
                                    setMessagingProvider(provider);
                                    setForceReload((n) => n + 1);
                                }}
                            />
                        )}
                        {action === "testMessagingProviderConnection" && (
                            <TestMessagingProviderConnectionDialog
                                open={action === "testMessagingProviderConnection"}
                                onOpenChange={(o: boolean) => { if (!o) setAction(""); }}
                                messagingProvider={messagingProvider}
                                onTestComplete={() => setForceReload((n) => n + 1)}
                            />
                        )}
                    </>
                )}
            </>
        </EntityCardFetchGuard>
    );
});

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/messagingProviders/center/cardView/messagingProviderCard.tsx"),
    withAxios<MessagingProvider, SingleForm>({
        method: "POST",
        url: `${MESSAGING_PROVIDER_API_URL}/single`,
        data: {},
    }, true),
    withDebug(true, true),
)(MessagingProviderCard);
