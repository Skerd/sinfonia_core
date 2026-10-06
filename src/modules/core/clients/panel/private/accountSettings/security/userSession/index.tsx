import {compose} from "redux";
import {useImperativeHandle, useMemo, useRef, useState} from "react";
import {useSelector} from "react-redux";
import {KeyRound} from "lucide-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import {hasCardRead} from "@coreModule/components/entityPage/list/card/entityCard.tsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {getDeviceId} from "@coreModule/helpers/context/localStorage/authenticationStorage.ts";
import EntityListPage from "@coreModule/components/entityPage/pages/entityListPage.tsx";
import {type EntityListApi} from "@coreModule/components/entityPage/list/cardAndTableView.tsx";
import TitleWithCollapse from "@coreModule/components/custom/titleWithCollapse.tsx";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import UserSessionCard from "@coreModule/clients/panel/private/accountSettings/security/userSession/center/cardView/userSessionCard.tsx";
import UserSessionSheetView from "@coreModule/clients/panel/private/accountSettings/security/userSession/center/sheetView/userSessionSheetView.tsx";
import {UserSessionRevokeMenuItem} from "@coreModule/clients/panel/private/accountSettings/security/userSession/center/actions/userSessionActionMenu.tsx";
import type {UserSession} from "armonia/src/modules/core/api/user/private/userSession/userSession.dto.ts";

type UserAccountSecurityUserSessionProps = WithLanguageType &
    WithAxiosType<{message: string}, {_id: string}> & {
        specificUserId?: string;
    };

function UserAccountSecurityUserSession({
    specificUserId,
    resolveLanguageKey,
    onFilterChange,
    loading,
    innerRef,
}: UserAccountSecurityUserSessionProps) {
    const {id: currentUserId, timezone} = useSelector((state: RootState) => state.authentication.user);
    const {read} = useAccess("userSessions", !specificUserId ? "self" : "others");
    const currentDeviceId = getDeviceId();
    const targetUserId = specificUserId ?? currentUserId;
    const viewingSelf = !specificUserId;
    const [pendingRevoke, setPendingRevoke] = useState<UserSession | null>(null);
    const listApiRef = useRef<EntityListApi<UserSession> | null>(null);

    useImperativeHandle(innerRef, () => ({
        success: () => {
            if (pendingRevoke) {
                listApiRef.current?.updateRow(pendingRevoke._id, {isActive: false});
            }
            setPendingRevoke(null);
        },
    }), [pendingRevoke]);

    const extraParams = useMemo(
        () => ({
            userId: targetUserId,
            specificUser: specificUserId ?? undefined,
        }),
        [specificUserId, targetUserId]
    );

    const isCurrentDevice = (session: UserSession) =>
        viewingSelf && !!currentDeviceId && session.deviceId === currentDeviceId;

    const requestRevoke = (session: UserSession) => {
        if (!session.isActive || loading) return;
        setPendingRevoke(session);
    };

    const confirmRevoke = () => {
        if (!pendingRevoke || loading) return;
        onFilterChange({_id: pendingRevoke._id});
    };

    if (!targetUserId || !hasCardRead(read)) {
        return <HiddenElement />;
    }

    return (
        <TitleWithCollapse
            title={resolveLanguageKey("title")}
            description={resolveLanguageKey("description")}
            defaultOpen={false}
        >
            <div className="flex items-start gap-1.5 rounded-lg border border-border/60 bg-muted/40 p-2 text-xs text-muted-foreground">
                <KeyRound className="mt-0.5 size-3.5 shrink-0" />
                <span>{resolveLanguageKey("helperText")}</span>
            </div>
            <EntityListPage<UserSession>
                apiUrl="/api/user/userSession"
                collectionName="usersessions"
                accessModel="userSessions"
                tableConfigKey="usersessions"
                listApiRef={listApiRef}
                selfAccess={viewingSelf}
                buildEditPath={() => ""}
                resolveLanguageKey={resolveLanguageKey}
                hideHeader
                cardViewClassName="grid grid-cols-1 gap-2"
                scrollRootClassName="max-h-[min(440px,55vh)]"
                configurations={{limit: 8}}
                extraParams={extraParams}
                rowActionMenu={{hideEdit: true, hideDelete: isCurrentDevice}}
                renderActionMenuChildren={(session) => (
                    <UserSessionRevokeMenuItem
                        session={session}
                        currentDeviceId={viewingSelf ? currentDeviceId : null}
                        revoking={loading && pendingRevoke?._id === session._id}
                        onRevoke={requestRevoke}
                        resolveLanguageKey={resolveLanguageKey}
                    />
                )}
                renderCard={(session, onDelete, onRestore) => (
                    <UserSessionCard
                        session={session}
                        currentDeviceId={viewingSelf ? currentDeviceId : null}
                        timezone={timezone}
                        revoking={loading && pendingRevoke?._id === session._id}
                        onRevoke={requestRevoke}
                        resolveLanguageKey={resolveLanguageKey}
                        viewingSelf={viewingSelf}
                        onDelete={(row, response) => onDelete(row, response)}
                        onRestore={() => onRestore(session)}
                    />
                )}
                renderSheet={({entity, open, onOpenChange, onDelete, onRestore}) => (
                    <UserSessionSheetView
                        session={entity}
                        viewingSelf={viewingSelf}
                        currentDeviceId={viewingSelf ? currentDeviceId : null}
                        revoking={loading && pendingRevoke?._id === entity._id}
                        onRevoke={requestRevoke}
                        open={open}
                        onOpenChange={onOpenChange}
                        onDelete={onDelete}
                        onRestore={onRestore}
                    />
                )}
            />
            <ConfirmDialog
                open={!!pendingRevoke}
                onOpenChange={(open: boolean) => {
                    if (!open && !loading) setPendingRevoke(null);
                }}
                title={resolveLanguageKey("revokeDialog.title")}
                desc={resolveLanguageKey("revokeDialog.description")}
                confirmText={resolveLanguageKey("revokeDialog.confirmText")}
                cancelBtnText={resolveLanguageKey("revokeDialog.cancelText")}
                destructive
                isLoading={loading}
                handleConfirm={confirmRevoke}
            />
        </TitleWithCollapse>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/security/userSession/index.tsx"),
    withAxios<{message: string}, {_id: string}>(
        {
            method: "POST",
            url: "/api/user/userSession/revoke",
            data: {},
        },
        true,
    ),
    withDebug(true, true, "userSessions")
)(UserAccountSecurityUserSession);
