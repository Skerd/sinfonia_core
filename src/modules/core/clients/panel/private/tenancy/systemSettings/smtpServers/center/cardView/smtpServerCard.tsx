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
import {Mail, Server} from "lucide-react";
import SmtpServerSheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/smtpServers/center/sheetView/smtpServerSheetView.tsx";
import DeleteAction from "@coreModule/components/custom/actions/deleteAction.tsx";
import type {DeletedData, SingleForm} from "armonia/src/modules/core/types/shared.types.ts";
import RestoreAction from "@coreModule/components/custom/actions/restoreAction.tsx";
import ActionMenu from "@coreModule/components/custom/actions/menu/actionMenu.tsx";
import TestSmtpConnection from "@coreModule/clients/panel/private/tenancy/systemSettings/smtpServers/center/actions/testSmtpConnection.tsx";
import TestSmtpConnectionDialog from "@coreModule/components/custom/smtpServers/testSmtpConnectionDialog.tsx";
import type {SmtpServer} from "armonia/src/modules/core/api/auxiliary/private/smtpServer/smtpServer.dto.ts";
import {smtpServerEditPath} from "@coreModule/clients/panel/private/tenancy/systemSettings/smtpServers";
import {useEntityCard} from "@coreModule/helpers/hooks/useEntityCard.ts";
import {EntityCardShell} from "@coreModule/components/custom/cards/EntityCardShell.tsx";
import {EntityTextCardHeader} from "@coreModule/components/custom/cards/EntityTextCardHeader.tsx";
import {EntityCardFetchGuard} from "@coreModule/components/custom/cards/EntityCardFetchGuard.tsx";
import {CARD_BODY_CLASS} from "@coreModule/components/custom/cards/entityCard.constants.ts";

type SmtpServerCardProps = WithLanguageType & WithAxiosType<SmtpServer, SingleForm> & {
    smtpServer: SmtpServer;
    fetchId?: string;
    hideActions?: boolean;
    onDelete?: (deleted?: SmtpServer, response?: DeletedData) => void;
    onRestore?: () => void;
    sheetOnly?: boolean;
    small?: boolean;
};

const SmtpServerCard = memo(function SmtpServerCard({
    smtpServer: smtpServerProp,
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
}: SmtpServerCardProps) {
    const {
        action,
        setAction,
        entity: smtpServer,
        setEntity: setSmtpServer,
        hideAfterDeletion,
        onDelete,
        onRestore,
    } = useEntityCard({
        entityProp: smtpServerProp,
        onDeleteProp,
        onRestoreProp,
        syncPropOnChange: !fetchId,
    });
    const [forceReload, setForceReload] = useState(1);

    const {read, restore} = useAccess("smtpServers");

    useEffect(() => {
        if (fetchId) onFilterChange({_id: fetchId});
    }, [fetchId, forceReload]);

    useImperativeHandle(innerRef, () => ({
        success: (data: SmtpServer) => setSmtpServer(data),
    }));

    if (hideAfterDeletion || !restore) return null;
    if (!read || !Object.keys(read).length) return <HiddenElement />;
    if (!smtpServer) return null;

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
                                <DeletedInfo deletedAt={smtpServer.deletedAt} deletedBy={smtpServer.deletedBy} />
                            )}
                            <div className="w-full min-w-0">
                                <EntityTextCardHeader
                                    title={smtpServer.name ? smtpServer.name : <ValueNotSet />}
                                    showTitle={!!read?.name}
                                    hideActions={hideActions}
                                    actionMenu={
                                        <ActionMenu
                                            accessModel="smtpServers"
                                            deletedData={smtpServer}
                                            onAction={(a: string) => setAction(a)}
                                            editPath={smtpServerEditPath(smtpServer)}
                                            allowMenuForCustomChildren
                                        >
                                            <TestSmtpConnection onAction={(a: string) => setAction(a)} />
                                        </ActionMenu>
                                    }
                                />
                                <div className={CARD_BODY_CLASS}>
                                    <InfoRowGroup>
                                        <InfoRow
                                            icon={Server}
                                            label={resolveLanguageKey("host")}
                                            tooltip={resolveLanguageKey("host")}
                                            show={!!read?.host || !!read?.port}
                                            value={
                                                <div className="flex items-center">
                                                    {read?.host ? (smtpServer.host || <ValueNotSet />) : null}
                                                    {read?.host && read?.port ? <span>:</span> : null}
                                                    {read?.port ? (smtpServer.port != null ? String(smtpServer.port) : <ValueNotSet />) : null}
                                                </div>
                                            }
                                        />
                                        <InfoRow
                                            icon={Mail}
                                            label={resolveLanguageKey("sequence")}
                                            tooltip={resolveLanguageKey("sequence")}
                                            show={!!read?.sequence}
                                            value={
                                                smtpServer.sequence != null ? String(smtpServer.sequence) : <ValueNotSet />
                                            }
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
                            <SmtpServerSheetView
                                open={action === "view"}
                                onOpenChange={() => setAction("")}
                                smtpServer={smtpServer}
                                fetchId={fetchId}
                                onDelete={onDelete}
                                onRestore={onRestore}
                                onSheetRowPatched={(row: SmtpServer) => setSmtpServer(row as SmtpServer)}
                            />
                        )}
                        {action === "delete" && (
                            <DeleteAction
                                accessModel="smtpServers"
                                deleteId={smtpServer._id}
                                openAlert={action === "delete"}
                                name={read?.name && smtpServer.name}
                                confirmName={read?.name && smtpServer.name}
                                onSuccess={onDelete}
                                onCancel={() => setAction("")}
                                url="/api/auxiliary/smtpServer"
                            />
                        )}
                        {action === "restore" && (
                            <RestoreAction
                                accessModel="smtpServers"
                                deleteId={smtpServer._id}
                                openAlert={action === "restore"}
                                name={read?.name && smtpServer.name}
                                confirmName={read?.name && smtpServer.name}
                                onSuccess={onRestore}
                                onCancel={() => setAction("")}
                                url="/api/auxiliary/smtpServer/restore"
                            />
                        )}
                        {action === "testSmtpConnection" && (
                            <TestSmtpConnectionDialog
                                open={action === "testSmtpConnection"}
                                onOpenChange={(o: boolean) => { if (!o) setAction(""); }}
                                smtpServer={smtpServer}
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
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/smtpServers/center/cardView/smtpServerCard.tsx"),
    withAxios<SmtpServer, SingleForm>({
        method: "POST",
        url: "/api/auxiliary/smtpServer/single",
        data: {},
    }, true),
    withDebug(true, true),
)(SmtpServerCard);
