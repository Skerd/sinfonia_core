import {LogOut} from "lucide-react";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import ActionMenu from "@coreModule/components/custom/actions/menu/actionMenu.tsx";
import type {UserSession} from "armonia/src/modules/core/api/user/private/userSession/userSession.dto.ts";

export type UserSessionRevokeMenuItemProps = {
    session: UserSession;
    currentDeviceId?: string | null;
    revoking: boolean;
    onRevoke: (s: UserSession) => void;
    resolveLanguageKey: ResolveLanguageKey;
};

/** Shared revoke row for list/card/sheet ActionMenus. */
export function UserSessionRevokeMenuItem({
    session,
    currentDeviceId,
    revoking,
    onRevoke,
    resolveLanguageKey,
}: UserSessionRevokeMenuItemProps) {
    const isCurrentDevice = !!currentDeviceId && session.deviceId === currentDeviceId;
    const isActive = session.isActive;
    const revokeDisabled = !isActive || isCurrentDevice || revoking;

    return (
        <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            disabled={revokeDisabled}
            onSelect={(e) => {
                e.preventDefault();
                if (!revokeDisabled) onRevoke(session);
            }}
        >
            <LogOut className="size-4" />
            <p>{String(resolveLanguageKey("revoke"))}</p>
        </DropdownMenuItem>
    );
}

export type UserSessionActionMenuProps = {
    session: UserSession;
    currentDeviceId?: string | null;
    revoking: boolean;
    onRevoke: (s: UserSession) => void;
    onAction: (action: string) => void;
    resolveLanguageKey: ResolveLanguageKey;
    alwaysShowDropDownMenuTrigger?: boolean;
};

/**
 * Revoke in custom section; view/delete/restore come from the shared {@link ActionMenu}.
 */
export default function UserSessionActionMenu({
    session,
    currentDeviceId,
    revoking,
    onRevoke,
    onAction,
    resolveLanguageKey,
    alwaysShowDropDownMenuTrigger,
}: UserSessionActionMenuProps) {
    const isCurrentDevice = !!currentDeviceId && session.deviceId === currentDeviceId;

    return (
        <ActionMenu
            accessModel="userSessions"
            deletedData={session}
            onAction={onAction}
            editPath=""
            allowMenuForCustomChildren
            hideEdit
            hideDelete={isCurrentDevice}
            alwaysShowDropDownMenuTrigger={alwaysShowDropDownMenuTrigger}
        >
            <UserSessionRevokeMenuItem
                session={session}
                currentDeviceId={currentDeviceId}
                revoking={revoking}
                onRevoke={onRevoke}
                resolveLanguageKey={resolveLanguageKey}
            />
        </ActionMenu>
    );
}
