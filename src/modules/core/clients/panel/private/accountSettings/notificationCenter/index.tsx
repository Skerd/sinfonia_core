import {useEffect, useState, useCallback} from "react";
import {useDispatch} from "react-redux";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";
import {setNotificationNumber} from "@coreModule/helpers/redux/slices/notificationSlice.ts";
import Header from "@coreModule/components/custom/header.tsx";
import {Switch} from "@coreModule/components/ui/switch.tsx";
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {NotificationType} from "armonia/src/modules/core/api/user/private/notifications/notifications.dto.ts";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {ListNotificationsFormType} from "armonia/src/modules/core/api/user/private/notifications/listNotifications.form.type.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import InfiniteList from "@coreModule/components/custom/infiniteList";
import MarkAllAsReadButton from "@coreModule/clients/panel/private/accountSettings/notificationCenter/markAllAsReadButton.tsx";
import {NotificationListItem} from "@coreModule/components/custom/notificationListItem.tsx";
import {
    UnreadNotificationsFormResponseType
} from "armonia/src/modules/core/api/user/private/notifications/unreadNotifications.form.response.type.ts";
import {TableResponse} from "armonia/src/modules/core/types/shared.types.ts";

const PAGE_SIZE = 20;

type NotificationCenterProps = WithLanguageType & WithAxiosType<TableResponse<NotificationType>, ListNotificationsFormType> & {}

function NotificationCenter({
    resolveLanguageKey,
    loading,
    error,
    data,
    onFilterChange
}: NotificationCenterProps) {

    const dispatch = useDispatch();
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await apiClient.get<UnreadNotificationsFormResponseType>("/api/user/notifications/unread-count");
            dispatch(setNotificationNumber(res.data.unreadNotifications));
        } catch {
            // Ignore
        }
    }, [dispatch]);

    useEffect(() => {
        fetchUnreadCount();
    }, [fetchUnreadCount]);

    return (
        <div className="flex flex-1 flex-col gap-3 overflow-hidden">

            <Header
                title={resolveLanguageKey("title")}
                description={resolveLanguageKey("description")}
            >
                <div className="flex shrink-0 items-center justify-end gap-2 sm:justify-between">
                    <TooltipDisplayer tooltip={resolveLanguageKey("unreadOnly")}>
                        <label className="flex items-center flex-col md:flex-row gap-2 cursor-pointer">
                            <Switch
                                checked={unreadOnly}
                                onCheckedChange={setUnreadOnly}
                            />
                            <span className="text-sm hidden md:block">{resolveLanguageKey("unreadOnly")}</span>
                        </label>
                    </TooltipDisplayer>
                    <MarkAllAsReadButton onMarkedAllRead={() => setReloadKey((value) => value + 1)} />
                </div>
            </Header>

            <InfiniteList<NotificationType>
                data={data}
                loading={loading}
                error={error}
                onFilterChange={onFilterChange}
                limit={PAGE_SIZE}
                forceReload={reloadKey}
                extraParams={{ unreadOnly }}
                className="flex flex-col gap-2 pb-1"
                scrollRootClassName="flex-1 min-h-0 overflow-y-auto px-0.5 pb-3 pt-1"
                renderItem={(notification) => (
                    <NotificationListItem
                        key={notification._id}
                        notification={notification}
                        resolveLanguageKey={resolveLanguageKey}
                    />
                )}
                renderError={({onRetry}) => (
                    <SimpleError
                        title={resolveLanguageKey("failTitle")}
                        description={resolveLanguageKey("failDescription")}
                        onClick={onRetry}
                    />
                )}
                renderNoData={() => (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                        {resolveLanguageKey("noNotifications")}
                    </div>
                )}
            />
        </div>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/notificationCenter/index.tsx"),
    withAxios(
        {
            method: "POST",
            url: "/api/user/notifications",
            data: {}
        },
        true
    ),
    withDebug(true, true)
)(NotificationCenter);
