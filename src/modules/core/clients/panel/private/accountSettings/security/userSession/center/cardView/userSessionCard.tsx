import {Clock, Globe2, Monitor, ShieldCheck} from "lucide-react";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import type {UserSession} from "armonia/src/modules/core/api/user/private/userSession/userSession.dto.ts";
import UserSessionActionMenu from "@coreModule/clients/panel/private/accountSettings/security/userSession/center/actions/userSessionActionMenu.tsx";
import DeletedInfo from "@coreModule/components/custom/deletedInfo";
import DisplayRow from "@coreModule/components/custom/displayValue/displayRow.tsx";
import {InfoRowGroup} from "@coreModule/components/custom/infoRowGroup.tsx";
import {EntityCardShell} from "@coreModule/components/custom/cards/EntityCardShell.tsx";
import {EntityTextCardHeader} from "@coreModule/components/custom/cards/EntityTextCardHeader.tsx";
import {CARD_BODY_CLASS} from "@coreModule/components/custom/cards/entityCard.constants.ts";

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
    onMenuAction: (action: string) => void;
    viewingSelf: boolean;
    resolveLanguageKey: ResolveLanguageKey;
};

/**
 * `group` enables the row ActionMenu ⋮ to appear on card hover. Translations: parent `.../userSession/index.json`.
 */
export default function UserSessionCard({
    session,
    currentDeviceId,
    revoking,
    onRevoke,
    onMenuAction,
    resolveLanguageKey,
    viewingSelf,
}: UserSessionCardProps) {
    const {read} = useAccess("userSessions", viewingSelf ? "self" : "others");
    const isCurrentDevice = !!currentDeviceId && session.deviceId === currentDeviceId;
    const isActive = session.isActive;
    const location = sessionLocation(session);
    const r = read as Record<string, object | undefined> | boolean | null;

    if (!read || (typeof r === "object" && r !== null && !Object.keys(r).length)) {
        return <HiddenElement />;
    }

    const can = (k: string) => typeof r === "object" && r !== null && k in r;

    const title =
        can("deviceId")
            ? (session.deviceId || resolveLanguageKey("unknownDevice"))
            : can("sessionId")
                ? session.sessionId
                : resolveLanguageKey("unknownDevice");

    return (
        <EntityCardShell
            disableClick
            className={cn(!isActive && "opacity-70")}
        >
            <div className="flex w-full items-stretch">
                {(can("deletedBy") || can("deletedAt")) && (
                    <DeletedInfo
                        deletedAt={session.deletedAt}
                        deletedBy={session.deletedBy}
                    />
                )}
                <div className="w-full min-w-0">
                    <EntityTextCardHeader
                        iconTile={
                            <div
                                className={cn(
                                    "flex size-7 shrink-0 items-center justify-center rounded-full",
                                    isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
                                )}
                            >
                                <ShieldCheck className="size-3.5 shrink-0" />
                            </div>
                        }
                        title={title}
                        showTitle={!!(can("deviceId") || can("sessionId"))}
                        badges={
                            <>
                                <Badge variant={isActive ? "secondary" : "outline"} className="h-5 px-1.5 text-3xs">
                                    {resolveLanguageKey(isActive ? "badge.active" : "badge.revoked")}
                                </Badge>
                                {isCurrentDevice && (
                                    <Badge variant="default" className="h-5 px-1.5 text-3xs">
                                        {resolveLanguageKey("badge.current")}
                                    </Badge>
                                )}
                            </>
                        }
                        showBadges={!!(can("deviceId") || can("sessionId"))}
                        actionMenu={
                            <UserSessionActionMenu
                                session={session}
                                currentDeviceId={currentDeviceId}
                                revoking={revoking}
                                onRevoke={onRevoke}
                                onAction={onMenuAction}
                                resolveLanguageKey={resolveLanguageKey}
                            />
                        }
                    />
                    <div className={CARD_BODY_CLASS}>
                        <InfoRowGroup>
                            <DisplayRow
                                icon={Clock}
                                label={resolveLanguageKey("lastActiveAt")}
                                tooltip={resolveLanguageKey("lastActiveAt")}
                                show={can("lastActiveAt")}
                                type="dateTime"
                                value={session.lastActiveAt}
                            />
                            <DisplayRow
                                icon={Globe2}
                                label={resolveLanguageKey("location")}
                                tooltip={resolveLanguageKey("location")}
                                show={can("ipAddress") || can("geolocation")}
                                value={location || session.ipAddress || resolveLanguageKey("unknownLocation")}
                            />
                            <DisplayRow
                                icon={Monitor}
                                label={resolveLanguageKey("sessionId")}
                                tooltip={resolveLanguageKey("sessionId")}
                                show={can("sessionId")}
                                value={session.sessionId}
                            >
                                {(formatted) => (
                                    <span className="line-clamp-1 font-mono text-3xs" title={session.sessionId}>
                                        {formatted}
                                    </span>
                                )}
                            </DisplayRow>
                            <DisplayRow
                                icon={Monitor}
                                label={resolveLanguageKey("userAgent")}
                                tooltip={resolveLanguageKey("userAgent")}
                                show={can("userAgent")}
                                value={session.userAgent || resolveLanguageKey("unknown")}
                            >
                                {(formatted) => (
                                    <span className="line-clamp-1 text-3xs" title={session.userAgent || undefined}>
                                        {formatted}
                                    </span>
                                )}
                            </DisplayRow>
                            <DisplayRow
                                icon={Clock}
                                label={resolveLanguageKey("expiresAt")}
                                tooltip={resolveLanguageKey("expiresAt")}
                                show={can("expiresAt")}
                                type="dateTime"
                                value={session.expiresAt}
                            />
                        </InfoRowGroup>
                    </div>
                </div>
            </div>
        </EntityCardShell>
    );
}
