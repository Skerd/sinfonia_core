import {CheckCircle2, Clock, Globe2, MonitorSmartphone, XCircle} from "lucide-react";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import type {LoginHistory} from "armonia/src/modules/core/api/user/private/loginHistory/loginHistory.dto.ts";
import LoginHistoryActionMenu from "@coreModule/clients/panel/private/accountSettings/security/loginHistory/center/actions/loginHistoryActionMenu.tsx";
import DeletedInfo from "@coreModule/components/custom/deletedInfo";

function formatDate(value: string | undefined, timezone: string | undefined) {
    if (!value) return "";
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: timezone || undefined,
    }).format(new Date(value));
}

export type LoginHistoryCardProps = {
    entry: LoginHistory;
    resolveLanguageKey: ResolveLanguageKey;
    timezone?: string;
    /** Mirrors list page: `useAccess(..., !specificUserId ? "self" : "others")`. */
    viewingSelf: boolean;
    onMenuAction: (action: string) => void;
};

/**
 * `group` enables the row ActionMenu ⋮ to appear on card hover. List copy: `.../loginHistory/index.json`.
 * Sheet copy: `.../sheetView/loginHistorySheetView.json`.
 */
export default function LoginHistoryCard({entry, resolveLanguageKey, timezone, viewingSelf, onMenuAction}: LoginHistoryCardProps) {
    const {read} = useAccess("loginHistories", viewingSelf ? "self" : "others");
    const isSuccess = entry.status === "success";
    const location = [entry.geolocation?.city, entry.geolocation?.country].filter(Boolean).join(", ");
    const deviceLine = [entry.device, entry.os, entry.browser].filter(Boolean).join(" · ");
    const r = read as Record<string, object | undefined> | boolean | null;

    if (!read || (typeof r === "object" && r !== null && !Object.keys(r).length)) {
        return <HiddenElement />;
    }

    const can = (k: string) => typeof r === "object" && r !== null && k in r;

    return (
        <div
            className={cn(
                "group overflow-hidden rounded-lg border bg-card text-sm shadow-sm",
                entry.deletedAt != null && "border-l-4 border-l-muted-foreground/60 opacity-80"
            )}
        >
            <div className="flex w-full items-stretch">
                {(can("deletedBy") || can("deletedAt")) && (
                    <DeletedInfo
                        deletedAt={entry.deletedAt}
                        deletedBy={entry.deletedBy}
                    />
                )}
                <div className="min-w-0 flex-1 p-2.5">
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2">
                    <div
                        className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-full",
                            isSuccess ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
                        )}
                    >
                        {isSuccess ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                        {can("status") && (
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-medium">
                                    {resolveLanguageKey(isSuccess ? "status.success" : "status.failure")}
                                </span>
                                <Badge variant={isSuccess ? "secondary" : "destructive"} className="h-5 px-1.5 text-[10px]">
                                    {resolveLanguageKey(isSuccess ? "badge.success" : "badge.failure")}
                                </Badge>
                                {can("mfa") && entry.mfa && (
                                    <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                                        {resolveLanguageKey("badge.mfa")}
                                    </Badge>
                                )}
                            </div>
                        )}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                            {can("time") && (
                                <span className="inline-flex items-center gap-0.5">
                                    <Clock className="size-3 shrink-0" />
                                    {formatDate(entry.time, timezone)}
                                </span>
                            )}
                            {(can("ip") || can("geolocation")) && (
                                <span className="inline-flex min-w-0 items-center gap-0.5">
                                    <Globe2 className="size-3 shrink-0" />
                                    <span className="truncate">{location || entry.ip || resolveLanguageKey("unknownLocation")}</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex shrink-0 items-start gap-1">
                    <LoginHistoryActionMenu entry={entry} onAction={onMenuAction} />
                </div>
            </div>

            {(can("device") || can("os") || can("browser") || (can("reason") && entry.reason)) && (
                <div className="mt-1.5 space-y-1 border-t border-border/60 pt-1.5 text-[11px] text-muted-foreground">
                    {(can("device") || can("os") || can("browser")) && (
                        <div className="flex items-center gap-1">
                            <MonitorSmartphone className="size-3 shrink-0" />
                            <span className="min-w-0 truncate">{deviceLine || "—"}</span>
                        </div>
                    )}
                    {can("reason") && entry.reason && (
                        <div className="rounded border border-border/60 bg-muted/50 px-2 py-0.5 text-[10px] leading-snug">
                            {resolveLanguageKey("reason")}: {entry.reason}
                        </div>
                    )}
                </div>
            )}
                </div>
            </div>
        </div>
    );
}
