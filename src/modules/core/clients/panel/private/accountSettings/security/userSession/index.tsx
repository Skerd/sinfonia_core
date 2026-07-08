import {compose} from "redux";
import {useMemo, useRef, useState} from "react";
import {useSelector} from "react-redux";
import {toast} from "sonner";
import {KeyRound} from "lucide-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import withHidden from "@coreModule/helpers/hocs/withHidden.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {getDeviceId} from "@coreModule/helpers/context/localStorage/authenticationStorage.ts";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";
import CardAndTableView from "@coreModule/components/custom/cardAndTableView.tsx";
import TitleWithCollapse from "@coreModule/components/custom/titleWithCollapse.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import DeleteAction from "@coreModule/components/custom/actions/deleteAction.tsx";
import RestoreAction from "@coreModule/components/custom/actions/restoreAction.tsx";
import UserSessionCard from "@coreModule/clients/panel/private/accountSettings/security/userSession/center/cardView/userSessionCard.tsx";
import UserSessionActionMenu from "@coreModule/clients/panel/private/accountSettings/security/userSession/center/actions/userSessionActionMenu.tsx";
import UserSessionSheetView from "@coreModule/clients/panel/private/accountSettings/security/userSession/center/sheetView/userSessionSheetView.tsx";
import type {DeletedData, TableForm, TableResponse} from "armonia/src/modules/core/types/shared.types.ts";
import type {UserSession} from "armonia/src/modules/core/api/user/private/userSession/userSession.dto.ts";
import type {UserSessionFormType} from "armonia/src/modules/core/api/user/private/userSession/userSession.form.type.ts";

type UserAccountSecurityUserSessionProps = WithLanguageType & {
    specificUserId?: string;
};

function UserAccountSecurityUserSession({specificUserId, resolveLanguageKey}: UserAccountSecurityUserSessionProps) {
    const {id: currentUserId, timezone} = useSelector((state: RootState) => state.authentication.user);
    const {read} = useAccess("userSessions", !specificUserId ? "self" : "others");
    const currentDeviceId = getDeviceId();
    const targetUserId = specificUserId ?? currentUserId;
    const viewingSelf = !specificUserId;
    const listRef = useRef<{
        refetch: () => void;
        updateRow: (id: string | number, patch: Partial<UserSession>) => void;
    } | null>(null);
    const [revokingId, setRevokingId] = useState<string | null>(null);
    const [rowMenuAction, setRowMenuAction] = useState("");
    const [sheetSession, setSheetSession] = useState<UserSession | null>(null);

    const extraParams = useMemo(
        () => ({
            userId: targetUserId,
            specificUser: specificUserId ?? undefined,
        }),
        [specificUserId, targetUserId]
    );

    const rowMenu = (a: string, session: UserSession) => {
        if (a === "delete" && viewingSelf && !!currentDeviceId && session.deviceId === currentDeviceId) {
            return;
        }
        setRowMenuAction(a);
        setSheetSession(session);
    };

    const closeSheet = () => {
        setRowMenuAction("");
        setSheetSession(null);
    };

    const closeAction = () => {
        setRowMenuAction("");
    };

    const onDelete = (data: DeletedData) => {
        if (!sheetSession?._id) return;
        const patch = {
            deletedAt: data.deletedAt,
            deletedBy: data.deletedBy,
        };
        listRef.current?.updateRow(sheetSession._id, patch);
        setSheetSession((prev) => (prev ? {...prev, ...patch} : prev));
        setRowMenuAction("");
    };

    const onRestore = () => {
        if (!sheetSession?._id) return;
        const patch = {
            deletedAt: undefined,
            deletedBy: undefined,
        };
        listRef.current?.updateRow(sheetSession._id, patch);
        setSheetSession((prev) => (prev ? {...prev, ...patch} : prev));
        setRowMenuAction("");
    };

    const revokeSession = async (session: UserSession) => {
        if (!session.isActive || revokingId) return;
        setRevokingId(session._id);
        try {
            await apiClient.post("/api/user/userSession/revoke", {
                _id: session._id,
                specificUser: specificUserId ?? undefined,
            });
            listRef.current?.updateRow(session._id, {isActive: false});
            setSheetSession((prev) => (prev?._id === session._id ? {...prev, isActive: false} : prev));
            toast.success(resolveLanguageKey("revokeSuccess"));
        } catch {
            toast.error(resolveLanguageKey("revokeError"));
        } finally {
            setRevokingId(null);
        }
    };

    if (!targetUserId || !read || !Object.keys(read).length) {
        return <HiddenElement />;
    }

    return (
        <TitleWithCollapse
            title={resolveLanguageKey("title")}
            description={resolveLanguageKey("description")}
            defaultOpen={false}
        >
            <div className="mb-2 flex items-start gap-1.5 rounded-lg border border-border/60 bg-muted/40 p-2 text-xs text-muted-foreground">
                <KeyRound className="mt-0.5 size-3.5 shrink-0" />
                <span>{resolveLanguageKey("helperText")}</span>
            </div>
            <CardAndTableView<TableResponse<UserSession>, TableForm & UserSessionFormType>
                url="/api/user/userSession"
                tableConfigKey="usersessions"
                access="userSessions"
                selfAccess={!specificUserId}
                tableConfigOptions={{
                    filterConfig: {
                        placeholder: resolveLanguageKey("searchPlaceholder"),
                        fields: resolveLanguageKey("fields"),
                    },
                }}
                extraParams={extraParams}
                configurations={{limit: 8}}
                containersClassName={{
                    cardViewClassName: "grid grid-cols-1 gap-2",
                    scrollRootClassName: "max-h-[min(440px,55vh)]",
                }}
                listRef={listRef}
                renderFunctions={{
                    cardRender: (session) => (
                        <UserSessionCard
                            session={session}
                            currentDeviceId={viewingSelf ? currentDeviceId : null}
                            timezone={timezone}
                            revoking={revokingId === session._id}
                            onRevoke={revokeSession}
                            onMenuAction={(a) => {
                                rowMenu(a, session);
                            }}
                            resolveLanguageKey={resolveLanguageKey}
                            viewingSelf={viewingSelf}
                        />
                    ),
                    action: (session) => (
                        <UserSessionActionMenu
                            session={session}
                            currentDeviceId={viewingSelf ? currentDeviceId : null}
                            revoking={revokingId === session._id}
                            onRevoke={revokeSession}
                            onAction={(a) => {
                                rowMenu(a, session);
                            }}
                            resolveLanguageKey={resolveLanguageKey}
                        />
                    ),
                }}
            />

            {rowMenuAction === "view" && sheetSession && (
                <UserSessionSheetView
                    open={rowMenuAction === "view"}
                    onOpenChange={(open: boolean) => {
                        if (!open) {
                            closeSheet();
                        }
                    }}
                    session={sheetSession}
                    viewingSelf={viewingSelf}
                    currentDeviceId={viewingSelf ? currentDeviceId : null}
                    revoking={revokingId === sheetSession._id}
                    onRevoke={revokeSession}
                    onDelete={onDelete}
                    onRestore={onRestore}
                />
            )}
            {rowMenuAction === "delete" && sheetSession && !(viewingSelf && !!currentDeviceId && sheetSession.deviceId === currentDeviceId) && (
                <DeleteAction
                    accessModel="userSessions"
                    deleteId={sheetSession._id}
                    openAlert={rowMenuAction === "delete"}
                    name={sheetSession.deviceId || sheetSession.sessionId}
                    confirmName={sheetSession.deviceId || sheetSession.sessionId}
                    onSuccess={onDelete}
                    onCancel={closeAction}
                    url="/api/user/userSession"
                />
            )}
            {rowMenuAction === "restore" && sheetSession && (
                <RestoreAction
                    accessModel="userSessions"
                    deleteId={sheetSession._id}
                    openAlert={rowMenuAction === "restore"}
                    name={sheetSession.deviceId || sheetSession.sessionId}
                    confirmName={sheetSession.deviceId || sheetSession.sessionId}
                    onSuccess={onRestore}
                    onCancel={closeAction}
                    url="/api/user/userSession/restore"
                />
            )}
        </TitleWithCollapse>
    );
}

export default compose(
    withHidden(),
    withLanguage("src/modules/core/clients/panel/private/accountSettings/security/userSession/index.tsx"),
    withDebug(true, true)
)(UserAccountSecurityUserSession);
