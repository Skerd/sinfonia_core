import {useCallback, useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {compose} from "redux";
import {Bell} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {Popover, PopoverContent, PopoverTrigger} from "@coreModule/components/ui/popover.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import MarkAllAsReadButton from "@coreModule/clients/panel/private/accountSettings/notificationCenter/markAllAsReadButton.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {NotificationListItem} from "@coreModule/components/custom/notificationListItem.tsx";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";
import {
    setNotificationItems,
    setNotificationNumber,
    setNotificationsLoading
} from "@coreModule/helpers/redux/slices/notificationSlice.ts";
import {
    NotificationType
} from "armonia/src/modules/core/api/user/private/notifications/notifications.dto.ts";
import {
    UnreadNotificationsFormResponseType
} from "armonia/src/modules/core/api/user/private/notifications/unreadNotifications.form.response.type.ts";
import {TableResponse} from "armonia/src/modules/core/types/shared.types.ts";

type NotificationBellProps = WithLanguageType & {}

function NotificationBell({
    resolveLanguageKey,
}: NotificationBellProps) {

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [open, setOpen] = useState(false);
    const {unreadNotifications, items} = useSelector((state: RootState) => state.notifications);

    const refreshNotifications = useCallback(async () => {
        dispatch(setNotificationsLoading(true));
        try {
            const [unreadResponse, listResponse] = await Promise.all([
                apiClient.get<UnreadNotificationsFormResponseType>("/api/user/notifications/unread-count"),
                apiClient.post<TableResponse<NotificationType>>("/api/user/notifications", {
                    offset: 0,
                    limit: 10
                })
            ]);
            dispatch(setNotificationNumber(unreadResponse.data.unreadNotifications));
            dispatch(setNotificationItems(listResponse.data.data ?? []));
        } catch {
            // The bell should not break the shell if notifications are temporarily unavailable.
        } finally {
            dispatch(setNotificationsLoading(false));
        }
    }, [dispatch]);

    useEffect(() => {
        refreshNotifications();
    }, [refreshNotifications]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {
                        unreadNotifications > 0 &&
                        <span
                            className={cn(
                                "absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground",
                                unreadNotifications > 99 && "px-1"
                            )}
                        >
                            {unreadNotifications > 99 ? "99+" : unreadNotifications}
                        </span>
                    }
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[min(22rem,calc(100vw-1.5rem))] p-0 shadow-md"
                align="end"
                sideOffset={8}
            >
                <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
                    <h3 className="text-sm font-semibold leading-none">{resolveLanguageKey("title")}</h3>
                    <MarkAllAsReadButton inPopover={true} />
                </div>

                <div className="flex max-h-[min(70vh,21rem)] flex-col gap-2 overflow-y-auto px-3 py-2.5">
                    {
                        items?.length === 0 ?
                        <div className="flex flex-col items-center justify-center gap-2 py-6">
                            <p className="px-2 text-center text-sm text-muted-foreground">
                                {resolveLanguageKey("noNotifications")}
                            </p>
                            <svg
                                className="opacity-80"
                                width="96"
                                height="96"
                                viewBox="0 0 140 140"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M70 30 C50 30 42 45 42 62 V85 C42 92 40 96 36 100 C44 96 48 102 52 100 C56 98 60 104 64 100 C68 98 72 104 76 100 C80 98 84 104 88 100 C92 98 96 102 104 100 C100 96 98 92 98 85 V62 C98 45 90 30 70 30Z"
                                    // fill="#FFFFFF"
                                    stroke="#9CA3AF"
                                    strokeWidth="2"
                                    strokeLinejoin="round"
                                />
                                <circle cx="70" cy="90" r="4" fill="#9CA3AF"/>
                                <circle cx="60" cy="65" r="3" fill="#9CA3AF"/>
                                <circle cx="80" cy="65" r="3" fill="#9CA3AF"/>
                                <path d="M60 80C65 75 75 75 80 80" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                                <circle cx="95" cy="40" r="5" fill="#9CA3AF"/>
                            </svg>
                        </div>
                        :
                        <>
                            {items.map((notification) => (
                                <NotificationListItem
                                    key={notification._id}
                                    notification={notification}
                                    resolveLanguageKey={resolveLanguageKey}
                                />
                            ))}
                        </>
                    }
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
    withLanguage("src/modules/core/components/custom/notificationBell/index.tsx"),
    withDebug(true, true)
)(NotificationBell);
