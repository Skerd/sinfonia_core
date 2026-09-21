import {useCallback, useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {compose} from "redux";
import {Bell, BellOff} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {Popover, PopoverContent, PopoverTrigger} from "@coreModule/components/ui/popover.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Skeleton} from "@coreModule/components/ui/skeleton.tsx";
import {RootState} from "@baseModule/helpers/redux/store/generalStore.ts";
import withLanguage, {WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";
import MarkAllAsReadButton from "@coreModule/clients/panel/private/accountSettings/notificationCenter/markAllAsReadButton.tsx";
import withDebug from "@baseModule/helpers/hocs/withDebug.tsx";
import {NotificationRow} from "@baseModule/components/custom/notifications/notificationRow.tsx";
import apiClient from "@baseModule/helpers/apiClient/apiClient.ts";
import {
    setNotificationItems,
    setNotificationNumber,
    setNotificationsLoading,
} from "@baseModule/helpers/redux/slices/notificationSlice.ts";
import {NotificationType} from "armonia/src/modules/core/api/user/private/notifications/notifications.dto.ts";
import {
    UnreadNotificationsFormResponseType,
} from "armonia/src/modules/core/api/user/private/notifications/unreadNotifications.form.response.type.ts";
import {TableResponse} from "armonia/src/modules/core/types/shared.types.ts";

const PREVIEW_LIMIT = 10;

function NotificationBell({resolveLanguageKey}: WithLanguageType) {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [open, setOpen] = useState(false);
    const {unreadNotifications, items, loading} = useSelector((state: RootState) => state.notifications);

    const refreshNotifications = useCallback(async () => {
        dispatch(setNotificationsLoading(true));
        try {
            const [unreadResponse, listResponse] = await Promise.all([
                apiClient.get<UnreadNotificationsFormResponseType>("/api/user/notifications/unread-count"),
                apiClient.post<TableResponse<NotificationType>>("/api/user/notifications", {
                    offset: 0,
                    limit: PREVIEW_LIMIT,
                }),
            ]);
            dispatch(setNotificationNumber(unreadResponse.data.unreadNotifications));
            dispatch(setNotificationItems(listResponse.data.data ?? []));
        } catch {
            // The shell must stay usable if notifications are briefly unavailable.
        } finally {
            dispatch(setNotificationsLoading(false));
        }
    }, [dispatch]);

    // Badge count on mount; list refresh again when the popover opens.
    useEffect(() => {
        void refreshNotifications();
    }, [refreshNotifications]);

    const badge = unreadNotifications > 99 ? "99+" : String(unreadNotifications);
    const triggerLabel =
        unreadNotifications > 0
            ? `${resolveLanguageKey("title")} (${badge})`
            : resolveLanguageKey("title");

    const handleOpenChange = (next: boolean) => {
        setOpen(next);
        if (next) void refreshNotifications();
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label={triggerLabel}
                >
                    <Bell className="size-5" aria-hidden />
                    {unreadNotifications > 0 && (
                        <span
                            className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-3xs font-medium text-primary-foreground"
                            aria-hidden
                        >
                            {badge}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className="w-[min(22rem,calc(100vw-1.5rem))] p-0 shadow-md"
                align="end"
                sideOffset={8}
            >
                <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
                    <h3 className="text-sm font-semibold leading-none">
                        {resolveLanguageKey("title")}
                    </h3>
                    <MarkAllAsReadButton inPopover />
                </div>

                <div className="flex max-h-[min(70vh,21rem)] flex-col gap-2 overflow-y-auto px-3 py-2.5">
                    {loading && items.length === 0 ? (
                        <div
                            className="flex flex-col gap-2"
                            aria-busy
                            aria-label={resolveLanguageKey("loading")}
                        >
                            {Array.from({length: 3}, (_, index) => (
                                <div
                                    key={index}
                                    className="space-y-2 rounded-md border border-border/80 px-3 py-2"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-10" />
                                    </div>
                                    <Skeleton className="h-3 w-4/5" />
                                </div>
                            ))}
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-8">
                            <BellOff
                                className="size-10 text-muted-foreground/50"
                                strokeWidth={1.25}
                                aria-hidden
                            />
                            <p className="px-2 text-center text-sm text-muted-foreground">
                                {resolveLanguageKey("noNotifications")}
                            </p>
                        </div>
                    ) : (
                        items.map((notification) => (
                            <NotificationRow
                                key={notification._id}
                                notification={notification}
                                resolveLanguageKey={resolveLanguageKey}
                            />
                        ))
                    )}
                </div>

                <div className="border-t px-2 py-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-full text-xs"
                        onClick={() => {
                            navigate("/account/notificationCenter");
                            setOpen(false);
                        }}
                    >
                        {resolveLanguageKey("viewAll")}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/notifications/notificationBell.tsx"),
    withDebug(true, true),
)(NotificationBell);
