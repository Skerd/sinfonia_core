import {Clock, Globe2, Monitor, ShieldCheck} from "lucide-react";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {accessFieldPathExists} from "@coreModule/helpers/context/accessContext.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import type {UserSession} from "armonia/src/modules/core/api/user/private/userSession/userSession.dto.ts";
import UserSessionSheetView from "@coreModule/clients/panel/private/accountSettings/security/userSession/center/sheetView/userSessionSheetView.tsx";
import {UserSessionRevokeMenuItem} from "@coreModule/clients/panel/private/accountSettings/security/userSession/center/actions/userSessionActionMenu.tsx";
import EntityCardRow from "@coreModule/components/entityPage/list/card/entityCardRow.tsx";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import EntityCard from "@coreModule/components/entityPage/list/card/entityCard.tsx";

function sessionLocation(session: UserSession) {
    const latest = session.geolocation?.[session.geolocation.length - 1];
    return [latest?.city, latest?.country].filter(Boolean).join(", ");
}

export type UserSessionCardProps = {
    session: UserSession;
    currentDeviceId?: string | null;
    timezone?: string;
    revoking: boolean;
    onRevoke: (session: UserSession) => void;
    viewingSelf: boolean;
    resolveLanguageKey: ResolveLanguageKey;
    onDelete?: (session: UserSession, response: DeletedData) => void;
    onRestore?: () => void;
};

/** Translations: parent `.../userSession/index.json`. */
export default function UserSessionCard({
    session,
    currentDeviceId,
    revoking,
    onRevoke,
    resolveLanguageKey,
    viewingSelf,
    onDelete,
    onRestore,
}: UserSessionCardProps) {
    const {read: shellRead, write} = useAccess("userSessions", viewingSelf ? "self" : "others");
    const isCurrentDevice = (row: UserSession) => !!currentDeviceId && row.deviceId === currentDeviceId;
    const canRevoke = accessFieldPathExists(write, "isActive");

    return (
        <EntityCard
            resource="userSessions"
            accessPerspective={viewingSelf ? "self" : "others"}
            entity={session}
            onDelete={onDelete}
            onRestore={onRestore}
            editPath={() => ""}
            hideEdit
            hideDelete={isCurrentDevice}
            Sheet={UserSessionSheetView}
            sheetEntityProp="session"
            sheetProps={() => ({viewingSelf, currentDeviceId, revoking, onRevoke})}
            deleteUrl="/api/user/userSession"
            restoreUrl="/api/user/userSession/restore"
            failedTitle=""
            failedDescription=""
            titlePath="deviceId"
            shellClassName={(row) =>
                accessFieldPathExists(shellRead, "isActive") && !row.isActive ? "opacity-70" : undefined
            }
        >
            {({entity: row, read}) => {
                const canReadActive = accessFieldPathExists(read, "isActive");
                const canReadDeviceId = accessFieldPathExists(read, "deviceId");
                const canReadSessionId = accessFieldPathExists(read, "sessionId");
                const canReadGeolocation = accessFieldPathExists(read, "geolocation");
                const canReadIp = accessFieldPathExists(read, "ipAddress");
                const location = canReadGeolocation ? sessionLocation(row) : "";
                const ip = canReadIp ? row.ipAddress : "";
                const title = canReadDeviceId
                    ? (row.deviceId || resolveLanguageKey("unknownDevice"))
                    : canReadSessionId
                        ? row.sessionId
                        : resolveLanguageKey("unknownDevice");

                return (
                    <>
                        <EntityCard.Header
                            titlePath={["deviceId", "sessionId"]}
                            title={title}
                            icon={
                                <div className={cn(
                                    "flex size-7 shrink-0 items-center justify-center rounded-full",
                                    canReadActive && row.isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
                                )}>
                                    <ShieldCheck className="size-3.5 shrink-0" />
                                </div>
                            }
                            badges={
                                <>
                                    {canReadActive && (
                                        <Badge variant={row.isActive ? "secondary" : "outline"} className="h-5 px-1.5 text-3xs">
                                            {resolveLanguageKey(row.isActive ? "badge.active" : "badge.revoked")}
                                        </Badge>
                                    )}
                                    {canReadDeviceId && isCurrentDevice(row) && (
                                        <Badge variant="default" className="h-5 px-1.5 text-3xs">
                                            {resolveLanguageKey("badge.current")}
                                        </Badge>
                                    )}
                                </>
                            }
                        >
                            {canRevoke && (
                                <UserSessionRevokeMenuItem
                                    session={row}
                                    currentDeviceId={currentDeviceId}
                                    revoking={revoking}
                                    onRevoke={onRevoke}
                                    resolveLanguageKey={resolveLanguageKey}
                                />
                            )}
                        </EntityCard.Header>
                        <EntityCard.Body>
                            <EntityCardRow
                                icon={Clock}
                                label={resolveLanguageKey("lastActiveAt")}
                                tooltip={resolveLanguageKey("lastActiveAt")}
                                path={"lastActiveAt"}
                                type="dateTime"
                                value={row.lastActiveAt}
                            />
                            <EntityCardRow
                                icon={Globe2}
                                label={resolveLanguageKey("location")}
                                tooltip={resolveLanguageKey("location")}
                                show={canReadIp || canReadGeolocation}
                                value={location || ip || resolveLanguageKey("unknownLocation")}
                            />
                            <EntityCardRow
                                icon={Monitor}
                                label={resolveLanguageKey("sessionId")}
                                tooltip={resolveLanguageKey("sessionId")}
                                path={"sessionId"}
                                value={row.sessionId}
                            >
                                {(formatted) => (
                                    <span className="line-clamp-1 font-mono text-3xs" title={row.sessionId}>
                                        {formatted}
                                    </span>
                                )}
                            </EntityCardRow>
                            <EntityCardRow
                                icon={Monitor}
                                label={resolveLanguageKey("userAgent")}
                                tooltip={resolveLanguageKey("userAgent")}
                                path={"userAgent"}
                                value={row.userAgent || resolveLanguageKey("unknown")}
                            >
                                {(formatted) => (
                                    <span className="line-clamp-1 text-3xs" title={row.userAgent || undefined}>
                                        {formatted}
                                    </span>
                                )}
                            </EntityCardRow>
                            <EntityCardRow
                                icon={Clock}
                                label={resolveLanguageKey("expiresAt")}
                                tooltip={resolveLanguageKey("expiresAt")}
                                path={"expiresAt"}
                                type="dateTime"
                                value={row.expiresAt}
                            />
                        </EntityCard.Body>
                    </>
                );
            }}
        </EntityCard>
    );
}
