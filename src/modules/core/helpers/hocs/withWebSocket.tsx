import {useCallback, useEffect, useMemo} from "react";
import {useDispatch, useSelector} from "react-redux";
import {
    newMessage,
    toggleTypingUser,
    replaceMessageReactions,
    updateMessagePinned,
    mergeMessageFromServer,
    editMessage,
    updateDeletedMessageIds,
    upsertChannel,
    deleteChannel,
    promoteToAdmin,
    removeUsersFromChannel,
    demoteToUser
} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {updateWebSocketConnectionStatus} from "@coreModule/helpers/redux/slices/uiSlice.ts";
import {WebSocketFEMessageCodes} from "armonia/src/modules/core/websocket/types.ts";
import {RemoveUserFromChannelAdminFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/removeUserFromChannelAdmin.form.response.type.ts";
import {MakeUserChannelAdminFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/makeUserChannelAdmin.form.response.type.ts";
import {RemoveChannelMembersFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/removeChannelMembers.form.response.type.ts";
import {AddChannelMembersFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/addChannelMembers.form.response.type.ts";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";
import {GetChannelSingleFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/getChannelSingle.form.response.type.ts";
import {DeleteChannelFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/deleteChannel.form.response.type.ts";
import {GetMessageSingleFormResponseType} from "armonia/src/modules/core/api/user/private/chats/messages/getMessageSingle.form.response.type.ts";
import {MessageReactionType} from "armonia/src/modules/core/api/user/private/chats/messages/messages.form.response.type.ts";
import {sendReceiptsNow} from "@coreModule/helpers/chat/messageReceipts.ts";
import useWebSocket from "react-use-websocket";
import {GetMessageReactionsSingleFormResponseType} from "armonia/src/modules/core/api/user/private/chats/messages/getMessageReactionsSingle.form.response.type.ts";
import {GetMessagePinSingleFormResponseType} from "armonia/src/modules/core/api/user/private/chats/messages/getMessagePinSingle.form.response.type.ts";
import {NotificationType} from "armonia/src/modules/core/api/user/private/notifications/notifications.dto.ts";
import {
    incrementUnreadNotifications,
    prependNotificationItems,
    setLatestNotification
} from "@coreModule/helpers/redux/slices/notificationSlice.ts";
import {updateServerHealth, updateServerStats} from "@coreModule/helpers/redux/slices/serverResourceSlice.ts";
import {ServerHealthFormResponseType} from "armonia/src/modules/core/api/auxiliary/private/serverHealth/serverHealth.dto.ts";
import {ServerStatsDto} from "armonia/src/modules/core/api/auxiliary/private/serverStats/serverStats.dto.ts";


/**
 * Shared websocket instance used by the chat HOC.
 * It is module-scoped so reconnect guards can prevent duplicate connections.
 */
export let clientWebSocket: any = null;

export let sendWebsocketMessage: any = null;


/**
 * Opens and wires a websocket connection for chat realtime events.
 *
 * Contract:
 * - Incoming messages are expected as JSON: `{ code: string, payload: unknown }`.
 * - Unknown/invalid message shapes are ignored defensively.
 * - Known message codes dispatch redux actions and optional UI toasts.
 *
 * Error behavior:
 * - Socket `error`, message parse failures, and connection exceptions are forwarded via `onError`.
 * - Connection status is mirrored in redux through `updateWebSocketConnectionStatus`.
 */

//     case "MESSAGE_MENTIONED": {
//         if (isObject(payload) && payload.message && payload.channelId) {
//             dispatch(newMessage({channelId: payload.channelId, message: payload.message}));
//             toast(payload.message.sender?.username || "Someone", {
//                 description: `@${payload.message.sender?.username || "someone"} mentioned you in ${payload.channelId || "a channel"}`
//             });
//         }
//         break;
//     }

function messageEvaluator(message: MessageEvent, dispatch: any, userId: string) {
    let parsedMessage: {code?: string; payload?: any};
    try {
        parsedMessage = JSON.parse(message.data);
    } catch {
        return;
    }

    const {code, payload} = parsedMessage;
    if (!code) return;

    switch (code) {
        case WebSocketFEMessageCodes.NEW_NOTIFICATIONS: {
            const notifications = Array.isArray(payload) ? payload as NotificationType[] : [];
            if (notifications.length > 0) {
                dispatch(prependNotificationItems(notifications));
                dispatch(incrementUnreadNotifications(notifications.filter((notification) => !notification.readOn).length));
                dispatch(setLatestNotification(notifications[0]));
            }
            break;
        }
        case WebSocketFEMessageCodes.CHANNEL_USER_DEMOTED_FROM_ADMIN:
            dispatch(demoteToUser(payload as RemoveUserFromChannelAdminFormResponseType));
            break;
        case WebSocketFEMessageCodes.CHANNEL_USER_PROMOTED_TO_ADMIN:
            dispatch(promoteToAdmin(payload as MakeUserChannelAdminFormResponseType));
            break;
        case WebSocketFEMessageCodes.CHANNEL_MEMBER_REMOVED:
            dispatch(removeUsersFromChannel({data: payload as RemoveChannelMembersFormResponseType, userId: userId}));
            break;
        case WebSocketFEMessageCodes.CHANNEL_MEMBER_ADDED:
            const memberAddedData: AddChannelMembersFormResponseType = payload;
            apiClient.post<GetChannelSingleFormResponseType>("/api/user/chats/channels/single", {id: memberAddedData.channelId})
                .then((res) => {
                    let {data} = res;
                    dispatch(upsertChannel(data));
                })
                .catch(() => {})
            break;
        case WebSocketFEMessageCodes.CHANNEL_CREATED:
            const channelCreatedData: {channelId: string} = payload;
            apiClient.post<GetChannelSingleFormResponseType>("/api/user/chats/channels/single", {id: channelCreatedData.channelId})
                .then((res) => {
                    let {data} = res;
                    dispatch(upsertChannel(data));
                })
                .catch(() => {})
            break;
        case WebSocketFEMessageCodes.CHANNEL_DELETED:
            dispatch(deleteChannel((payload as {channelId: string}).channelId));
            break;
        case WebSocketFEMessageCodes.CHANNEL_DESCRIPTION_UPDATED:
            dispatch(upsertChannel(payload));
            break;
        case WebSocketFEMessageCodes.CHANNEL_MEMBER_LEFT:
            const data: DeleteChannelFormResponseType = payload;
            dispatch(removeUsersFromChannel({
                data: {
                    channelId: data.channelId,
                    removedMembers: [data.userId],
                    messageIds: [data.messageId]
                },
                userId: userId
            }));
            break;
        case WebSocketFEMessageCodes.TYPING_START:
        case WebSocketFEMessageCodes.TYPING_STOP:
            const typingData: {channelId: string, userId: string, typing: boolean} = payload;
            dispatch(toggleTypingUser(typingData));
            break;
        case WebSocketFEMessageCodes.NEW_MESSAGE:
            const newMessageData: {channelId: string, messageId: any} = payload;
            apiClient.post<GetMessageSingleFormResponseType>("/api/user/chats/messages/single", {messageId: newMessageData.messageId})
                .then((res) => {
                    let {data} = res;
                    dispatch(newMessage({channelId: newMessageData.channelId, message: data}));
                    if (userId && data.sender?._id !== userId) {
                        sendReceiptsNow(newMessageData.channelId, [newMessageData.messageId], "delivered")
                    }
                })
                .catch(() => {})
            break;
        case WebSocketFEMessageCodes.MESSAGE_DELETED:
            const messageDeletedData: {channelId: string, messageIds: string[]} = payload;
            dispatch(updateDeletedMessageIds(messageDeletedData.messageIds));
            break;
        case WebSocketFEMessageCodes.MESSAGE_EDITED:
            const messageEditedData: {channelId: string, messageId: string} = payload;
            apiClient.post<GetMessageSingleFormResponseType>("/api/user/chats/messages/single", {messageId: messageEditedData.messageId})
                .then((res) => {
                    let {data} = res;
                    dispatch(editMessage({messageId: data._id, message: data.message}));
                })
                .catch(() => {})
            break
        case WebSocketFEMessageCodes.MESSAGE_PINNED:
            const pinPayload: {channelId: string, messageId: string} = payload;
            apiClient.post<GetMessagePinSingleFormResponseType>("/api/user/chats/messages/pin/single", {messageId: pinPayload.messageId})
                .then((res) => {
                    dispatch(updateMessagePinned({messageId: pinPayload.messageId, pinned: res.data}));
                })
                .catch(() => {})
            break
        case WebSocketFEMessageCodes.MESSAGE_UNPINNED:
            const unpinPayload: {channelId: string, messageId: string} = payload;
            dispatch(updateMessagePinned({messageId: unpinPayload.messageId, pinned: null}));
            break;
        case WebSocketFEMessageCodes.MESSAGE_REACTION:
            const reactionPayload: {channelId: string, messageId: string} = payload;
            apiClient.post<GetMessageReactionsSingleFormResponseType>("/api/user/chats/messages/reaction/single", {messageId: reactionPayload.messageId})
                .then((res) => {
                    dispatch(replaceMessageReactions({
                        messageId: reactionPayload.messageId,
                        reactions: res.data.reactions as MessageReactionType[]
                    }));
                })
                .catch(() => {})
            break
        case WebSocketFEMessageCodes.MESSAGE_RECEIPT_UPDATED:
            const receiptPayload: {channelId: string, messageId: string} = payload;
            apiClient.post<GetMessageSingleFormResponseType>("/api/user/chats/messages/single", {messageId: receiptPayload.messageId})
                .then((res) => {
                    dispatch(mergeMessageFromServer(res.data));
                })
                .catch(() => {})
            break
        case WebSocketFEMessageCodes.SERVER_HEALTH_UPDATER:
            dispatch(updateServerHealth(payload as ServerHealthFormResponseType));
            break;
        case WebSocketFEMessageCodes.SERVER_STATS_UPDATER:
            dispatch(updateServerStats(payload as ServerStatsDto));
            break; 
        default:
            break;
    }
}



const withWebSocket = () => (WrappedComponent: any) => {
    function EnhancedComponent_WithWebSocket(props: any) {

        const dispatch = useDispatch();
        const token = useSelector((state: RootState) => state.authentication.token);
        const userId = useSelector((state: RootState) => state.authentication.user?.id);
        const languageCode = useSelector((state: RootState) => state.language.languageCode);

        const WS_URL = useMemo(() => {
            if (!token) return null;
            return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/${token}/${languageCode}`;
        }, [token, languageCode]);
        const handleMessage = useCallback((message: MessageEvent) => {
            messageEvaluator(message, dispatch, userId);
        }, [dispatch, userId]);

        useEffect(() => {
            window.addEventListener('beforeunload', () => {
                console.log('PAGE RELOAD TRIGGERED');
            });
        }, []);

        const {sendJsonMessage, getWebSocket} = useWebSocket(
            WS_URL,
            {
                retryOnError: true,
                reconnectAttempts: Infinity,
                reconnectInterval: (attemptNumber) => {
                    const backoffMs = Math.min(30000, 1000 * Math.pow(2, attemptNumber));
                    return backoffMs + Math.floor(Math.random() * 1000);
                },
                shouldReconnect: (closeEvent) => {
                    return ![1000, 1008].includes(closeEvent.code);
                },
                onOpen: () => {
                    clientWebSocket = getWebSocket();
                    console.log("WS: Websocket connection opened successfully");
                    dispatch(updateWebSocketConnectionStatus(true));
                },
                onClose: (event) => {
                    clientWebSocket = null;
                    console.log(`WS: Websocket connection closed (code: ${event.code}, reason: ${event.reason || 'none'})`);
                    dispatch(updateWebSocketConnectionStatus(false));
                },
                onError: (error) => {
                    console.error("WS: Websocket error:", error);
                    dispatch(updateWebSocketConnectionStatus(false));
                },
                onMessage: handleMessage
            }
        );

        useEffect(() => {
            sendWebsocketMessage = (message: any) => {
                sendJsonMessage(message)
            };
            clientWebSocket = getWebSocket();
            return () => {
                sendWebsocketMessage = null;
                clientWebSocket = null;
            };
        }, [sendJsonMessage, getWebSocket]);

        return (
            <WrappedComponent {...props} />
        )
    }

    return EnhancedComponent_WithWebSocket;
}

export default withWebSocket;


