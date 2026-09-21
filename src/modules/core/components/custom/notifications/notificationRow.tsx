import {useSelector} from "react-redux";
import {NotificationType} from "armonia/src/modules/core/api/user/private/notifications/notifications.dto.ts";
import {cn} from "@coreModule/components/lib/utils.ts";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import CustomDateDisplayer from "@coreModule/components/custom/customDateDisplayer.tsx";

export type NotificationListItemProps = {
    notification: NotificationType;
    resolveLanguageKey: ResolveLanguageKey;
    className?: string;
};

/**
 * Shared row for bell popover and notification center: sender + relative date on one line,
 * body clamped below. Unread rows get a primary accent and a leading status dot.
 */
export function NotificationRow({notification, resolveLanguageKey, className}: NotificationListItemProps) {
    const unread = !notification.readOn;
    const {timezone} = useSelector((state: RootState) => state.authentication.user);
    const sender = notification.sender?.username ?? resolveLanguageKey("system");
    const body = notification.description ?? notification.code;

    return (
        <article
            className={cn(
                "rounded-md border border-border/80 px-3 py-2 transition-colors",
                unread && "border-primary/20 bg-accent/10",
                className,
            )}
            aria-label={unread ? `${sender}: ${body}` : undefined}
        >
            <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
                    <p className="flex min-w-0 items-center gap-1.5 truncate text-sm font-medium leading-snug text-foreground">
                        {unread && (
                            <span
                                aria-hidden
                                className="size-1.5 shrink-0 rounded-full bg-primary"
                            />
                        )}
                        <span className="truncate">{sender}</span>
                    </p>
                    <CustomDateDisplayer
                        date={notification.date}
                        timeZone={timezone}
                        showOnlyYesterday
                        showOnlyWeekDay
                        className="shrink-0 text-muted-foreground"
                    />
                </div>
                <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                    {body}
                </p>
            </div>
        </article>
    );
}
