import {NotificationType} from "armonia/src/modules/core/api/user/private/notifications/notifications.dto.ts";
import {cn} from "@coreModule/components/lib/utils.ts";
import type {ResolveLanguageKey} from "@baseModule/helpers/hocs/withLanguage.tsx";
import {DATE_FORMATS, formatDate} from "@baseModule/helpers/general/dateTime.ts";

export type NotificationListItemProps = {
    notification: NotificationType;
    resolveLanguageKey: ResolveLanguageKey;
};

/** Relative time for notification rows (`justNow` / `Nm` / `Nh` / locale date). */
function formatNotificationDate(dateStr: string, resolveLanguageKey: ResolveLanguageKey): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return resolveLanguageKey("justNow");
    if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        const template = resolveLanguageKey("minutesAgo", true);
        const unit = resolveLanguageKey("minutesAgoUnit", true);
        return (typeof template === "string" ? template.replace("{}", String(mins)) : null)
            ?? (typeof unit === "string" ? `${mins}${unit}` : null)
            ?? formatDate(d, {format: DATE_FORMATS.date});
    }
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        const template = resolveLanguageKey("hoursAgo", true);
        const unit = resolveLanguageKey("hoursAgoUnit", true);
        return (typeof template === "string" ? template.replace("{}", String(hours)) : null)
            ?? (typeof unit === "string" ? `${hours}${unit}` : null)
            ?? formatDate(d, {format: DATE_FORMATS.date});
    }
    return formatDate(d, {format: DATE_FORMATS.date});
}

/**
 * Shared row for bell popover and notification center: compact padding, clear vertical rhythm.
 */
export function NotificationListItem({notification, resolveLanguageKey}: NotificationListItemProps) {
    const unread = !notification.readOn;
    return (
        <article
            className={cn(
                "rounded-md border border-border/80 px-3 py-2 transition-colors",
                unread && "border-primary/20 bg-accent/10"
            )}
        >
            <div className="flex min-w-0 flex-col gap-0.5">
                <p className="truncate text-sm font-medium leading-snug text-foreground">
                    {notification.sender?.username ?? resolveLanguageKey("system")}
                </p>
                <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                    {notification.description ?? notification.code}
                </p>
                <time className="pt-0.5 text-2xs tabular-nums leading-none text-muted-foreground/90">
                    {formatNotificationDate(notification.date, resolveLanguageKey)}
                </time>
            </div>
        </article>
    );
}
