import {Clock, Globe2, ShieldCheck} from "lucide-react";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import type {UserSession} from "armonia/src/modules/core/api/user/private/userSession/userSession.dto.ts";
import UserSessionActionMenu from "@coreModule/clients/panel/private/accountSettings/security/userSession/center/actions/userSessionActionMenu.tsx";
import DeletedInfo from "@coreModule/components/custom/deletedInfo";

function formatDate(value: string | undefined, timezone: string | undefined) {
    if (!value) return "";
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: timezone || undefined,
    }).format(new Date(value));
}

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
    timezone,
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

    return (
        <div
            className={cn(
                "group overflow-hidden rounded-lg border bg-card text-sm shadow-sm",
                !isActive && "opacity-70",
                session.deletedAt != null && "border-l-4 border-l-muted-foreground/60"
            )}
        >
            <div className="flex w-full items-stretch">
                {(can("deletedBy") || can("deletedAt")) && (
                    <DeletedInfo
                        deletedAt={session.deletedAt}
                        deletedBy={session.deletedBy}
                    />
                )}
                <div className="min-w-0 flex-1 p-2.5">
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-start gap-2">
                    <div
                        className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-full",
                            isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                        )}
                    >
                        <ShieldCheck className="size-3.5 shrink-0" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                        {(can("deviceId") || can("sessionId")) && (
                            <div className="flex flex-wrap items-center gap-1.5">
                                <p className="max-w-full truncate text-xs font-medium" title={session.sessionId}>
                                    {can("deviceId")
                                        ? (session.deviceId || resolveLanguageKey("unknownDevice"))
                                        : can("sessionId")
                                            ? session.sessionId
                                            : resolveLanguageKey("unknownDevice")}
                                </p>
                                <Badge variant={isActive ? "secondary" : "outline"} className="h-5 px-1.5 text-[10px]">
                                    {resolveLanguageKey(isActive ? "badge.active" : "badge.revoked")}
                                </Badge>
                                {isCurrentDevice && (
                                    <Badge variant="default" className="h-5 px-1.5 text-[10px]">
                                        {resolveLanguageKey("badge.current")}
                                    </Badge>
                                )}
                            </div>
                        )}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                            {can("lastActiveAt") && (
                                <span className="inline-flex items-center gap-0.5">
                                    <Clock className="size-3 shrink-0" />
                                    {formatDate(session.lastActiveAt, timezone)}
                                </span>
                            )}
                            {(can("ipAddress") || can("geolocation")) && (
                                <span className="inline-flex min-w-0 items-center gap-0.5">
                                    <Globe2 className="size-3 shrink-0" />
                                    <span className="truncate">
                                        {location || session.ipAddress || resolveLanguageKey("unknownLocation")}
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex shrink-0 items-start">
                    <UserSessionActionMenu
                        session={session}
                        currentDeviceId={currentDeviceId}
                        revoking={revoking}
                        onRevoke={onRevoke}
                        onAction={onMenuAction}
                        resolveLanguageKey={resolveLanguageKey}
                    />
                </div>
            </div>

            {(can("sessionId") || can("userAgent") || can("expiresAt")) && (
                <div className="mt-1.5 space-y-0.5 border-t border-border/60 pt-1.5 text-[10px] leading-tight text-muted-foreground">
                    {can("sessionId") && (
                        <p className="line-clamp-1 font-mono" title={session.sessionId}>
                            {resolveLanguageKey("sessionId")}: {session.sessionId}
                        </p>
                    )}
                    {can("userAgent") && (
                        <p className="line-clamp-1" title={session.userAgent || undefined}>
                            {resolveLanguageKey("userAgent")}: {session.userAgent || resolveLanguageKey("unknown")}
                        </p>
                    )}
                    {can("expiresAt") && (
                        <p>
                            {resolveLanguageKey("expiresAt")}: {formatDate(session.expiresAt, timezone)}
                        </p>
                    )}
                </div>
            )}
                </div>
            </div>
        </div>
    );
}
