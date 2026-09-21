import {createSelector, createSlice, type PayloadAction} from "@reduxjs/toolkit";
import {Channel} from "armonia/src/modules/core/api/user/private/chats/channels/channels.form.response.type.ts";
import {AllChannelsFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/allChannels.form.response.type.ts";
import {MessageReactionType, MessageType} from "armonia/src/modules/core/api/user/private/chats/messages/messages.form.response.type.ts";
import {EditMessageFormResponseType} from "armonia/src/modules/core/api/user/private/chats/messages/editMessage.form.response.type.ts";
import {PinMessageFormResponseType} from "armonia/src/modules/core/api/user/private/chats/messages/actions/pinMessage.form.response.type.ts";
import {RemoveUserFromChannelAdminFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/removeUserFromChannelAdmin.form.response.type.ts";
import {MakeUserChannelAdminFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/makeUserChannelAdmin.form.response.type.ts";
import {RemoveChannelMembersFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/removeChannelMembers.form.response.type.ts";
import {ChannelUser} from "armonia/src/modules/core/types";
import type {InboxBadgesFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/inboxBadges.form.response.type.ts";
import type {PublicChatStatusType} from "armonia/src/modules/core/api/user/public/publicChat/publicChat.types.ts";


export type ChatChannelKind = "internal" | "website";

export type ChatMessageAction = "reply" | "edit" | "forward";

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

    /** Tenant this slice is scoped to; null until first panel badge hydrate / reset. */
    companyId: string | null,

    activeChannelId: string | null,
    channels: Record<string, Channel>,
    channelsOrderIds: string[],
    channelsUnread: Record<string, number>,

    messagesOrderIds: string[],
    messages: Record<string, MessageType>,

    openDelete: boolean,
    deleteMessageIds: string[],

    actionMessage: {
        message: MessageType,
        action: ChatMessageAction
    } | null

    /** Typing indicators: {channelId: {userId: userId}} — consumers only read the keys. */
    typingUsers: Record<string, Record<string, string>>,

    /** Waiting-queue size for website visitor chats (sidebar badge). */
    waitingCount: number,
}

const initialState: ChatState = {

    companyId: null,

    activeChannelId: null,

    channels: {},
    channelsOrderIds: [],
    channelsUnread: {},

    messagesOrderIds: [],
    messages: {},

    openDelete: false,
    deleteMessageIds: [],
    actionMessage: null,

    typingUsers: {},
    waitingCount: 0,
}

function inboxBadgeStubChannel(
    id: string,
    unread: number,
    isPublicChat: boolean,
    publicChatStatus?: PublicChatStatusType,
): Channel {
    return {
        _id: id,
        name: "",
        users: [],
        metaData: {
            isGroup: false,
            readOnly: false,
            unreadMessages: unread,
            lastUserReadTime: new Date(0),
            isAiAssistant: false,
            isPublicChat,
            publicChatStatus,
        },
    };
}

const toArray = <T>(value: T[] | null | undefined): T[] => {
    return Array.isArray(value) ? value : [];
};

/** Keeps only the first occurrence of each non-empty id. */
const uniqueIds = (ids: string[]): string[] => {
    return [...new Set(ids.filter(Boolean))];
};
const appendUniqueIds = (current: string[], incoming: string[]): string[] => {
    return uniqueIds([...current, ...incoming]);
};
const prependUniqueIds = (current: string[], incoming: string[]): string[] => {
    return uniqueIds([...incoming, ...current]);
};

/** Normalizes a list into an id-keyed map plus order array, dropping id-less and duplicate entries. */
const normalizeById = <T extends {_id: string}>(items: T[]) => {
    const byId: Record<string, T> = {};
    const orderIds: string[] = [];

    for (const item of items) {
        if (!item?._id || byId[item._id]) continue;
        byId[item._id] = item;
        orderIds.push(item._id);
    }

    return {byId, orderIds};
};

/** Writes the canonical unread counter and mirrors it onto the channel metadata. */
const setChannelUnread = (state: ChatState, channelId: string, unread: number) => {
    state.channelsUnread[channelId] = unread;
    const metaData = state.channels[channelId]?.metaData;
    if (metaData) {
        metaData.unreadMessages = unread;
    }
};

/** Seeds the unread counter from channel metadata when the slice has none yet. */
const seedChannelUnread = (state: ChatState, channel: Channel) => {
    if (typeof state.channelsUnread[channel._id] !== "number") {
        const unread = channel.metaData?.unreadMessages;
        state.channelsUnread[channel._id] = typeof unread === "number" ? unread : 0;
    }
};

/** Drops everything tied to the currently open conversation view. */
const clearOpenConversation = (state: ChatState) => {
    state.messages = {};
    state.messagesOrderIds = [];
    state.openDelete = false;
    state.deleteMessageIds = [];
    state.actionMessage = null;
};

const setChannelUserType = (state: ChatState, channelId: string, userId: string, userType: ChannelUser["userType"]) => {
    const user = state.channels[channelId]?.users.find((u) => u._id === userId);
    if (user) {
        user.userType = userType;
    }
};

/** Content wiped from a message once it is deleted; a second delete hides it entirely. */
const createDeletedMessageFields = () => ({
    message: "",
    forwardedMessage: "",
    media: [],
    replyTo: undefined,
    reactions: [],
    pinned: undefined,
    mentionedUsers: [],
    delivery: [],
}) satisfies Partial<MessageType>;

export const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {

        // channel member actions
        demoteToUser: (state, action: PayloadAction<RemoveUserFromChannelAdminFormResponseType>) => {
            const {channelId, userId} = action.payload;
            setChannelUserType(state, channelId, userId, "user");
        },
        promoteToAdmin: (state, action: PayloadAction<MakeUserChannelAdminFormResponseType>) => {
            const {channelId, userId} = action.payload;
            setChannelUserType(state, channelId, userId, "admin");
        },
        removeUsersFromChannel: (state, action: PayloadAction<{data: RemoveChannelMembersFormResponseType, userId: string}>) => {
            const {channelId, removedMembers, messageIds} = action.payload.data;
            const {userId} = action.payload;
            const channel = state.channels[channelId];
            if (!channel) {
                return;
            }

            channel.users = channel.users.filter((user) => !removedMembers.includes(user._id));

            const systemMessages = messageIds?.length ?? 0;
            if (systemMessages > 0 && state.activeChannelId !== channelId) {
                setChannelUnread(state, channelId, (state.channelsUnread[channelId] ?? 0) + systemMessages);
            }
            if (userId && removedMembers.includes(userId) && channel.metaData) {
                channel.metaData.readOnly = true;
            }
        },
        updateChannelUsers: (state, action: PayloadAction<{channelId: string, users: ChannelUser[]}>) => {
            const {channelId, users} = action.payload;
            if (state.channels[channelId]) {
                state.channels[channelId].users = users;
            }
        },

        // channel actions
        openChannel: (state, action: PayloadAction<string | null>) => {
            const channelId = action.payload;
            if (state.activeChannelId === channelId) return;
            state.activeChannelId = channelId;
            clearOpenConversation(state);
            if (channelId) {
                setChannelUnread(state, channelId, 0);
            }
        },
        upsertChannel: (state, action: PayloadAction<Channel>) => {
            const channel = action.payload;
            const id = channel._id;
            state.channels[id] = channel;
            seedChannelUnread(state, channel);
            if (state.channelsOrderIds[0] !== id) {
                state.channelsOrderIds = prependUniqueIds(state.channelsOrderIds, [id]);
            }
        },
        deleteChannel: (state, action: PayloadAction<string>) => {
            const id = action.payload;
            state.channelsOrderIds = state.channelsOrderIds.filter((channelId) => channelId !== id);
            delete state.channelsUnread[id];
            delete state.channels[id];
            delete state.typingUsers[id];
            if (state.activeChannelId === id) {
                state.activeChannelId = null;
                clearOpenConversation(state);
            }
        },
        setChannels: (state, action: PayloadAction<SetChannelsPayload | null>) => {
            if (!action.payload) {
                return;
            }
            const {data, kind} = action.payload;
            const incoming = normalizeById(toArray(data));

            Object.assign(state.channels, incoming.byId);
            for (const channelId of incoming.orderIds) {
                const unread = incoming.byId[channelId].metaData?.unreadMessages;
                if (typeof unread === "number") {
                    state.channelsUnread[channelId] = unread;
                }
                else if (typeof state.channelsUnread[channelId] !== "number") {
                    state.channelsUnread[channelId] = 0;
                }
            }

            // Replace this kind's ordering; keep the other kind's list intact after it.
            const otherKindOrderIds = state.channelsOrderIds.filter((channelId) => {
                return !channelMatchesKind(state.channels[channelId], kind) && !!state.channels[channelId];
            });
            state.channelsOrderIds = appendUniqueIds(incoming.orderIds, otherKindOrderIds);

            state.messages = {};
            state.messagesOrderIds = [];
        },
        appendChannels: (state, action: PayloadAction<AllChannelsFormResponseType>) => {
            const incomingIds: string[] = [];

            for (const channel of toArray(action.payload.data)) {
                if (!channel?._id) continue;
                incomingIds.push(channel._id);
                state.channels[channel._id] = channel;
                seedChannelUnread(state, channel);
            }

            state.channelsOrderIds = appendUniqueIds(state.channelsOrderIds, incomingIds);
        },
        hydrateInboxBadges: (state, action: PayloadAction<InboxBadgesFormResponseType>) => {
            state.waitingCount = Math.max(0, action.payload.waitingCount);
            for (const row of action.payload.unread ?? []) {
                const id = row.channelId;
                if (!id || row.unread <= 0) {
                    continue;
                }
                if (typeof state.channelsUnread[id] !== "number") {
                    state.channelsUnread[id] = row.unread;
                }
                const existing = state.channels[id];
                if (!existing) {
                    state.channels[id] = inboxBadgeStubChannel(id, row.unread, row.isPublicChat, row.publicChatStatus);
                    continue;
                }
                if (!existing.metaData) {
                    continue;
                }
                if (typeof existing.metaData.unreadMessages !== "number") {
                    existing.metaData.unreadMessages = state.channelsUnread[id];
                }
                if (row.isPublicChat) {
                    existing.metaData.isPublicChat = true;
                    if (row.publicChatStatus) {
                        existing.metaData.publicChatStatus = row.publicChatStatus;
                    }
                }
            }
        },
        /**
         * Full wipe scoped to a company.
         * Company switch keeps tokens via `logIn` and does not run root `signOut`, so chat must be cleared explicitly.
         */
        resetChat: (_state, action: PayloadAction<string>) => ({
            ...initialState,
            companyId: action.payload,
        }),
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
            const {_id, state: readOnly} = action.payload;
            const channel = state.channels[_id];
            if (channel) {
                channel.metaData = {...channel.metaData, readOnly};
            }
        },

        // message actions
        /** Replaces the open conversation's messages after a channel fetch. */
        setMessages: (state, action: PayloadAction<MessageType[] | null>) => {
            const normalized = normalizeById(toArray(action.payload));
            state.messages = normalized.byId;
            state.messagesOrderIds = normalized.orderIds;
        },
        /** Adds a page of older messages ("start") or freshly sent ones ("end"). */
        addMessages: (state, action: PayloadAction<{messages: MessageType[], startOrEnd: "start" | "end"}>) => {
            const {startOrEnd} = action.payload;
            const incomingIds: string[] = [];

            for (const message of toArray(action.payload.messages)) {
                if (!message?._id) continue;
                state.messages[message._id] = message;
                incomingIds.push(message._id);
            }

            state.messagesOrderIds = startOrEnd === "start"
                ? prependUniqueIds(state.messagesOrderIds, incomingIds)
                : appendUniqueIds(state.messagesOrderIds, incomingIds);
        },
        newMessage: (state, action: PayloadAction<{channelId: string, message: MessageType}>) => {
            const {message, channelId} = action.payload;
            if (!message?._id) return;

            const metaData = state.channels[channelId]?.metaData;
            if (metaData) {
                metaData.lastMessage = message;
            }

            if (state.activeChannelId === channelId) {
                state.messages[message._id] = message;
                state.messagesOrderIds = appendUniqueIds(state.messagesOrderIds, [message._id]);
                setChannelUnread(state, channelId, 0);
            }
            else {
                setChannelUnread(state, channelId, (state.channelsUnread[channelId] ?? 0) + 1);
            }
        },
        updateDeletedMessageIds: (state, action: PayloadAction<string[]>) => {
            for (const messageId of action.payload) {
                const existing = state.messages[messageId];
                if (!existing) continue;
                state.messages[messageId] = {
                    ...existing,
                    ...createDeletedMessageFields(),
                    status: existing.status === "deleted" ? "hide" : "deleted",
                };
            }
        },
        editMessage: (state, action: PayloadAction<{messageId: string} & EditMessageFormResponseType>) => {
            const {messageId, message} = action.payload;
            const existing = state.messages[messageId];
            if (existing) {
                existing.status = "edited";
                existing.message = message;
            }
        },
        updateMessageReaction: (state, action: PayloadAction<{messageId: string, reaction: MessageReactionType, add: boolean}>) => {
            const {messageId, reaction, add} = action.payload;
            const existing = state.messages[messageId];
            if (!existing) return;

            const others = (existing.reactions ?? []).filter((r) => r._id !== reaction._id);
            existing.reactions = add ? [...others, reaction] : others;
        },
        replaceMessageReactions: (state, action: PayloadAction<{messageId: string, reactions: MessageReactionType[]}>) => {
            const {messageId, reactions} = action.payload;
            if (state.messages[messageId]) {
                state.messages[messageId].reactions = reactions;
            }
        },
        updateMessagePinned: (state, action: PayloadAction<{messageId: string, pinned: PinMessageFormResponseType | null}>) => {
            const {messageId, pinned} = action.payload;
            const existing = state.messages[messageId];
            if (!existing) return;
            if (pinned) {
                existing.pinned = pinned;
            }
            else {
                delete existing.pinned;
            }
        },
        /** Merges a server-side message update into every place the message is cached. */
        mergeMessageFromServer: (state, action: PayloadAction<MessageType>) => {
            const m = action.payload;
            if (!m?._id) {
                return;
            }
            if (state.messages[m._id]) {
                Object.assign(state.messages[m._id], m);
            }
            for (const channel of Object.values(state.channels)) {
                if (channel.metaData?.lastMessage?._id === m._id) {
                    Object.assign(channel.metaData.lastMessage, m);
                }
            }
        },

        // bulk delete selection
        updateOpenDelete: (state, action: PayloadAction<boolean>) => {
            state.deleteMessageIds = [];
            state.openDelete = action.payload;
        },
        toggleDeleteMessageId: (state, action: PayloadAction<string>) => {
            const id = action.payload;
            state.deleteMessageIds = state.deleteMessageIds.includes(id)
                ? state.deleteMessageIds.filter((selectedId) => selectedId !== id)
                : [...state.deleteMessageIds, id];

            if (state.deleteMessageIds.length === 0) {
                state.openDelete = false;
            }
        },

        // chat input
        setActionMessage: (state, action: PayloadAction<ChatState["actionMessage"]>) => {
            state.actionMessage = action.payload;
        },
        toggleTypingUser: (state, action: PayloadAction<{channelId: string, userId: string, typing: boolean}>) => {
            const {channelId, userId, typing} = action.payload;
            if (typing) {
                state.typingUsers[channelId] ??= {};
                state.typingUsers[channelId][userId] = userId;
                return;
            }

            const channelTypers = state.typingUsers[channelId];
            if (!channelTypers) return;
            delete channelTypers[userId];
            if (Object.keys(channelTypers).length === 0) {
                delete state.typingUsers[channelId];
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
    hydrateInboxBadges,
    resetChat,
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
    mergeMessageFromServer,

    // bulk delete selection
    updateOpenDelete,
    toggleDeleteMessageId,

    // chat input
    toggleTypingUser,
    setActionMessage,

} = chatSlice.actions;
export default chatSlice.reducer;

// selectors
type ChatRootState = {chat: ChatState};

const selectChannels = (state: ChatRootState) => state.chat.channels;
const selectChannelsOrderIds = (state: ChatRootState) => state.chat.channelsOrderIds;
const selectChannelsUnread = (state: ChatRootState) => state.chat.channelsUnread;

const channelOrderIdsSelectors: Record<ChatChannelKind, (state: ChatRootState) => string[]> = {
    internal: createSelector([selectChannelsOrderIds, selectChannels], (orderIds, channels) =>
        orderIds.filter((channelId) => channelMatchesKind(channels[channelId], "internal"))
    ),
    website: createSelector([selectChannelsOrderIds, selectChannels], (orderIds, channels) =>
        orderIds.filter((channelId) => channelMatchesKind(channels[channelId], "website"))
    ),
};

/**
 * Memoized per kind: returns the same array reference until the channel list changes,
 * so `useSelector(selectChannelOrderIdsByKind(kind))` does not re-render on unrelated updates.
 */
export function selectChannelOrderIdsByKind(kind: ChatChannelKind) {
    return channelOrderIdsSelectors[kind];
}

/** Unread on internal (staff) conversations — excludes website visitor chats. */
export const selectInternalChatUnread = createSelector([selectChannels, selectChannelsUnread], (channels, channelsUnread) => {
    let total = 0;
    for (const [channelId, unread] of Object.entries(channelsUnread)) {
        if (!isWebsiteChannel(channels[channelId])) {
            total += unread;
        }
    }
    return total;
});

/** Unread on website conversations the agent already owns — excludes the waiting queue. */
export const selectWebsiteChatMineUnread = createSelector([selectChannels, selectChannelsUnread], (channels, channelsUnread) => {
    let total = 0;
    for (const [channelId, unread] of Object.entries(channelsUnread)) {
        const metaData = channels[channelId]?.metaData;
        if (metaData?.isPublicChat && metaData.publicChatStatus === "human") {
            total += unread;
        }
    }
    return total;
});
