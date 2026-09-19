import {CheckCircle2, Clock, Globe2, MonitorSmartphone, XCircle} from "lucide-react";
import type {ResolveLanguageKey} from "@baseModule/helpers/hocs/withLanguage.tsx";
import {accessFieldPathExists} from "@baseModule/helpers/context/accessContext.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import type {LoginHistory} from "armonia/src/modules/core/api/user/private/loginHistory/loginHistory.dto.ts";
import LoginHistorySheetView from "@coreModule/clients/panel/private/accountSettings/security/loginHistory/center/sheetView/loginHistorySheetView.tsx";
import DisplayRow from "@coreModule/components/custom/displayValue/displayRow.tsx";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import EntityCard from "@coreModule/components/custom/cards/entityCard.tsx";

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
            shellClassName={(row) => (row.deletedAt != null ? "opacity-80" : undefined)}
        >
            {({entity: row, read}) => {
                const can = (k: string) => accessFieldPathExists(read, k);
                const location = [row.geolocation?.city, row.geolocation?.country].filter(Boolean).join(", ");
                const deviceLine = [row.device, row.os, row.browser].filter(Boolean).join(" · ");
                const rowIsSuccess = row.status === "success";

                return (
                    <>
                        <EntityCard.Header
                            titlePath="status"
                            title={resolveLanguageKey(rowIsSuccess ? "status.success" : "status.failure")}
                            icon={
                                <div
                                    className={cn(
                                        "flex size-7 shrink-0 items-center justify-center rounded-full",
                                        rowIsSuccess ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
                                    )}
                                >
                                    {rowIsSuccess ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
                                </div>
                            }
                            badges={
                                can("status") && (
                                    <>
                                        <Badge variant={rowIsSuccess ? "secondary" : "destructive"} className="h-5 px-1.5 text-3xs">
                                            {resolveLanguageKey(rowIsSuccess ? "badge.success" : "badge.failure")}
                                        </Badge>
                                        {can("mfa") && row.mfa && (
                                            <Badge variant="outline" className="h-5 px-1.5 text-3xs">
                                                {resolveLanguageKey("badge.mfa")}
                                            </Badge>
                                        )}
                                    </>
                                )
                            }
                        />
                        <EntityCard.Body>
                            <DisplayRow
                                icon={Clock}
                                label={resolveLanguageKey("time")}
                                tooltip={resolveLanguageKey("time")}
                                show={can("time")}
                                type="dateTime"
                                value={row.time}
                            />
                            <DisplayRow
                                icon={Globe2}
                                label={resolveLanguageKey("location")}
                                tooltip={resolveLanguageKey("location")}
                                show={can("ip") || can("geolocation")}
                                value={location || row.ip || resolveLanguageKey("unknownLocation")}
                            />
                            <DisplayRow
                                icon={MonitorSmartphone}
                                label={resolveLanguageKey("device")}
                                tooltip={resolveLanguageKey("device")}
                                show={can("device") || can("os") || can("browser")}
                                value={deviceLine || "—"}
                            />
                            <DisplayRow
                                label={resolveLanguageKey("reason")}
                                tooltip={resolveLanguageKey("reason")}
                                show={can("reason")}
                                value={row.reason}
                            >
                                {(formatted) => (
                                    <span className="rounded border border-border/60 bg-muted/50 px-2 py-0.5 text-3xs leading-snug">
                                        {formatted}
                                    </span>
                                )}
                            </DisplayRow>
                        </EntityCard.Body>
                    </>
                );
            }}
        </EntityCard>
    );
}
