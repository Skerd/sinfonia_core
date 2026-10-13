import {useEffect, useState, useCallback} from "react";
import {useDispatch} from "react-redux";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import {setNotificationNumber} from "@coreModule/helpers/redux/slices/notificationSlice.ts";
import {Separator} from "@coreModule/components/ui/separator.tsx";
import {Switch} from "@coreModule/components/ui/switch.tsx";
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {NotificationType} from "armonia/src/modules/core/api/user/private/notifications/notifications.dto.ts";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {ListNotificationsFormType} from "armonia/src/modules/core/api/user/private/notifications/listNotifications.form.type.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import SimpleError from "@coreModule/components/custom/errors/errorViewWrapper.tsx";
import InfiniteList from "@coreModule/components/custom/infiniteList";
import MarkAllAsReadButton from "@coreModule/clients/panel/private/accountSettings/notificationCenter/markAllAsReadButton.tsx";
import {NotificationRow} from "@coreModule/components/custom/notifications/notificationRow.tsx";
import {
    UnreadNotificationsFormResponseType
} from "armonia/src/modules/core/api/user/private/notifications/unreadNotifications.form.response.type.ts";
import {TableResponse} from "armonia/src/modules/core/types/shared.types.ts";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import Forbidden from "@coreModule/components/custom/pages/forbidden.tsx";

const PAGE_SIZE = 20;

type NotificationCenterProps = WithLanguageType & WithAxiosType<TableResponse<NotificationType>, ListNotificationsFormType> & {
    specificUserId?: string;
}

function NotificationCenter({
    resolveLanguageKey,
    loading,
    error,
    data,
    onFilterChange,
    specificUserId,
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
        if (specificUserId) return;
        fetchUnreadCount();
    }, [fetchUnreadCount, specificUserId]);

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex flex-none flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h3 className="text-lg font-medium">{resolveLanguageKey("title")}</h3>
                    <p className="text-sm text-muted-foreground">{resolveLanguageKey("description")}</p>
                </div>
                <div className="flex shrink-0 items-center justify-end gap-2">
                    <TooltipDisplayer tooltip={resolveLanguageKey("unreadOnly")}>
                        <label className="flex cursor-pointer flex-col items-center gap-2 md:flex-row">
                            <Switch
                                checked={unreadOnly}
                                onCheckedChange={setUnreadOnly}
                            />
                            <span className="hidden text-sm md:block">{resolveLanguageKey("unreadOnly")}</span>
                        </label>
                    </TooltipDisplayer>
                    {!specificUserId && (
                        <MarkAllAsReadButton onMarkedAllRead={() => setReloadKey((value) => value + 1)} />
                    )}
                </div>
            </div>
            <Separator className="my-4 flex-none" />

            <InfiniteList<NotificationType>
                data={data}
                loading={loading}
                error={error}
                onFilterChange={onFilterChange}
                limit={PAGE_SIZE}
                forceReload={reloadKey}
                extraParams={{ unreadOnly }}
                className="flex flex-col gap-2 pb-1"
                scrollRootClassName="min-h-0 flex-1 overflow-y-auto px-0.5 pb-12 pt-1"
                renderItem={(notification) => (
                    <NotificationRow
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

const NotificationCenterList = compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/notificationCenter/index.tsx"),
    withAxios(
        {
            method: "POST",
            url: "/api/user/notifications",
            data: {},
            addToHeader: [{
                whatToGet: "specificUserId",
                whereToPut: "specificUser"
            }]
        },
        true
    ),
    withDebug(true, true, "users")
)(NotificationCenter);

function NotificationCenterPage({specificUserId}: {specificUserId?: string}) {
    const {read} = useAccess("notifications", specificUserId ? "others" : "self");
    if (read === null) return null;
    if (!read) return <Forbidden />;
    return <NotificationCenterList specificUserId={specificUserId} />;
}

export default NotificationCenterPage;
