import {IconClock, IconWorld, IconDeviceDesktop, IconShieldCheck} from "@tabler/icons-react";
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
import {fillTemplate} from "armonia/src/modules/core/helpers/template.ts";

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
            failedTitle={resolveLanguageKey("failedTitle")}
            failedDescription={resolveLanguageKey("failedDescription")}
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
                // Named by the browser and system ("Chrome on macOS"), not a session UUID (TD-F119); both come from the
                // user agent, so they follow its permission.
                const browserAndOs = accessFieldPathExists(read, "userAgent") && row.browser
                    ? (row.os ? fillTemplate(String(resolveLanguageKey("deviceLabel")), {browser: row.browser, os: row.os}) : row.browser)
                    : "";
                const title = browserAndOs
                    || (canReadDeviceId && row.deviceId)
                    || (canReadSessionId && row.sessionId)
                    || resolveLanguageKey("unknownDevice");

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
                                    <IconShieldCheck className="size-3.5 shrink-0" />
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
                                icon={IconClock}
                                label={resolveLanguageKey("lastActiveAt")}
                                tooltip={resolveLanguageKey("lastActiveAt")}
                                path={"lastActiveAt"}
                                type="dateTime"
                                value={row.lastActiveAt}
                            />
                            {/* A place only when one is known; the IP is its own fact, and the session ID and raw user
                                agent stay on the sheet (TD-F119: "Location: ::1"). */}
                            {location ? (
                                <EntityCardRow
                                    icon={IconWorld}
                                    label={resolveLanguageKey("location")}
                                    tooltip={resolveLanguageKey("location")}
                                    show={canReadGeolocation}
                                    value={location}
                                />
                            ) : null}
                            {ip ? (
                                <EntityCardRow
                                    icon={IconDeviceDesktop}
                                    label={resolveLanguageKey("ipAddress")}
                                    tooltip={resolveLanguageKey("ipAddress")}
                                    show={canReadIp}
                                    value={ip}
                                />
                            ) : null}
                            <EntityCardRow
                                icon={IconClock}
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
