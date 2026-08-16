import {compose} from "redux";
import {memo, type RefObject} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {MessageSquare, Phone, Power} from "lucide-react";
import DisplayRow from "@coreModule/components/custom/displayValue/displayRow.tsx";
import MessagingProviderSheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders/center/sheetView/messagingProviderSheetView.tsx";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import ActivateMessagingProvider from "@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders/center/actions/activateMessagingProvider.tsx";
import DeactivateMessagingProvider from "@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders/center/actions/deactivateMessagingProvider.tsx";
import TestMessagingProviderConnection from "@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders/center/actions/testMessagingProviderConnection.tsx";
import SetMessagingProviderActiveDialog from "@coreModule/components/custom/messagingProviders/setMessagingProviderActiveDialog.tsx";
import TestMessagingProviderConnectionDialog from "@coreModule/components/custom/messagingProviders/testMessagingProviderConnectionDialog.tsx";
import type {MessagingProvider} from "armonia/src/modules/core/api/auxiliary/private/messagingProvider/messagingProvider.dto.ts";
import {messagingProviderEditPath} from "@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders";
import EntityCard from "@coreModule/components/custom/systemCards/entityCard.tsx";
import type {WithAxiosLifecycleRef} from "@coreModule/helpers/hocs/withAxios.tsx";

type MessagingProviderCardProps = WithLanguageType & {
    messagingProvider: MessagingProvider;
    fetchId?: string;
    hideActions?: boolean;
    onDelete?: (deleted?: MessagingProvider, response?: DeletedData) => void;
    onRestore?: () => void;
    sheetOnly?: boolean;
    innerRef?: RefObject<WithAxiosLifecycleRef<MessagingProvider> | null>;
};

const MESSAGING_PROVIDER_API_URL = "/api/auxiliary/messagingProvider";

const MessagingProviderCard = memo(function MessagingProviderCard({
    messagingProvider,
    resolveLanguageKey,
    fetchId,
    hideActions,
    onDelete,
    onRestore,
    sheetOnly = false,
    innerRef,
}: MessagingProviderCardProps) {
    return (
        <EntityCard
            resource="messagingProviders"
            entity={messagingProvider}
            fetchId={fetchId}
            singleUrl={`${MESSAGING_PROVIDER_API_URL}/single`}
            onDelete={onDelete}
            onRestore={onRestore}
            hideActions={hideActions}
            sheetOnly={sheetOnly}
            editPath={messagingProviderEditPath}
            Sheet={MessagingProviderSheetView}
            sheetEntityProp="messagingProvider"
            deleteUrl={MESSAGING_PROVIDER_API_URL}
            restoreUrl={`${MESSAGING_PROVIDER_API_URL}/restore`}
            failedTitle={String(resolveLanguageKey("failedTitle"))}
            failedDescription={String(resolveLanguageKey("failedDescription"))}
            titlePath="name"
            innerRef={innerRef}
            sheetProps={({setEntity}) => ({
                fetchId,
                onSheetRowPatched: setEntity,
            })}
            extraDialogs={({action, setAction, entity, setEntity, retry}) => (
                <>
                    {(action === "activateMessagingProvider" || action === "deactivateMessagingProvider") && (
                        <SetMessagingProviderActiveDialog
                            open
                            onOpenChange={(open) => {
                                if (!open) setAction("");
                            }}
                            messagingProvider={entity}
                            targetActive={action === "activateMessagingProvider"}
                            onSuccess={(provider) => {
                                setEntity(provider);
                                retry();
                            }}
                        />
                    )}
                    {action === "testMessagingProviderConnection" && (
                        <TestMessagingProviderConnectionDialog
                            open
                            onOpenChange={(open) => {
                                if (!open) setAction("");
                            }}
                            messagingProvider={entity}
                            onTestComplete={retry}
                        />
                    )}
                </>
            )}
        >
            {({entity, setAction}) => (
                <>
                    <EntityCard.Header titlePath="name" title={entity.name}>
                        <TestMessagingProviderConnection onAction={setAction} />
                        <ActivateMessagingProvider messagingProvider={entity} onAction={setAction} />
                        <DeactivateMessagingProvider messagingProvider={entity} onAction={setAction} />
                    </EntityCard.Header>
                    <EntityCard.Body>
                        <DisplayRow
                            icon={MessageSquare}
                            label={resolveLanguageKey("providerType")}
                            tooltip={resolveLanguageKey("providerType")}
                            path="providerType"
                            type="enum"
                            languageKeyCategory="providerTypeValues"
                            value={entity.providerType}
                        />
                        <DisplayRow
                            icon={Power}
                            label={resolveLanguageKey("active")}
                            tooltip={resolveLanguageKey("active")}
                            path="active"
                            type="boolean"
                            value={entity.active}
                        />
                        <DisplayRow
                            icon={Phone}
                            label={resolveLanguageKey("fromPhone")}
                            tooltip={resolveLanguageKey("fromPhone")}
                            path="fromPhone"
                            value={entity.fromPhone}
                        />
                    </EntityCard.Body>
                </>
            )}
        </EntityCard>
    );
});

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/messagingProviders/center/cardView/messagingProviderCard.tsx"),
    withDebug(true, true),
)(MessagingProviderCard);
