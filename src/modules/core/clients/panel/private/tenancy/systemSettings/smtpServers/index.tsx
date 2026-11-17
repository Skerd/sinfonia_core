import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {IconMailPlus} from "@tabler/icons-react";
import type {SmtpServer, TestSmtpConnectionResponse} from "armonia/src/modules/core/api/auxiliary/private/smtpServer/smtpServer.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import SmtpServerCard from "@coreModule/clients/panel/private/tenancy/systemSettings/smtpServers/center/cardView/smtpServerCard.tsx";
import SmtpServerSheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/smtpServers/center/sheetView/smtpServerSheetView.tsx";
import ActivateSmtpServer from "@coreModule/clients/panel/private/tenancy/systemSettings/smtpServers/center/actions/activateSmtpServer.tsx";
import DeactivateSmtpServer from "@coreModule/clients/panel/private/tenancy/systemSettings/smtpServers/center/actions/deactivateSmtpServer.tsx";
import TestSmtpConnection from "@coreModule/clients/panel/private/tenancy/systemSettings/smtpServers/center/actions/testSmtpConnection.tsx";
import SetSmtpServerActiveDialog from "./center/dialogs/setSmtpServerActiveDialog.tsx";
import TestSmtpConnectionDialog from "./center/dialogs/testSmtpConnectionDialog.tsx";
import EntityListPage, {EntityListCreateButton, EntityListHeader} from "@coreModule/components/entityPage/pages/entityListPage.tsx";
import {useIsPlatformCompany} from "@coreModule/helpers/hooks/useIsPlatformCompany.ts";

export function smtpServerEditPath(s: SmtpServer) {
    const params = new URLSearchParams();
    params.set("smtpServerId", s._id);
    if (s.name) params.set("smtpServerName", s.name);
    return `/tenancy/systemSettings/smtpServers/edit?${params.toString()}`;
}

function AllSmtpServers({resolveLanguageKey}: WithLanguageType) {
    // The platform's servers send every company's mail (D161); any other company that sees this page keeps its own
    // servers for the campaigns of a module registered through `platformOnlyUses`, so it reads a different description.
    const isPlatformCompany = useIsPlatformCompany();
    return (
        <EntityListPage<SmtpServer>
            apiUrl="/api/auxiliary/smtpServer"
            collectionName="smtpservers"
            accessModel="smtpServers"
            tableConfigKey="smtpservers"
            rowActionMenu={{allowMenuForCustomChildren: true}}
            header={(ctx) => (
                <EntityListHeader
                    ctx={ctx}
                    description={isPlatformCompany ? undefined : resolveLanguageKey("ownServersDescription")}
                    helpKey={isPlatformCompany ? undefined : "ownServersHelp"}
                >
                    <EntityListCreateButton
                        ctx={ctx}
                        path="/tenancy/systemSettings/smtpServers/create"
                        icon={<IconMailPlus />}
                        labelKey="createSmtpServer"
                    />
                </EntityListHeader>
            )}
            buildEditPath={smtpServerEditPath}
            resolveLanguageKey={resolveLanguageKey}
            renderActionMenuChildren={(_entity, bindRowAction) => (
                <>
                    <TestSmtpConnection onAction={(a: string) => bindRowAction(a)} />
                    <ActivateSmtpServer smtpServer={_entity} onAction={bindRowAction} />
                    <DeactivateSmtpServer smtpServer={_entity} onAction={bindRowAction} />
                </>
            )}
            renderSheetActionMenuChildren={(_entity, bindRowAction) => (
                <>
                    <TestSmtpConnection onAction={(a: string) => bindRowAction(a)} />
                    <ActivateSmtpServer smtpServer={_entity} onAction={bindRowAction} />
                    <DeactivateSmtpServer smtpServer={_entity} onAction={bindRowAction} />
                </>
            )}
            renderFloatingModals={({action, entity, resetAction, listRef}) => {
                if (action === "testSmtpConnection") {
                    return (
                        <TestSmtpConnectionDialog
                            open={true}
                            onOpenChange={(o: boolean) => { if (!o) resetAction(); }}
                            smtpServer={entity}
                            onTestComplete={(lastTest: TestSmtpConnectionResponse) => listRef.current?.updateRow?.(entity._id, lastTest)}
                        />
                    );
                }
                if (action === "activateSmtpServer") {
                    return (
                        <SetSmtpServerActiveDialog
                            open={true}
                            onOpenChange={(o: boolean) => { if (!o) resetAction(); }}
                            smtpServer={entity}
                            targetActive={true}
                            onSuccess={(server: SmtpServer) => listRef.current?.updateRow?.(entity._id, server)}
                        />
                    );
                }
                if (action === "deactivateSmtpServer") {
                    return (
                        <SetSmtpServerActiveDialog
                            open={true}
                            onOpenChange={(o: boolean) => { if (!o) resetAction(); }}
                            smtpServer={entity}
                            targetActive={false}
                            onSuccess={(server: SmtpServer) => listRef.current?.updateRow?.(entity._id, server)}
                        />
                    );
                }
                return null;
            }}
            renderCard={(entity, onDelete, onRestore) => (
                <SmtpServerCard
                    smtpServer={entity}
                    onDelete={(row: SmtpServer | undefined, response?: DeletedData) => onDelete(row, response)}
                    onRestore={() => onRestore(entity)}
                />
            )}
            renderSheet={({entity, open, onOpenChange, onDelete, onRestore, listRef}) => (
                <SmtpServerSheetView
                    open={open}
                    onOpenChange={(opened: boolean) => { if (!opened) onOpenChange(); }}
                    smtpServer={entity}
                    onDelete={onDelete}
                    onRestore={onRestore}
                    onSheetRowPatched={(row: Record<string, unknown>) => {
                        listRef.current?.updateRow?.(entity._id, row as Partial<SmtpServer>);
                    }}
                />
            )}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/smtpServers/index.tsx"),
    withDebug(true, true, "smtpServers"),
)(AllSmtpServers);
