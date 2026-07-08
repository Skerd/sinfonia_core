import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import EntityListPage from "@coreModule/components/entityPage/EntityListPage.tsx";
import {MessageSquarePlus} from "lucide-react";
import type {MessagingProvider} from "armonia/src/modules/core/api/auxiliary/private/messagingProvider/messagingProvider.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import MessagingProviderCard from "@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders/center/cardView/messagingProviderCard.tsx";
import MessagingProviderSheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders/center/sheetView/messagingProviderSheetView.tsx";
import ActivateMessagingProvider from "@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders/center/actions/activateMessagingProvider.tsx";
import DeactivateMessagingProvider from "@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders/center/actions/deactivateMessagingProvider.tsx";
import TestMessagingProviderConnection from "@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders/center/actions/testMessagingProviderConnection.tsx";
import SetMessagingProviderActiveDialog from "@coreModule/components/custom/messagingProviders/setMessagingProviderActiveDialog.tsx";
import TestMessagingProviderConnectionDialog from "@coreModule/components/custom/messagingProviders/testMessagingProviderConnectionDialog.tsx";

export function messagingProviderEditPath(provider: MessagingProvider) {
    const params = new URLSearchParams();
    params.set("messagingProviderId", provider._id);
    if (provider.name) params.set("messagingProviderName", provider.name);
    return `/tenancy/systemSettings/messagingProviders/edit?${params.toString()}`;
}

function AllMessagingProviders({resolveLanguageKey}: WithLanguageType) {
    return (
        <EntityListPage<MessagingProvider>
            apiUrl="/api/auxiliary/messagingProvider"
            collectionName="messagingproviders"
            accessModel="messagingProviders"
            tableConfigKey="messagingproviders"
            rowActionMenu={{allowMenuForCustomChildren: true}}
            createPath="/tenancy/systemSettings/messagingProviders/create"
            createIcon={<MessageSquarePlus className="h-4 w-4" />}
            createLanguageKey="createMessagingProvider"
            buildEditPath={messagingProviderEditPath}
            resolveLanguageKey={resolveLanguageKey}
            sheetLanguagePath="src/modules/core/clients/panel/private/tenancy/systemSettings/messagingProviders/center/sheetView/messagingProviderSheetView.tsx"
            cardViewClassName="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3"
            renderActionMenuChildren={(_entity, bindRowAction) => (
                <>
                    <TestMessagingProviderConnection onAction={bindRowAction} />
                    <ActivateMessagingProvider messagingProvider={_entity} onAction={bindRowAction} />
                    <DeactivateMessagingProvider messagingProvider={_entity} onAction={bindRowAction} />
                </>
            )}
            renderSheetActionMenuChildren={(_entity, bindRowAction) => (
                <>
                    <TestMessagingProviderConnection onAction={bindRowAction} />
                    <ActivateMessagingProvider messagingProvider={_entity} onAction={bindRowAction} />
                    <DeactivateMessagingProvider messagingProvider={_entity} onAction={bindRowAction} />
                </>
            )}
            renderFloatingModals={({action, entity, resetAction, listRef}) => {
                if (action === "testMessagingProviderConnection") {
                    return (
                        <TestMessagingProviderConnectionDialog
                            open={true}
                            onOpenChange={(o: boolean) => { if (!o) resetAction(); }}
                            messagingProvider={entity}
                            onTestComplete={() => listRef.current?.refetch?.()}
                        />
                    );
                }
                if (action === "activateMessagingProvider") {
                    return (
                        <SetMessagingProviderActiveDialog
                            open={true}
                            onOpenChange={(o: boolean) => { if (!o) resetAction(); }}
                            messagingProvider={entity}
                            targetActive={true}
                            onSuccess={(provider) => listRef.current?.updateRow?.(entity._id, provider)}
                        />
                    );
                }
                if (action === "deactivateMessagingProvider") {
                    return (
                        <SetMessagingProviderActiveDialog
                            open={true}
                            onOpenChange={(o: boolean) => { if (!o) resetAction(); }}
                            messagingProvider={entity}
                            targetActive={false}
                            onSuccess={(provider) => listRef.current?.updateRow?.(entity._id, provider)}
                        />
                    );
                }
                return null;
            }}
            renderCard={(entity, onDelete, onRestore) => (
                <MessagingProviderCard
                    messagingProvider={entity}
                    onDelete={(row: MessagingProvider | undefined, response?: DeletedData) => onDelete(row, response)}
                    onRestore={() => onRestore(entity)}
                />
            )}
            renderSheet={({entity, open, onOpenChange, onDelete, onRestore, listRef}) => (
                <MessagingProviderSheetView
                    open={open}
                    onOpenChange={(opened: boolean) => { if (!opened) onOpenChange(); }}
                    messagingProvider={entity}
                    onDelete={onDelete}
                    onRestore={onRestore}
                    onSheetRowPatched={(row: Record<string, unknown>) => {
                        listRef.current?.updateRow?.(entity._id, row as Partial<MessagingProvider>);
                    }}
                />
            )}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/messagingProviders/index.tsx"),
    withDebug(true, true),
)(AllMessagingProviders);
