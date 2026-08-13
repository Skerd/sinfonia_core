import {createSlice, type PayloadAction} from "@reduxjs/toolkit";
import {Channel} from "armonia/src/modules/core/api/user/private/chats/channels/channels.form.response.type.ts";
import {AllChannelsFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/allChannels.form.response.type.ts";
import {MessageReactionType, MessageType, MessageTypeWithParticipants} from "armonia/src/modules/core/api/user/private/chats/messages/messages.form.response.type.ts";
import {EditMessageFormResponseType} from "armonia/src/modules/core/api/user/private/chats/messages/editMessage.form.response.type.ts";
import {PinMessageFormResponseType} from "armonia/src/modules/core/api/user/private/chats/messages/actions/pinMessage.form.response.type.ts";
import {RemoveUserFromChannelAdminFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/removeUserFromChannelAdmin.form.response.type.ts";
import {MakeUserChannelAdminFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/makeUserChannelAdmin.form.response.type.ts";
import {RemoveChannelMembersFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/removeChannelMembers.form.response.type.ts";
import {ChannelUser} from "armonia/src/modules/core/types";


export type ChatChannelKind = "internal" | "website";

export function isWebsiteChannel(channel: Channel | undefined | null): boolean {
    return !!channel?.metaData?.isPublicChat;
}

/** Waiting website chat the agent is not a member of — transcript is visible, replies are not. */
export function isPeekingWebsiteChannel(channel: Channel | undefined | null, userId: string | undefined): boolean {
    if (!channel?.metaData?.isPublicChat || !userId) {
        return false;
    }
    if (channel.metaData.publicChatStatus !== "requested_human") {
        return false;
    }
    return !channel.users?.some((u) => u._id === userId);
}

function channelMatchesKind(channel: Channel | undefined, kind: ChatChannelKind): boolean {
    if (!channel) {
        return false;
    }
    return kind === "website" ? isWebsiteChannel(channel) : !isWebsiteChannel(channel);
}

export type SetChannelsPayload = AllChannelsFormResponseType & {
    kind: ChatChannelKind;
};

/**
 * Chat redux state.
 *
 * Invariants maintained by reducers:
 * - `channelsOrderIds` and `messagesOrderIds` are unique.
 * - Every ID in an order array points to an existing entity in its map.
 * - `channelsUnread` is the canonical unread counter store; channel metadata mirrors it.
 * - Internal and website channels share this slice; lists filter by `metaData.isPublicChat`.
 */
export interface ChatState {

    activeChannelId: string | null,
    channels: Record<string, Channel>,
    channelsOrderIds: string[],
    channelsUnread: {[channelId: string]: number},

    messagesOrderIds: string[],
    messages: Record<string, MessageType>,
    newMessages: {[message_id: string]: MessageTypeWithParticipants},

    openDelete: boolean,
    deleteMessageIds: string[],

    actionMessage: {
        message: MessageType,
        action: "reply" | "edit" | "forward"
    } | null
    
    // Typing indicators: {channelId: {userId: username}}
    typingUsers: {[channelId: string]: {[userId: string]: string}},

    /** Waiting-queue size for website visitor chats (sidebar badge). */
    waitingCount: number,
}

const initialState: ChatState = {

    activeChannelId: null,

    channels: {},
    channelsOrderIds: [],
    channelsUnread: {},

    messagesOrderIds: [],
    messages: {},
    newMessages: {},

    openDelete: false,
    deleteMessageIds: [],
    actionMessage: null,

    typingUsers: {},
    waitingCount: 0,
}

const toArray = <T>(value: T[] | null | undefined): T[] => {
    return Array.isArray(value) ? value : [];
};
const appendUniqueIds = (current: string[], incoming: string[]): string[] => {
    const next = [...current];
    const seen = new Set(current);

    for (const id of incoming) {
        if (!id || seen.has(id)) continue;
        seen.add(id);
        next.push(id);
    }

    return next;
};
const prependUniqueIds = (current: string[], incoming: string[]): string[] => {
    const uniqueIncoming: string[] = [];
    const incomingSet = new Set<string>();

    for (const id of incoming) {
        if (!id || incomingSet.has(id)) continue;
        incomingSet.add(id);
        uniqueIncoming.push(id);
    }

    const remainder = current.filter((id) => !incomingSet.has(id));
    return uniqueIncoming.concat(remainder);
};
const buildChannelsState = (channelsInput: Channel[]) => {
    const channels: Record<string, Channel> = {};
    const channelsOrderIds: string[] = [];

    for (const channel of channelsInput) {
        if (!channel?._id || channels[channel._id]) continue;
        channels[channel._id] = channel;
        channelsOrderIds.push(channel._id);
    }

    return {channels, channelsOrderIds};
};
const buildMessagesState = (messagesInput: MessageType[]) => {
    const messages: Record<string, MessageType> = {};
    const messagesOrderIds: string[] = [];

    for (const message of messagesInput) {
        if (!message?._id || messages[message._id]) continue;
        messages[message._id] = message;
        messagesOrderIds.push(message._id);
    }

    return {messages, messagesOrderIds};
};

export const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {

        // channel member actions
        demoteToUser(state, action: PayloadAction<RemoveUserFromChannelAdminFormResponseType>){
            const { channelId, userId } = action.payload;
            if (state.channels[channelId]) {
                let channelUsers = state.channels[channelId].users;
                for( let user of channelUsers ){
                    if( user._id === userId ){
                        user.userType = "user";
                    }
                }
                state.channels[channelId].users = channelUsers;
            }
        },
        promoteToAdmin(state, action: PayloadAction<MakeUserChannelAdminFormResponseType>){
            const { channelId, userId } = action.payload;
            if (state.channels[channelId]) {
                let channelUsers = state.channels[channelId].users;
                for( let user of channelUsers ){
                    if( user._id === userId ){
                        user.userType = "admin";
                    }
                }
                state.channels[channelId].users = channelUsers;
            }
        },
        removeUsersFromChannel: (state, action: PayloadAction<{data: RemoveChannelMembersFormResponseType, userId: string}>) => {
            const { channelId, removedMembers, messageIds } = action.payload.data;
            const userId = action.payload.userId;
            if (state.channels[channelId]) {
                state.channels[channelId] = {
                    ...state.channels[channelId],
                    users: state.channels[channelId].users.filter(user => !removedMembers.includes(user._id))
                };
            }
            const n = messageIds?.length ?? 0;
            if (n > 0 && state.channels[channelId] && state.activeChannelId !== channelId) {
                state.channelsUnread[channelId] = (state.channelsUnread[channelId] ?? 0) + n;
                if (state.channels[channelId].metaData) {
                    state.channels[channelId].metaData.unreadMessages = state.channelsUnread[channelId];
                }
            }
            if( removedMembers.includes(userId) ){
                if (state.channels[channelId].metaData) {
                    state.channels[channelId].metaData.readOnly = true;
                }
            }
        },
        updateChannelUsers: (state, action: PayloadAction<{channelId: string, users: ChannelUser[]}>) => {
            const { channelId, users } = action.payload;
            if (state.channels[channelId]) {
                state.channels[channelId] = {
                    ...state.channels[channelId],
                    users
                }
            }
        },

        // channel actions
        openChannel: (state, action: PayloadAction<string | null>) => {
            if( state.activeChannelId === action.payload ) return;
            state.activeChannelId = action.payload;
            state.messages = {};
            state.messagesOrderIds = [];
            state.openDelete = false;
            state.deleteMessageIds = [];
            state.actionMessage = null;
            if (action.payload) {
                state.channelsUnread[action.payload] = 0;
                if (state.channels[action.payload]?.metaData) {
                    state.channels[action.payload].metaData.unreadMessages = 0;
                }
            }
        },
        upsertChannel: (state, action: PayloadAction<Channel>) => {
            const channel = action.payload;
            const id = channel._id;
            const index = state.channelsOrderIds.indexOf(id);
            state.channels[id] = channel;
            if (typeof state.channelsUnread[id] !== "number") {
                const unread = channel.metaData?.unreadMessages;
                state.channelsUnread[id] = typeof unread === "number" ? unread : 0;
            }
            if (index === 0) {
                return;
            }
            if (index > -1) {
                state.channelsOrderIds.splice(index, 1);
            }
            state.channelsOrderIds.unshift(id);
        },
        deleteChannel: (state, action: PayloadAction<string>) => {
            const id = action.payload;
            const index = state.channelsOrderIds.indexOf(id);
            if (index > -1) {
                state.channelsOrderIds.splice(index, 1);
            }
            delete state.channelsUnread[id];
            delete state.channels[id];
            if (state.activeChannelId === id) {
                state.activeChannelId = null;
                state.messages = {};
                state.messagesOrderIds = [];
            }
        },
        setChannels: (state, action: PayloadAction<SetChannelsPayload | null>) => {
            if( !action.payload ){
                return;
            }
            const {data, kind} = action.payload;
            const incoming = toArray(data);
            const normalizedChannels = buildChannelsState(incoming);

            state.channels = {...state.channels, ...normalizedChannels.channels};
            for (const channelId of normalizedChannels.channelsOrderIds) {
                const unread = normalizedChannels.channels[channelId]?.metaData?.unreadMessages;
                if (typeof unread === "number") {
                    state.channelsUnread[channelId] = unread;
                }
                else if (typeof state.channelsUnread[channelId] !== "number") {
                    state.channelsUnread[channelId] = 0;
                }
            }

            const otherKindOrderIds = state.channelsOrderIds.filter((channelId) => {
                const channel = state.channels[channelId];
                return channel && !channelMatchesKind(channel, kind);
            });
            state.channelsOrderIds = [...normalizedChannels.channelsOrderIds, ...otherKindOrderIds];

            state.messages = {};
            state.messagesOrderIds = [];
        },
        appendChannels: (state, action: PayloadAction<AllChannelsFormResponseType>) => {
            const {data} = action.payload;
            const channels = toArray(data);
            const incomingIds: string[] = [];

            for (const channel of channels) {
                if (!channel?._id) continue;
                const channelId = channel._id;
                incomingIds.push(channelId);
                state.channels[channelId] = channel;
                if (typeof state.channelsUnread[channelId] !== "number") {
                    const unread = channel.metaData?.unreadMessages;
                    state.channelsUnread[channelId] = typeof unread === "number" ? unread : 0;
                }
            }

            state.channelsOrderIds = appendUniqueIds(state.channelsOrderIds, incomingIds);
        },
        setWaitingCount: (state, action: PayloadAction<number>) => {
            state.waitingCount = Math.max(0, action.payload);
        },
        incrementWaitingCount: (state) => {
            state.waitingCount += 1;
        },
        decrementWaitingCount: (state) => {
            state.waitingCount = Math.max(0, state.waitingCount - 1);
        },
        updateChannelReadOnlyState: (state, action: PayloadAction<{_id: string, state: boolean}>) => {
            const { _id, state: readOnlyState } = action.payload;
            if (state.channels[_id]) {
                state.channels[_id] = {
                    ...state.channels[_id],
                    metaData: {
                        ...state.channels[_id].metaData,
                        readOnly: readOnlyState
                    }
                };
            }
        },

        // message actions
        // used to set messages when a channel is opened and messages are fetched
        setMessages: (state, action: PayloadAction<MessageType[] | null>) => {
            const messages = toArray(action.payload);
            if( messages.length === 0 ){
                state.messagesOrderIds = [];
                state.messages = {};
            }
            else{
                const normalizedMessages = buildMessagesState(messages);
                state.messages = normalizedMessages.messages;
                state.messagesOrderIds = normalizedMessages.messagesOrderIds;
            }
        },
        // used to append messages that have just been typed
        addMessages: (state, action: PayloadAction<{messages: MessageType[], startOrEnd: "start" | "end"}>) => {
            const {startOrEnd} = action.payload;
            const messages = toArray(action.payload.messages);
            const incomingIds: string[] = [];

            for (const message of messages) {
                if (!message?._id) continue;
                state.messages[message._id] = message;
                incomingIds.push(message._id);
            }

            if( startOrEnd === "start" ){
                state.messagesOrderIds = prependUniqueIds(state.messagesOrderIds, incomingIds);
            }
            else{
                state.messagesOrderIds = appendUniqueIds(state.messagesOrderIds, incomingIds);
            }
            state.messagesOrderIds = state.messagesOrderIds.filter((id) => Boolean(state.messages[id]));
        },
        newMessage: (state, action: PayloadAction<{channelId: string, message: MessageType}>) => {
            const {message, channelId} = action.payload;
            if (!message?._id) return;

            if (state.channels[channelId]?.metaData) {
                state.channels[channelId].metaData.lastMessage = message;
            }

            if( !!state.activeChannelId && state.activeChannelId === channelId ){
                state.newMessages[message._id] = {
                    channelId,
                    ...message
                };

                state.messages[message._id] = message;
                state.messagesOrderIds = appendUniqueIds(state.messagesOrderIds, [message._id]);
                state.channelsUnread[channelId] = 0;
                if (state.channels[channelId]?.metaData) {
                    state.channels[channelId].metaData.unreadMessages = 0;
                }
            }
            else{
                const unreadMessagesTemp = (state.channelsUnread[channelId] ?? 0) + 1;
                state.channelsUnread[channelId] = unreadMessagesTemp;
                if( state.channels[channelId]?.metaData ){
                    state.channels[channelId].metaData.unreadMessages = unreadMessagesTemp;
                    state.channels[channelId].metaData.lastMessage = message;
                }
            }
        },
        updateDeletedMessageIds: (state, action: PayloadAction<string[]>) => {
            for( const messageId of action.payload ){
                if( state.messages[messageId] ){
                    if( state.messages[messageId].status === "deleted" ){
                        state.messages[messageId] = {
                            ...state.messages[messageId],
                            message: "",
                            forwardedMessage: "",
                            media: [],
                            status: "hide",
                            replyTo: undefined,
                            reactions: [],
                            pinned: undefined,
                            mentionedUsers: [],
                            delivery: [],
                        }
                    }
                    else{
                        state.messages[messageId] = {
                            ...state.messages[messageId],
                            message: "",
                            forwardedMessage: "",
                            media: [],
                            status: "deleted",
                            replyTo: undefined,
                            reactions: [],
                            pinned: undefined,
                            mentionedUsers: [],
                            delivery: [],
                        }
                    }
                }
            }
        },
        editMessage: (state, action: PayloadAction<{messageId: string} & EditMessageFormResponseType>) => {
            const {messageId, message} = action.payload;
            if( state.messages[messageId] ){
                state.messages[messageId] = {
                    ...state.messages[messageId],
                    status: "edited",
                    message: message
                }
            }
        },
        updateMessageReaction: (state, action: PayloadAction<{messageId: string, reaction: MessageReactionType, add: boolean}>) => {
            const {messageId, reaction, add} = action.payload;
            if( !!state.messages[messageId] ){
                if( add ){
                    if( !state.messages[messageId].reactions ){
                        state.messages[messageId].reactions = [reaction];
                    }
                    else{
                        const newReactions = state.messages[messageId].reactions.filter(r => r._id !== reaction._id);
                        state.messages[messageId].reactions = newReactions.concat(reaction);
                    }
                }
                else{
                    state.messages[messageId].reactions = state.messages[messageId].reactions?.filter(r => r._id !== reaction._id);
                }
            }
        },
        replaceMessageReactions: (state, action: PayloadAction<{messageId: string, reactions: MessageReactionType[]}>) => {
            const {messageId, reactions} = action.payload;
            if (state.messages[messageId]) {
                state.messages[messageId].reactions = reactions;
            }
        },
        updateMessagePinned: (state, action: PayloadAction<{messageId: string, pinned: PinMessageFormResponseType | null} >) => {
            const {messageId, pinned} = action.payload;
            if (!state.messages[messageId]) return;
            if( pinned ){
                state.messages[messageId] = {
                    ...state.messages[messageId],
                    pinned: pinned
                };
            }
            else {
                delete state.messages[messageId].pinned;
            }
        },

        // action
        updateOpenDelete: (state, action: PayloadAction<boolean>) => {
            state.deleteMessageIds = [];
            state.openDelete = action.payload;
        },
        toggleDeleteMessageId: (state, action: PayloadAction<string>) => {
            if( !state.deleteMessageIds.includes(action.payload) ){
                state.deleteMessageIds.push(action.payload);
            }
            else{
                state.deleteMessageIds = state.deleteMessageIds.filter(id => id !== action.payload);
            }

            if( state.deleteMessageIds.length === 0 ){
                state.openDelete = false;
            }
        },

        // chat input
        setActionMessage: (state, action: PayloadAction<{message: MessageType, action: "reply" | "edit" | "forward"} | null>) => {
            state.actionMessage = action.payload;
        },
        toggleTypingUser: (state, action: PayloadAction<{channelId: string, userId: string, typing: boolean}>) => {
            const {channelId, userId, typing} = action.payload;
            if( !state.typingUsers[channelId] ){
                state.typingUsers[channelId] = {};
            }
            if( typing ){
                state.typingUsers[channelId][userId] = userId;
            }
            else{
                delete state.typingUsers[channelId][userId];
            }
        },


        mergeMessageFromServer: (state, action: PayloadAction<MessageType>) => {
            const m = action.payload;
            if (!m?._id) {
                return;
            }
            if (state.messages[m._id]) {
                state.messages[m._id] = {...state.messages[m._id], ...m};
            }
            if (state.newMessages[m._id]) {
                state.newMessages[m._id] = {...state.newMessages[m._id], ...m};
            }
            for (const cid of Object.keys(state.channels)) {
                const ch = state.channels[cid];
                if (ch?.metaData?.lastMessage?._id === m._id) {
                    ch.metaData.lastMessage = {...ch.metaData.lastMessage, ...m} as MessageType;
                }
            }
        },
    }
});

export const {

    // channel member actions
    demoteToUser,
    promoteToAdmin,
    removeUsersFromChannel,
    updateChannelUsers,

    // channel actions
    openChannel,
    upsertChannel,
    deleteChannel,
    setChannels,
    appendChannels,
    updateChannelReadOnlyState,
    setWaitingCount,
    incrementWaitingCount,
    decrementWaitingCount,

    // message actions
    setMessages,
    addMessages,
    newMessage,
    updateDeletedMessageIds,
    editMessage,
    updateMessageReaction,
    replaceMessageReactions,
    updateMessagePinned,

    // actions
    updateOpenDelete,
    toggleDeleteMessageId,

    // chat input
    toggleTypingUser,
    setActionMessage,

    mergeMessageFromServer


} = chatSlice.actions;
export default chatSlice.reducer;

export function selectChannelOrderIdsByKind(kind: ChatChannelKind) {
    return (state: {chat: ChatState}): string[] =>
        state.chat.channelsOrderIds.filter((channelId) => channelMatchesKind(state.chat.channels[channelId], kind));
}

/** Unread on internal (staff) conversations — excludes website visitor chats. */
export function selectInternalChatUnread(state: {chat: ChatState}): number {
    const {channels, channelsUnread} = state.chat;
    let total = 0;
    for (const [channelId, unread] of Object.entries(channelsUnread ?? {})) {
        if (!isWebsiteChannel(channels[channelId])) {
            total += unread;
        }
    }
    return total;
}

/** Unread on website conversations the agent already owns — excludes the waiting queue. */
export function selectWebsiteChatMineUnread(state: {chat: ChatState}): number {
    const {channels, channelsUnread} = state.chat;
    let total = 0;
    for (const [channelId, unread] of Object.entries(channelsUnread ?? {})) {
        if (channels[channelId]?.metaData?.isPublicChat && channels[channelId]?.metaData?.publicChatStatus === "human") {
            total += unread;
        }
    }
    return total;
}