import {createSlice, type PayloadAction} from "@reduxjs/toolkit";
import {NotificationType} from "armonia/src/modules/core/api/user/private/notifications/notifications.dto.ts";

/**
 * UI-facing notification state:
 * - latest pushed notification
 * - panel visibility state
 * - unread counter used in badges
 * - items for dropdown/page list
 */
export interface NotificationState {
    latestNotification?: NotificationType
    unreadNotifications: number,
    items: NotificationType[],
    loading: boolean
}

const initialState: NotificationState = {
    latestNotification: undefined,
    unreadNotifications: 0,
    items: [],
    loading: false
}

export const notificationSlice = createSlice({
    name: "notification",
    initialState,
    reducers: {
        /**
         * Hard-sets unread count from server-side source of truth.
         * Negative values are clamped to zero for UI consistency.
         */
        setNotificationNumber: (state, action: PayloadAction<number>) => {
            state.unreadNotifications = Math.max(0, action.payload);
        },
        /**
         * Increments unread count by a positive amount.
         * Negative payloads are ignored to prevent accidental underflow.
         */
        incrementUnreadNotifications: (state, action: PayloadAction<number>) => {
            state.unreadNotifications += Math.max(0, action.payload);
        },
        /**
         * Decrements unread count by one while preventing negative values.
         */
        decrementUnreadNotifications: (state) => {
            state.unreadNotifications = Math.max(0, state.unreadNotifications - 1);
        },
        /** Saves the latest notification for previews/toasts. */
        setLatestNotification: (state, action: PayloadAction<NotificationType>) => {
            state.latestNotification = action.payload;
        },
        /**
         * Clears unread and preview state, typically used on logout.
         */
        resetNotifications: (state) => {
            state.latestNotification = undefined;
            state.unreadNotifications = 0;
            state.items = [];
        },
        /** Set notification list (e.g. from API fetch). */
        setNotificationItems: (state, action: PayloadAction<NotificationType[]>) => {
            state.items = action.payload;
        },
        /** Prepend notifications (e.g. from WebSocket push). */
        prependNotificationItems: (state, action: PayloadAction<NotificationType[]>) => {
            const existingIds = new Set(state.items.map((notification) => notification._id));
            const newItems = action.payload.filter((notification) => !existingIds.has(notification._id));
            state.items = [...newItems, ...state.items];
        },
        /** Marks currently cached notifications as read after a successful bulk update. */
        markCachedNotificationsRead: (state, action: PayloadAction<string | undefined>) => {
            const readOn = action.payload ?? new Date().toISOString();
            state.items = state.items.map((notification) => ({
                ...notification,
                readOn: notification.readOn ?? readOn
            }));
            if (state.latestNotification) {
                state.latestNotification.readOn = state.latestNotification.readOn ?? readOn;
            }
        },
        /** Set loading state. */
        setNotificationsLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        }
    }
})


export const {
    incrementUnreadNotifications,
    decrementUnreadNotifications,
    setNotificationNumber,
    setLatestNotification,
    resetNotifications,
    setNotificationItems,
    prependNotificationItems,
    markCachedNotificationsRead,
    setNotificationsLoading
} = notificationSlice.actions;
export default notificationSlice.reducer;