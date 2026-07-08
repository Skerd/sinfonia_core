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
    small = false,
}: SmtpServerCardProps) {
    const [action, setAction] = useState("");
    const [smtpServer, setSmtpServer] = useState<SmtpServer>(smtpServerProp);
    const [hideAfterDeletion, setHideAfterDeletion] = useState(false);
    const [forceReload, setForceReload] = useState(1);

    const {read, restore} = useAccess("smtpServers");

    const onDelete = (data: DeletedData) => {
        if (!data.deletedBy && !data.deletedAt) {
            setHideAfterDeletion(true);
        } else if (onDeleteProp) {
            onDeleteProp(smtpServer, data);
        } else {
            setSmtpServer({...smtpServer, ...data});
        }
    };

    const onRestore = () => {
        if (onRestoreProp) {
            onRestoreProp();
        } else {
            setSmtpServer({
                ...smtpServer,
                deletedAt: undefined,
                deletedBy: undefined,
            });
        }
    };

    useEffect(() => {
        if (!fetchId) setSmtpServer(smtpServerProp);
    }, [fetchId, smtpServerProp]);

    useEffect(() => {
        if (fetchId) onFilterChange({_id: fetchId});
    }, [fetchId, forceReload]);

    useImperativeHandle(innerRef, () => ({
        success: (data: SmtpServer) => setSmtpServer(data),
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
    if (!smtpServer) return null;

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
                            <DeletedInfo deletedAt={smtpServer.deletedAt} deletedBy={smtpServer.deletedBy} />
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
                                            smtpServer.name ? (
                                                <TooltipDisplayer tooltip={resolveLanguageKey("name")}>
                                                    <div className={cn("font-semibold leading-tight", small ? "text-sm" : "text-base")}>
                                                        {smtpServer.name}
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
                                            accessModel="smtpServers"
                                            deletedData={smtpServer}
                                            onAction={(a: string) => setAction(a)}
                                            editPath={smtpServerEditPath(smtpServer)}
                                            allowMenuForCustomChildren
                                        >
                                            <TestSmtpConnection onAction={(a: string) => setAction(a)} />
                                        </ActionMenu>
                                    </div>
                                )}
                            </div>
                            <div className={cn("space-y-2 text-sm pt-0", small ? "px-3" : "px-4")}>
                                <InfoRow
                                    icon={Server}
                                    label={resolveLanguageKey("host")}
                                    tooltip={resolveLanguageKey("host")}
                                    value={`${smtpServer.host}:${smtpServer.port}`}
                                />
                                <InfoRow
                                    icon={Mail}
                                    label={resolveLanguageKey("sequence")}
                                    tooltip={resolveLanguageKey("sequence")}
                                    value={String(smtpServer.sequence)}
                                />
                            </div>
                        </div>
                    </div>
                </Card>
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
