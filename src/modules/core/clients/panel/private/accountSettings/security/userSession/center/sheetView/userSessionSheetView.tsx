import {compose} from "redux";
import withLanguage, {type WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import type {UserSession} from "armonia/src/modules/core/api/user/private/userSession/userSession.dto.ts";
import {UserSessionRevokeMenuItem} from "@coreModule/clients/panel/private/accountSettings/security/userSession/center/actions/userSessionActionMenu.tsx";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";

export type UserSessionSheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    session: UserSession;
    /** Same perspective as the list (`self` vs `others`). */
    viewingSelf: boolean;
    currentDeviceId?: string | null;
    revoking: boolean;
    onRevoke: (s: UserSession) => void;
    onDelete?: (data: DeletedData) => void;
    onRestore?: () => void;
    /** Optional: e.g. ignore "view" when the sheet is already open. */
    onActionMenuAction?: (action: string) => void;
};

function UserSessionSheetView({
    open,
    onOpenChange,
    session,
    viewingSelf,
    currentDeviceId,
    revoking,
    onRevoke,
    onDelete,
    onRestore,
    onActionMenuAction,
    resolveLanguageKey,
}: UserSessionSheetViewOwnProps & WithLanguageType) {
    const access = useAccess("userSessions", viewingSelf ? "self" : "others");
    const viewConfig = useViewConfig("usersessions", "sheet");
    const isCurrentDevice = !!currentDeviceId && session.deviceId === currentDeviceId;

    if (!viewConfig) {
        return null;
    }

    return (
        <SheetViewRenderer
            config={viewConfig}
            data={session}
            open={open}
            onOpenChange={onOpenChange}
            resolveLanguageKey={resolveLanguageKey}
            access={access}
            hideActions={false}
            hideEdit
            hideDelete={isCurrentDevice}
            onDelete={onDelete}
            onRestore={onRestore}
            editPath=""
            showViewInActionMenu
            actionMenuAllowCustomChildren
            onActionMenuAction={onActionMenuAction}
            actionMenuChildren={
                <UserSessionRevokeMenuItem
                    session={session}
                    currentDeviceId={currentDeviceId}
                    revoking={revoking}
                    onRevoke={onRevoke}
                    resolveLanguageKey={resolveLanguageKey}
                />
            }
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/security/userSession/center/sheetView/userSessionSheetView.tsx"),
    withDebug(true, true)
)(UserSessionSheetView);
