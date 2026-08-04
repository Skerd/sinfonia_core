import {CheckCircle2, Clock, Globe2, MonitorSmartphone, XCircle} from "lucide-react";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import type {LoginHistory} from "armonia/src/modules/core/api/user/private/loginHistory/loginHistory.dto.ts";
import LoginHistoryActionMenu from "@coreModule/clients/panel/private/accountSettings/security/loginHistory/center/actions/loginHistoryActionMenu.tsx";
import DeletedInfo from "@coreModule/components/custom/deletedInfo";
import InfoRow from "@coreModule/components/custom/infoRow.tsx";
import {InfoRowGroup} from "@coreModule/components/custom/infoRowGroup.tsx";
import {EntityCardShell} from "@coreModule/components/custom/cards/EntityCardShell.tsx";
import {EntityTextCardHeader} from "@coreModule/components/custom/cards/EntityTextCardHeader.tsx";
import {CARD_BODY_CLASS} from "@coreModule/components/custom/cards/entityCard.constants.ts";

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
        <EntityCardShell
            disableClick
            className={cn(entry.deletedAt != null && "opacity-80")}
        >
            <div className="flex w-full items-stretch">
                {(can("deletedBy") || can("deletedAt")) && (
                    <DeletedInfo
                        deletedAt={entry.deletedAt}
                        deletedBy={entry.deletedBy}
                    />
                )}
                <div className="w-full min-w-0">
                    <EntityTextCardHeader
                        iconTile={
                            <div
                                className={cn(
                                    "flex size-7 shrink-0 items-center justify-center rounded-full",
                                    isSuccess ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
                                )}
                            >
                                {isSuccess ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
                            </div>
                        }
                        title={resolveLanguageKey(isSuccess ? "status.success" : "status.failure")}
                        showTitle={can("status")}
                        badges={
                            <>
                                <Badge variant={isSuccess ? "secondary" : "destructive"} className="h-5 px-1.5 text-3xs">
                                    {resolveLanguageKey(isSuccess ? "badge.success" : "badge.failure")}
                                </Badge>
                                {can("mfa") && entry.mfa && (
                                    <Badge variant="outline" className="h-5 px-1.5 text-3xs">
                                        {resolveLanguageKey("badge.mfa")}
                                    </Badge>
                                )}
                            </>
                        }
                        showBadges={can("status")}
                        actionMenu={<LoginHistoryActionMenu entry={entry} onAction={onMenuAction} />}
                    />
                    <div className={CARD_BODY_CLASS}>
                        <InfoRowGroup>
                            <InfoRow
                                icon={Clock}
                                label={resolveLanguageKey("time")}
                                tooltip={resolveLanguageKey("time")}
                                show={can("time")}
                                value={formatDate(entry.time, timezone)}
                            />
                            <InfoRow
                                icon={Globe2}
                                label={resolveLanguageKey("location")}
                                tooltip={resolveLanguageKey("location")}
                                show={can("ip") || can("geolocation")}
                                value={location || entry.ip || resolveLanguageKey("unknownLocation")}
                            />
                            <InfoRow
                                icon={MonitorSmartphone}
                                label={resolveLanguageKey("device")}
                                tooltip={resolveLanguageKey("device")}
                                show={can("device") || can("os") || can("browser")}
                                value={deviceLine || "—"}
                            />
                            <InfoRow
                                label={resolveLanguageKey("reason")}
                                tooltip={resolveLanguageKey("reason")}
                                show={can("reason") && !!entry.reason}
                                value={
                                    entry.reason ? (
                                        <span className="rounded border border-border/60 bg-muted/50 px-2 py-0.5 text-3xs leading-snug">
                                            {entry.reason}
                                        </span>
                                    ) : null
                                }
                            />
                        </InfoRowGroup>
                    </div>
                </div>
            </div>
        </EntityCardShell>
    );
}
