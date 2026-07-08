import {compose} from "redux";
import {memo, useEffect, useImperativeHandle, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Loader from "@coreModule/components/custom/loader.tsx";
import {ErrorView} from "@coreModule/components/custom/errorView.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {Card} from "@coreModule/components/ui/card.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import DeletedInfo from "@coreModule/components/custom/deletedInfo";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import InfoRow from "@coreModule/components/custom/infoRow.tsx";
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
    small = false,
}: MessagingProviderCardProps) {
    const [action, setAction] = useState("");
    const [messagingProvider, setMessagingProvider] = useState<MessagingProvider>(messagingProviderProp);
    const [hideAfterDeletion, setHideAfterDeletion] = useState(false);
    const [forceReload, setForceReload] = useState(1);

    const {read, restore} = useAccess("messagingProviders");

    const onDelete = (data: DeletedData) => {
        if (!data.deletedBy && !data.deletedAt) {
            setHideAfterDeletion(true);
        } else if (onDeleteProp) {
            onDeleteProp(messagingProvider, data);
        } else {
            setMessagingProvider({...messagingProvider, ...data});
        }
    };

    const onRestore = () => {
        if (onRestoreProp) {
            onRestoreProp();
        } else {
            setMessagingProvider({
                ...messagingProvider,
                deletedAt: undefined,
                deletedBy: undefined,
            });
        }
    };

    useEffect(() => {
        if (!fetchId) setMessagingProvider(messagingProviderProp);
    }, [fetchId, messagingProviderProp]);

    useEffect(() => {
        if (fetchId) onFilterChange({_id: fetchId});
    }, [fetchId, forceReload]);

    useImperativeHandle(innerRef, () => ({
        success: (data: MessagingProvider) => setMessagingProvider(data),
    }));

    if (hideAfterDeletion || !restore) return null;
    if (!read || !Object.keys(read).length) return <HiddenElement />;
    if (fetchId && loading) return <Loader />;
    if (fetchId && error) {
        return (
            <ErrorView
                title={resolveLanguageKey("failedTitle")}
                description={resolveLanguageKey("failedDescription")}
                onClick={() => setForceReload((n) => n + 1)}
            />
        );
    }
    if (!messagingProvider) return null;

    const providerTypeLabel = resolveLanguageKey(`providerTypeValues.${messagingProvider.providerType}`);

    return (
        <>
            {!sheetOnly && (
                <Card
                    className={cn(
                        "group p-0 relative transition-all duration-300 hover:shadow-md hover:cursor-pointer h-fit",
                        small && "hover:shadow-sm",
                    )}
                    onClick={() => setAction("view")}
                >
                    <div className="flex w-full items-stretch">
                        {(read.deletedBy || read.deletedAt) && (
                            <DeletedInfo deletedAt={messagingProvider.deletedAt} deletedBy={messagingProvider.deletedBy} />
                        )}
                        <div className={cn("w-full min-w-0", small ? "py-2" : "py-3")}>
                            <div
                                className={cn(
                                    "flex justify-between items-center gap-2",
                                    small ? "ps-3 pe-1.5 pb-1.5" : "ps-4 pe-2 pb-2",
                                )}
                            >
                                <div className="min-w-0 flex-1">
                                    <HiddenElement showLock randomLength={0}>
                                        {read?.name && (
                                            messagingProvider.name ? (
                                                <TooltipDisplayer tooltip={resolveLanguageKey("name")}>
                                                    <div className={cn("font-semibold leading-tight", small ? "text-sm" : "text-base")}>
                                                        {messagingProvider.name}
                                                    </div>
                                                </TooltipDisplayer>
                                            ) : (
                                                <ValueNotSet />
                                            )
                                        )}
                                    </HiddenElement>
                                </div>
                                {!hideActions && (
                                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
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
                                    </div>
                                )}
                            </div>
                            <div className={cn("space-y-2 text-sm pt-0", small ? "px-3" : "px-4")}>
                                <InfoRow
                                    icon={MessageSquare}
                                    label={resolveLanguageKey("providerType")}
                                    tooltip={resolveLanguageKey("providerType")}
                                    value={providerTypeLabel}
                                />
                                <InfoRow
                                    icon={Phone}
                                    label={resolveLanguageKey("fromPhone")}
                                    tooltip={resolveLanguageKey("fromPhone")}
                                    value={messagingProvider.fromPhone}
                                />
                                <InfoRow
                                    icon={Power}
                                    label={resolveLanguageKey("active")}
                                    tooltip={resolveLanguageKey("active")}
                                    value={resolveLanguageKey(messagingProvider.active ? "yes" : "no")}
                                />
                            </div>
                        </div>
                    </div>
                </Card>
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
                            onSuccess={(provider) => {
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
