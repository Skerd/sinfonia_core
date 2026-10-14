import {CheckCircle2, Clock, Globe2, MonitorSmartphone, XCircle} from "lucide-react";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {accessFieldPathExists} from "@coreModule/helpers/context/accessContext.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import type {LoginHistory} from "armonia/src/modules/core/api/user/private/loginHistory/loginHistory.dto.ts";
import LoginHistorySheetView from "@coreModule/clients/panel/private/accountSettings/security/loginHistory/center/sheetView/loginHistorySheetView.tsx";
import EntityCardRow from "@coreModule/components/entityPage/list/card/entityCardRow.tsx";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import EntityCard from "@coreModule/components/entityPage/list/card/entityCard.tsx";

export type LoginHistoryCardProps = {
    entry: LoginHistory;
    resolveLanguageKey: ResolveLanguageKey;
    timezone?: string;
    /** Mirrors list page: `useAccess(..., !specificUserId ? "self" : "others")`. */
    viewingSelf: boolean;
    onDelete?: (entry: LoginHistory, response: DeletedData) => void;
    onRestore?: () => void;
};

/**
 * List copy: `.../loginHistory/index.json`. Sheet copy: `.../sheetView/loginHistorySheetView.json`.
 */
export default function LoginHistoryCard({
    entry,
    resolveLanguageKey,
    viewingSelf,
    onDelete,
    onRestore,
}: LoginHistoryCardProps) {
    const {read: shellRead} = useAccess("loginHistories", viewingSelf ? "self" : "others");

    return (
        <EntityCard
            resource="loginHistories"
            accessPerspective={viewingSelf ? "self" : "others"}
            entity={entry}
            onDelete={onDelete}
            onRestore={onRestore}
            editPath={() => ""}
            hideEdit
            Sheet={LoginHistorySheetView}
            sheetEntityProp="entry"
            sheetProps={() => ({viewingSelf})}
            deleteUrl="/api/user/loginHistory"
            restoreUrl="/api/user/loginHistory/restore"
            failedTitle=""
            failedDescription=""
            titlePath="ip"
            shellClassName={(row) =>
                (accessFieldPathExists(shellRead, "deletedAt") || accessFieldPathExists(shellRead, "deletedBy")) && row.deletedAt != null
                    ? "opacity-80"
                    : undefined
            }
        >
            {({entity: row, read}) => {
                const canReadStatus = accessFieldPathExists(read, "status");
                const canReadMfa = accessFieldPathExists(read, "mfa");
                const canReadGeo = accessFieldPathExists(read, "geolocation");
                const canReadIp = accessFieldPathExists(read, "ip");
                const canReadDevice = accessFieldPathExists(read, "device");
                const canReadOs = accessFieldPathExists(read, "os");
                const canReadBrowser = accessFieldPathExists(read, "browser");
                const rowIsSuccess = row.status === "success";
                const location = canReadGeo ? [row.geolocation?.city, row.geolocation?.country].filter(Boolean).join(", ") : "";
                const ip = canReadIp ? row.ip : "";
                const deviceLine = [
                    canReadDevice ? row.device : "",
                    canReadOs ? row.os : "",
                    canReadBrowser ? row.browser : "",
                ].filter(Boolean).join(" · ");

                return (
                    <>
                        <EntityCard.Header
                            titlePath="status"
                            title={canReadStatus ? resolveLanguageKey(rowIsSuccess ? "status.success" : "status.failure") : ""}
                            icon={
                                <div
                                    className={cn(
                                        "flex size-7 shrink-0 items-center justify-center rounded-full",
                                        canReadStatus && rowIsSuccess
                                            ? "bg-success/10 text-success"
                                            : canReadStatus
                                                ? "bg-destructive/10 text-destructive"
                                                : "bg-muted text-muted-foreground",
                                    )}
                                >
                                    {canReadStatus && !rowIsSuccess
                                        ? <XCircle className="size-3.5" />
                                        : canReadStatus
                                            ? <CheckCircle2 className="size-3.5" />
                                            : <MonitorSmartphone className="size-3.5" />}
                                </div>
                            }
                            badges={
                                <>
                                    {canReadStatus && (
                                        <Badge variant={rowIsSuccess ? "secondary" : "destructive"} className="h-5 px-1.5 text-3xs">
                                            {resolveLanguageKey(rowIsSuccess ? "badge.success" : "badge.failure")}
                                        </Badge>
                                    )}
                                    {canReadMfa && row.mfa && (
                                        <Badge variant="outline" className="h-5 px-1.5 text-3xs">
                                            {resolveLanguageKey("badge.mfa")}
                                        </Badge>
                                    )}
                                </>
                            }
                        />
                        <EntityCard.Body>
                            <EntityCardRow
                                icon={Clock}
                                label={resolveLanguageKey("time")}
                                tooltip={resolveLanguageKey("time")}
                                path="time"
                                type="dateTime"
                                value={row.time}
                            />
                            <EntityCardRow
                                icon={Globe2}
                                label={resolveLanguageKey("location")}
                                tooltip={resolveLanguageKey("location")}
                                show={canReadIp || canReadGeo}
                                value={location || ip || resolveLanguageKey("unknownLocation")}
                            />
                            <EntityCardRow
                                icon={MonitorSmartphone}
                                label={resolveLanguageKey("device")}
                                tooltip={resolveLanguageKey("device")}
                                show={canReadDevice || canReadOs || canReadBrowser}
                                value={deviceLine || "—"}
                            />
                            <EntityCardRow
                                label={resolveLanguageKey("reason")}
                                tooltip={resolveLanguageKey("reason")}
                                path="reason"
                                value={row.reason}
                            >
                                {(formatted) => (
                                    <span className="rounded border border-border/60 bg-muted/50 px-2 py-0.5 text-3xs leading-snug">
                                        {formatted}
                                    </span>
                                )}
                            </EntityCardRow>
                        </EntityCard.Body>
                    </>
                );
            }}
        </EntityCard>
    );
}
