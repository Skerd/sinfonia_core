import {useSelector} from "react-redux";
import {Link} from "react-router-dom";
import {NotificationType} from "armonia/src/modules/core/api/user/private/notifications/notifications.dto.ts";
import {cn} from "@coreModule/components/lib/utils.ts";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import CustomDateDisplayer from "@coreModule/components/custom/customDateDisplayer.tsx";
import {notificationLink, notificationMessage} from "@coreModule/helpers/moduleContributions/loadNotificationTypesContributions.ts";

export type NotificationListItemProps = {
    notification: NotificationType;
    resolveLanguageKey: ResolveLanguageKey;
    className?: string;
    /** Called when the row is followed to its page, e.g. to close the bell's popover. */
    onOpen?: () => void;
};

/**
 * Shared row for bell popover and notification center: sender + relative date on one line,
 * body clamped below. Unread rows get a primary accent and a leading status dot.
 *
 * The body is the code's message in the reader's language, filled with the stored params (D117); a code no module
 * declares (core and not-yet-converted modules) shows the stored English description. A code that declares a `link`
 * opens its page (D145).
 */
export function NotificationRow({notification, resolveLanguageKey, className, onOpen}: NotificationListItemProps) {
    const unread = !notification.readOn;
    const {timezone} = useSelector((state: RootState) => state.authentication.user);
    const languageCode = useSelector((state: RootState) => state.language.languageCode);
    const sender = notification.sender?.username ?? resolveLanguageKey("system");
    const body = notificationMessage(notification, languageCode) || notification.description || notification.code;
    const link = notificationLink(notification, languageCode);

    const row = (
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
    if (!link) return row;
    return (
        <Link to={link} onClick={onOpen} className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:[&>article]:bg-accent/20">
            {row}
        </Link>
    );
}
