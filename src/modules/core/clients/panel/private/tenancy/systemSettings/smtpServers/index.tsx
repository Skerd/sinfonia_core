import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {IconMailPlus} from "@tabler/icons-react";
import type {SmtpServer} from "armonia/src/modules/core/api/auxiliary/private/smtpServer/smtpServer.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import SmtpServerCard from "@coreModule/clients/panel/private/tenancy/systemSettings/smtpServers/center/cardView/smtpServerCard.tsx";
import SmtpServerSheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/smtpServers/center/sheetView/smtpServerSheetView.tsx";
import TestSmtpConnection from "@coreModule/clients/panel/private/tenancy/systemSettings/smtpServers/center/actions/testSmtpConnection.tsx";
import TestSmtpConnectionDialog from "@coreModule/components/custom/smtpServers/testSmtpConnectionDialog.tsx";
import EntityListPage from "@coreModule/components/entityPage/EntityListPage.tsx";

export function smtpServerEditPath(s: SmtpServer) {
    const params = new URLSearchParams();
    params.set("smtpServerId", s._id);
    if (s.name) params.set("smtpServerName", s.name);
    return `/tenancy/systemSettings/smtpServers/edit?${params.toString()}`;
}

function AllSmtpServers({resolveLanguageKey}: WithLanguageType) {
    return (
        <EntityListPage<SmtpServer>
            apiUrl="/api/auxiliary/smtpServer"
            collectionName="smtpservers"
            accessModel="smtpServers"
            tableConfigKey="smtpservers"
            rowActionMenu={{allowMenuForCustomChildren: true}}
            createPath="/tenancy/systemSettings/smtpServers/create"
            createIcon={<IconMailPlus />}
            createLanguageKey="createSmtpServer"
            buildEditPath={smtpServerEditPath}
            resolveLanguageKey={resolveLanguageKey}
            cardViewClassName="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3"
            renderActionMenuChildren={(_entity, bindRowAction) => (
                <TestSmtpConnection onAction={(a: string) => bindRowAction(a)} />
            )}
            renderSheetActionMenuChildren={(_entity, bindRowAction) => (
                <TestSmtpConnection onAction={(a: string) => bindRowAction(a)} />
            )}
            renderFloatingModals={({action, entity, resetAction, listRef}) => {
                if (action === "testSmtpConnection") {
                    return (
                        <TestSmtpConnectionDialog
                            open={true}
                            onOpenChange={(o: boolean) => { if (!o) resetAction(); }}
                            smtpServer={entity}
                            onTestComplete={() => listRef.current?.refetch?.()}
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
    withDebug(true, true),
)(AllSmtpServers);
