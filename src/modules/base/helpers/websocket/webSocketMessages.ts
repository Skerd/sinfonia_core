import type {AppDispatch} from "@baseModule/helpers/redux/store/generalStore.ts";
import {
    deleteChannel,
    demoteToUser,
    editMessage,
    incrementWaitingCount,
    mergeMessageFromServer,
    newMessage,
    promoteToAdmin,
    removeUsersFromChannel,
    replaceMessageReactions,
    toggleTypingUser,
    updateDeletedMessageIds,
    updateMessagePinned,
    upsertChannel,
} from "@baseModule/helpers/redux/slices/chatSlice.ts";
import {
    incrementUnreadNotifications,
    prependNotificationItems,
    setLatestNotification,
} from "@baseModule/helpers/redux/slices/notificationSlice.ts";
import {updateServerHealth, updateServerStats} from "@baseModule/helpers/redux/slices/serverResourceSlice.ts";
import {sendReceiptsNow} from "@baseModule/helpers/chat/messageReceipts.ts";
import apiClient from "@baseModule/helpers/apiClient/apiClient.ts";
import {handleError} from "@baseModule/helpers/general/errors.ts";
import {WebSocketFEMessageCodes} from "armonia/src/modules/core/websocket/types.ts";
import type {NotificationType} from "armonia/src/modules/core/api/user/private/notifications/notifications.dto.ts";
import type {GetChannelSingleFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/getChannelSingle.form.response.type.ts";
import type {GetMessageSingleFormResponseType} from "armonia/src/modules/core/api/user/private/chats/messages/getMessageSingle.form.response.type.ts";
import type {GetMessagePinSingleFormResponseType} from "armonia/src/modules/core/api/user/private/chats/messages/getMessagePinSingle.form.response.type.ts";
import type {GetMessageReactionsSingleFormResponseType} from "armonia/src/modules/core/api/user/private/chats/messages/getMessageReactionsSingle.form.response.type.ts";
import type {MessageReactionType} from "armonia/src/modules/core/api/user/private/chats/messages/messages.form.response.type.ts";
import type {RemoveUserFromChannelAdminFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/removeUserFromChannelAdmin.form.response.type.ts";
import type {MakeUserChannelAdminFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/makeUserChannelAdmin.form.response.type.ts";
import type {RemoveChannelMembersFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/removeChannelMembers.form.response.type.ts";
import type {ServerHealthFormResponseType} from "armonia/src/modules/core/api/auxiliary/private/serverHealth/serverHealth.dto.ts";
import type {ServerStatsDto} from "armonia/src/modules/core/api/auxiliary/private/serverStats/serverStats.dto.ts";

export const CHAT_API = {
    channel: "/api/user/chats/channels/single",
    message: "/api/user/chats/messages/single",
    pin: "/api/user/chats/messages/pin/single",
    reactions: "/api/user/chats/messages/reaction/single",
} as const;

/** Notification code that means a website visitor is waiting for a human. */
export const PUBLIC_CHAT_HANDOFF_CODE = "PUBLIC_CHAT_HANDOFF_REQUESTED";

type Payload = Record<string, unknown>;

export type WebSocketMessageContext = {
    dispatch: AppDispatch;
    /** Signed-in user; used to skip receipts for own messages and to update own membership. */
    userId: string | undefined;
};

type Handler = (payload: Payload, context: WebSocketMessageContext) => void;

const LOG_CONTEXT = "WebSocket";

const isPayload = (value: unknown): value is Payload =>
    typeof value === "object" && value !== null && !Array.isArray(value);

/** Non-empty string field, or `undefined`. */
const idOf = (payload: Payload, key: string): string | undefined => {
    const value = payload[key];
    return typeof value === "string" && value !== "" ? value : undefined;
};

const stringList = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

/** Follow-up fetches are best effort: a failure is logged, never toasted. */
function fetchThen<T>(url: string, body: Payload, apply: (data: T) => void): void {
    apiClient
        .post<T>(url, body)
        .then((res) => apply(res.data))
        .catch((error: unknown) => handleError(error, {context: LOG_CONTEXT, details: {url, body}}));
}

function refreshChannel(channelId: string, {dispatch}: WebSocketMessageContext): void {
    fetchThen<GetChannelSingleFormResponseType>(CHAT_API.channel, {id: channelId}, (channel) => {
        dispatch(upsertChannel(channel));
    });
}

function handleNotifications(payload: unknown, context: WebSocketMessageContext): void {
    const notifications = Array.isArray(payload) ? (payload as NotificationType[]) : [];
    if (notifications.length === 0) return;

    const {dispatch} = context;
    dispatch(prependNotificationItems(notifications));
    dispatch(incrementUnreadNotifications(notifications.filter((notification) => !notification.readOn).length));
    dispatch(setLatestNotification(notifications[0]));

    const handoffs = notifications.filter((notification) => notification.code === PUBLIC_CHAT_HANDOFF_CODE);
    if (handoffs.length === 0) return;

    dispatch(incrementWaitingCount());
    const channelIds = new Set(
        handoffs
            .map((notification) => notification.content?.channelId)
            .filter((channelId): channelId is string => typeof channelId === "string" && channelId !== ""),
    );
    channelIds.forEach((channelId) => refreshChannel(channelId, context));
}

const HANDLERS: Record<string, Handler> = {
    [WebSocketFEMessageCodes.CHANNEL_USER_DEMOTED_FROM_ADMIN]: (payload, {dispatch}) => {
        dispatch(demoteToUser(payload as RemoveUserFromChannelAdminFormResponseType));
    },
    [WebSocketFEMessageCodes.CHANNEL_USER_PROMOTED_TO_ADMIN]: (payload, {dispatch}) => {
        dispatch(promoteToAdmin(payload as MakeUserChannelAdminFormResponseType));
    },
    [WebSocketFEMessageCodes.CHANNEL_MEMBER_REMOVED]: (payload, {dispatch, userId}) => {
        dispatch(removeUsersFromChannel({data: payload as RemoveChannelMembersFormResponseType, userId: userId ?? ""}));
    },
    [WebSocketFEMessageCodes.CHANNEL_MEMBER_ADDED]: (payload, context) => {
        const channelId = idOf(payload, "channelId");
        if (channelId) refreshChannel(channelId, context);
    },
    [WebSocketFEMessageCodes.CHANNEL_CREATED]: (payload, context) => {
        const channelId = idOf(payload, "channelId");
        if (channelId) refreshChannel(channelId, context);
    },
    [WebSocketFEMessageCodes.CHANNEL_DELETED]: (payload, {dispatch}) => {
        const channelId = idOf(payload, "channelId");
        if (channelId) dispatch(deleteChannel(channelId));
    },
    [WebSocketFEMessageCodes.CHANNEL_DESCRIPTION_UPDATED]: (payload, {dispatch}) => {
        dispatch(upsertChannel(payload as GetChannelSingleFormResponseType));
    },
    [WebSocketFEMessageCodes.CHANNEL_MEMBER_LEFT]: (payload, {dispatch, userId}) => {
        const channelId = idOf(payload, "channelId");
        const leftUserId = idOf(payload, "userId");
        if (!channelId || !leftUserId) return;
        const messageId = idOf(payload, "messageId");
        dispatch(removeUsersFromChannel({
            data: {channelId, removedMembers: [leftUserId], messageIds: messageId ? [messageId] : []},
            userId: userId ?? "",
        }));
    },
    [WebSocketFEMessageCodes.TYPING_START]: (payload, {dispatch}) => {
        dispatch(toggleTypingUser(payload as {channelId: string; userId: string; typing: boolean}));
    },
    [WebSocketFEMessageCodes.TYPING_STOP]: (payload, {dispatch}) => {
        dispatch(toggleTypingUser(payload as {channelId: string; userId: string; typing: boolean}));
    },
    [WebSocketFEMessageCodes.NEW_MESSAGE]: (payload, {dispatch, userId}) => {
        const channelId = idOf(payload, "channelId");
        const messageId = idOf(payload, "messageId");
        if (!channelId || !messageId) return;
        fetchThen<GetMessageSingleFormResponseType>(CHAT_API.message, {messageId}, (message) => {
            dispatch(newMessage({channelId, message}));
            if (userId && message.sender?._id !== userId) {
                void sendReceiptsNow(channelId, [messageId], "delivered");
            }
        });
    },
    [WebSocketFEMessageCodes.MESSAGE_DELETED]: (payload, {dispatch}) => {
        const messageIds = stringList(payload.messageIds);
        if (messageIds.length > 0) dispatch(updateDeletedMessageIds(messageIds));
    },
    [WebSocketFEMessageCodes.MESSAGE_EDITED]: (payload, {dispatch}) => {
        const messageId = idOf(payload, "messageId");
        if (!messageId) return;
        fetchThen<GetMessageSingleFormResponseType>(CHAT_API.message, {messageId}, (message) => {
            dispatch(editMessage({messageId: message._id, message: message.message}));
        });
    },
    [WebSocketFEMessageCodes.MESSAGE_PINNED]: (payload, {dispatch}) => {
        const messageId = idOf(payload, "messageId");
        if (!messageId) return;
        fetchThen<GetMessagePinSingleFormResponseType>(CHAT_API.pin, {messageId}, (pinned) => {
            dispatch(updateMessagePinned({messageId, pinned}));
        });
    },
    [WebSocketFEMessageCodes.MESSAGE_UNPINNED]: (payload, {dispatch}) => {
        const messageId = idOf(payload, "messageId");
        if (messageId) dispatch(updateMessagePinned({messageId, pinned: null}));
    },
    [WebSocketFEMessageCodes.MESSAGE_REACTION]: (payload, {dispatch}) => {
        const messageId = idOf(payload, "messageId");
        if (!messageId) return;
        fetchThen<GetMessageReactionsSingleFormResponseType>(CHAT_API.reactions, {messageId}, (data) => {
            dispatch(replaceMessageReactions({messageId, reactions: data.reactions as MessageReactionType[]}));
        });
    },
    [WebSocketFEMessageCodes.MESSAGE_RECEIPT_UPDATED]: (payload, {dispatch}) => {
        const messageId = idOf(payload, "messageId");
        if (!messageId) return;
        fetchThen<GetMessageSingleFormResponseType>(CHAT_API.message, {messageId}, (message) => {
            dispatch(mergeMessageFromServer(message));
        });
    },
    /** Join acknowledgement: `{joined, alreadyJoined, failed}`. A refused room would otherwise stay silent. */
    [WebSocketFEMessageCodes.JOIN_ROOM]: (payload) => {
        const failed = stringList(payload.failed);
        if (failed.length > 0) {
            handleError(new Error(`Could not join rooms: ${failed.join(", ")}`), {context: LOG_CONTEXT});
        }
    },
    [WebSocketFEMessageCodes.SERVER_HEALTH_UPDATER]:(payload, {dispatch}) => {
        dispatch(updateServerHealth(payload as ServerHealthFormResponseType));
    },
    [WebSocketFEMessageCodes.SERVER_STATS_UPDATER]: (payload, {dispatch}) => {
        dispatch(updateServerStats(payload as ServerStatsDto));
    },
};

/**
 * Applies one server frame (`{code, payload}` as JSON text) to the store.
 * Frames that are not JSON, have no known `code`, or lack the ids a handler needs are ignored;
 * a handler that throws is logged rather than breaking the socket's message loop.
 */
export function handleWebSocketMessage(data: unknown, context: WebSocketMessageContext): void {
    let frame: unknown;
    try {
        frame = typeof data === "string" ? JSON.parse(data) : undefined;
    } catch {
        return;
    }
    if (!isPayload(frame) || typeof frame.code !== "string") return;
    const {code, payload} = frame;

    try {
        if (code === WebSocketFEMessageCodes.NEW_NOTIFICATIONS) {
            handleNotifications(payload, context);
            return;
        }
        const handler = Object.hasOwn(HANDLERS, code) ? HANDLERS[code] : undefined;
        if (handler && isPayload(payload)) handler(payload, context);
    } catch (error) {
        handleError(error, {context: LOG_CONTEXT, details: {code}});
    }
}
