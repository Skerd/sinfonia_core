import {NotificationType} from "armonia/src/modules/core/api/user/private/notifications/notifications.dto.ts";
import {cn} from "@coreModule/components/lib/utils.ts";
import {notificationDateFormatter} from "@coreModule/helpers/general";

export type NotificationListItemProps = {
    notification: NotificationType;
    resolveLanguageKey: (key: string) => string;
};

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
                <time className="pt-0.5 text-[11px] tabular-nums leading-none text-muted-foreground/90">
                    {notificationDateFormatter(notification.date, resolveLanguageKey)}
                </time>
            </div>
        </article>
    );
}
