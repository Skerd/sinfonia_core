import {compose} from "redux";
import {useMemo, useState} from "react";
import {useSelector} from "react-redux";
import {toast} from "sonner";
import {KeyRound} from "lucide-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import {hasCardRead} from "@coreModule/components/entityPage/list/card/entityCard.tsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {getDeviceId} from "@coreModule/helpers/context/localStorage/authenticationStorage.ts";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import EntityListPage from "@coreModule/components/entityPage/pages/entityListPage.tsx";
import TitleWithCollapse from "@coreModule/components/custom/titleWithCollapse.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import UserSessionCard from "@coreModule/clients/panel/private/accountSettings/security/userSession/center/cardView/userSessionCard.tsx";
import UserSessionSheetView from "@coreModule/clients/panel/private/accountSettings/security/userSession/center/sheetView/userSessionSheetView.tsx";
import {UserSessionRevokeMenuItem} from "@coreModule/clients/panel/private/accountSettings/security/userSession/center/actions/userSessionActionMenu.tsx";
import type {UserSession} from "armonia/src/modules/core/api/user/private/userSession/userSession.dto.ts";

type UserAccountSecurityUserSessionProps = WithLanguageType & {
    specificUserId?: string;
};

function UserAccountSecurityUserSession({specificUserId, resolveLanguageKey}: UserAccountSecurityUserSessionProps) {
    const {id: currentUserId, timezone} = useSelector((state: RootState) => state.authentication.user);
    const {read} = useAccess("userSessions", !specificUserId ? "self" : "others");
    const currentDeviceId = getDeviceId();
    const targetUserId = specificUserId ?? currentUserId;
    const viewingSelf = !specificUserId;
    const [revokingId, setRevokingId] = useState<string | null>(null);

    const extraParams = useMemo(
        () => ({
            userId: targetUserId,
            specificUser: specificUserId ?? undefined,
        }),
        [specificUserId, targetUserId]
    );

    const isCurrentDevice = (session: UserSession) =>
        viewingSelf && !!currentDeviceId && session.deviceId === currentDeviceId;

    const revokeSession = async (session: UserSession) => {
        if (!session.isActive || revokingId) return;
        setRevokingId(session._id);
        try {
            await apiClient.post("/api/user/userSession/revoke", {
                _id: session._id,
                specificUser: specificUserId ?? undefined,
            });
            toast.success(resolveLanguageKey("revokeSuccess"));
        } catch {
            toast.error(resolveLanguageKey("revokeError"));
        } finally {
            setRevokingId(null);
        }
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
                        revoking={revokingId === session._id}
                        onRevoke={revokeSession}
                        resolveLanguageKey={resolveLanguageKey}
                    />
                )}
                renderCard={(session, onDelete, onRestore) => (
                    <UserSessionCard
                        session={session}
                        currentDeviceId={viewingSelf ? currentDeviceId : null}
                        timezone={timezone}
                        revoking={revokingId === session._id}
                        onRevoke={revokeSession}
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
                        revoking={revokingId === entity._id}
                        onRevoke={revokeSession}
                        open={open}
                        onOpenChange={onOpenChange}
                        onDelete={onDelete}
                        onRestore={onRestore}
                    />
                )}
            />
        </TitleWithCollapse>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/security/userSession/index.tsx"),
    withDebug(true, true, "userSessions")
)(UserAccountSecurityUserSession);
