import {compose} from "redux";
import {memo, type RefObject} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {accessFieldPathExists} from "@coreModule/helpers/hocs/withAccess.tsx";
import {Mail, Power, Server} from "lucide-react";
import DisplayRow from "@coreModule/components/custom/displayValue/displayRow.tsx";
import DisplayValue from "@coreModule/components/custom/displayValue/displayValue.tsx";
import SmtpServerSheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/smtpServers/center/sheetView/smtpServerSheetView.tsx";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import ActivateSmtpServer from "@coreModule/clients/panel/private/tenancy/systemSettings/smtpServers/center/actions/activateSmtpServer.tsx";
import DeactivateSmtpServer from "@coreModule/clients/panel/private/tenancy/systemSettings/smtpServers/center/actions/deactivateSmtpServer.tsx";
import TestSmtpConnection from "@coreModule/clients/panel/private/tenancy/systemSettings/smtpServers/center/actions/testSmtpConnection.tsx";
import SetSmtpServerActiveDialog from "@coreModule/components/custom/smtpServers/setSmtpServerActiveDialog.tsx";
import TestSmtpConnectionDialog from "@coreModule/components/custom/smtpServers/testSmtpConnectionDialog.tsx";
import type {SmtpServer} from "armonia/src/modules/core/api/auxiliary/private/smtpServer/smtpServer.dto.ts";
import {smtpServerEditPath} from "@coreModule/clients/panel/private/tenancy/systemSettings/smtpServers";
import EntityCard from "@coreModule/components/custom/systemCards/entityCard.tsx";
import type {WithAxiosLifecycleRef} from "@coreModule/helpers/hocs/withAxios.tsx";

type SmtpServerCardProps = WithLanguageType & {
    smtpServer: SmtpServer;
    fetchId?: string;
    hideActions?: boolean;
    onDelete?: (deleted?: SmtpServer, response?: DeletedData) => void;
    onRestore?: () => void;
    sheetOnly?: boolean;
    innerRef?: RefObject<WithAxiosLifecycleRef<SmtpServer> | null>;
};

const SmtpServerCard = memo(function SmtpServerCard({
    smtpServer,
    resolveLanguageKey,
    fetchId,
    hideActions,
    onDelete,
    onRestore,
    sheetOnly = false,
    innerRef,
}: SmtpServerCardProps) {
    return (
        <EntityCard
            resource="smtpServers"
            entity={smtpServer}
            fetchId={fetchId}
            singleUrl="/api/auxiliary/smtpServer/single"
            onDelete={onDelete}
            onRestore={onRestore}
            hideActions={hideActions}
            sheetOnly={sheetOnly}
            editPath={smtpServerEditPath}
            Sheet={SmtpServerSheetView}
            sheetEntityProp="smtpServer"
            deleteUrl="/api/auxiliary/smtpServer"
            restoreUrl="/api/auxiliary/smtpServer/restore"
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
                    {(action === "activateSmtpServer" || action === "deactivateSmtpServer") && (
                        <SetSmtpServerActiveDialog
                            open
                            onOpenChange={(open) => {
                                if (!open) setAction("");
                            }}
                            smtpServer={entity}
                            targetActive={action === "activateSmtpServer"}
                            onSuccess={(server) => {
                                setEntity(server);
                                retry();
                            }}
                        />
                    )}
                    {action === "testSmtpConnection" && (
                        <TestSmtpConnectionDialog
                            open
                            onOpenChange={(open) => {
                                if (!open) setAction("");
                            }}
                            smtpServer={entity}
                            onTestComplete={retry}
                        />
                    )}
                </>
            )}
        >
            {({entity, read, setAction}) => (
                <>
                    <EntityCard.Header titlePath="name" title={entity.name}>
                        <TestSmtpConnection onAction={setAction} />
                        <ActivateSmtpServer smtpServer={entity} onAction={setAction} />
                        <DeactivateSmtpServer smtpServer={entity} onAction={setAction} />
                    </EntityCard.Header>
                    <EntityCard.Body>
                        <DisplayRow
                            icon={Server}
                            label={resolveLanguageKey("host")}
                            tooltip={resolveLanguageKey("host")}
                            show={accessFieldPathExists(read, "host") || accessFieldPathExists(read, "port")}
                            value={
                                <span className="flex items-center">
                                    <DisplayValue path="host" value={entity.host} />
                                    {accessFieldPathExists(read, "host") && accessFieldPathExists(read, "port") ? (
                                        <span>:</span>
                                    ) : null}
                                    <DisplayValue path="port" type="number" value={entity.port} />
                                </span>
                            }
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
                            icon={Mail}
                            label={resolveLanguageKey("sequence")}
                            tooltip={resolveLanguageKey("sequence")}
                            path="sequence"
                            type="number"
                            value={entity.sequence}
                        />
                    </EntityCard.Body>
                </>
            )}
        </EntityCard>
    );
});

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/smtpServers/center/cardView/smtpServerCard.tsx"),
    withDebug(true, true, "smtpServers"),
)(SmtpServerCard);
