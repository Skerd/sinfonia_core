import {Clock, Globe2, Monitor, ShieldCheck} from "lucide-react";
import type {ResolveLanguageKey} from "@baseModule/helpers/hocs/withLanguage.tsx";
import {accessFieldPathExists} from "@baseModule/helpers/context/accessContext.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import type {UserSession} from "armonia/src/modules/core/api/user/private/userSession/userSession.dto.ts";
import UserSessionSheetView from "@coreModule/clients/panel/private/accountSettings/security/userSession/center/sheetView/userSessionSheetView.tsx";
import {UserSessionRevokeMenuItem} from "@coreModule/clients/panel/private/accountSettings/security/userSession/center/actions/userSessionActionMenu.tsx";
import EntityCardRow from "@baseModule/components/entityPage/list/card/entityCardRow.tsx";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import EntityCard from "@baseModule/components/entityPage/list/card/entityCard.tsx";

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
    const isCurrentDevice = (row: UserSession) => !!currentDeviceId && row.deviceId === currentDeviceId;

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
            shellClassName={(row) => (!row.isActive ? "opacity-70" : undefined)}
        >
            {({entity: row, read}) => {
                const can = (k: string) => accessFieldPathExists(read, k);
                const isActive = row.isActive;
                const location = sessionLocation(row);
                const rowIsCurrentDevice = isCurrentDevice(row);

                const title =
                    can("deviceId")
                        ? (row.deviceId || resolveLanguageKey("unknownDevice"))
                        : can("sessionId")
                            ? row.sessionId
                            : resolveLanguageKey("unknownDevice");

                return (
                    <>
                        <EntityCard.Header
                            titlePath={["deviceId", "sessionId"]}
                            title={title}
                            icon={
                                <div
                                    className={cn(
                                        "flex size-7 shrink-0 items-center justify-center rounded-full",
                                        isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
                                    )}
                                >
                                    <ShieldCheck className="size-3.5 shrink-0" />
                                </div>
                            }
                            badges={
                                <>
                                    <Badge variant={isActive ? "secondary" : "outline"} className="h-5 px-1.5 text-3xs">
                                        {resolveLanguageKey(isActive ? "badge.active" : "badge.revoked")}
                                    </Badge>
                                    {rowIsCurrentDevice && (
                                        <Badge variant="default" className="h-5 px-1.5 text-3xs">
                                            {resolveLanguageKey("badge.current")}
                                        </Badge>
                                    )}
                                </>
                            }
                        >
                            <UserSessionRevokeMenuItem
                                session={row}
                                currentDeviceId={currentDeviceId}
                                revoking={revoking}
                                onRevoke={onRevoke}
                                resolveLanguageKey={resolveLanguageKey}
                            />
                        </EntityCard.Header>
                        <EntityCard.Body>
                            <EntityCardRow
                                icon={Clock}
                                label={resolveLanguageKey("lastActiveAt")}
                                tooltip={resolveLanguageKey("lastActiveAt")}
                                show={can("lastActiveAt")}
                                type="dateTime"
                                value={row.lastActiveAt}
                            />
                            <EntityCardRow
                                icon={Globe2}
                                label={resolveLanguageKey("location")}
                                tooltip={resolveLanguageKey("location")}
                                show={can("ipAddress") || can("geolocation")}
                                value={location || row.ipAddress || resolveLanguageKey("unknownLocation")}
                            />
                            <EntityCardRow
                                icon={Monitor}
                                label={resolveLanguageKey("sessionId")}
                                tooltip={resolveLanguageKey("sessionId")}
                                show={can("sessionId")}
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
                                show={can("userAgent")}
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
                                show={can("expiresAt")}
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
