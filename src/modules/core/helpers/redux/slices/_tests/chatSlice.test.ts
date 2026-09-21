import {describe, expect, it} from "vitest";
import type {Channel} from "armonia/src/modules/core/api/user/private/chats/channels/channels.form.response.type.ts";
import type {MessageType} from "armonia/src/modules/core/api/user/private/chats/messages/messages.form.response.type.ts";
import chatReducer, {
    type ChatState,
    deleteChannel,
    newMessage,
    openChannel,
    removeUsersFromChannel,
    selectChannelOrderIdsByKind,
    selectInternalChatUnread,
    setMessages,
    toggleTypingUser,
    updateDeletedMessageIds,
    updateMessageReaction,
    upsertChannel,
} from "../chatSlice.ts";

const channel = (id: string, isPublicChat = false): Channel => ({
    _id: id,
    name: id,
    users: [{_id: "u1"}, {_id: "u2"}],
    metaData: {
        isGroup: true,
        readOnly: false,
        unreadMessages: 0,
        lastUserReadTime: new Date(0),
        isAiAssistant: false,
        isPublicChat,
    },
} as Channel);

const message = (id: string, extra: Partial<MessageType> = {}): MessageType => ({
    _id: id,
    message: `text ${id}`,
    status: "sent",
    ...extra,
} as MessageType);

const stateWith = (...channels: Channel[]): ChatState =>
    channels.reduce((state, c) => chatReducer(state, upsertChannel(c)), chatReducer(undefined, {type: "init"}));

describe("chatSlice", () => {
    it("moves an upserted channel to the top without duplicating it", () => {
        const state = chatReducer(stateWith(channel("a"), channel("b")), upsertChannel(channel("a")));
        expect(state.channelsOrderIds).toEqual(["a", "b"]);
    });

    it("counts unread for inactive channels and clears it on open", () => {
        let state = stateWith(channel("a"));
        state = chatReducer(state, newMessage({channelId: "a", message: message("m1")}));
        state = chatReducer(state, newMessage({channelId: "a", message: message("m2")}));
        expect(state.channelsUnread.a).toBe(2);
        expect(state.channels.a.metaData.unreadMessages).toBe(2);

        state = chatReducer(state, openChannel("a"));
        expect(state.channelsUnread.a).toBe(0);
        expect(state.channels.a.metaData.unreadMessages).toBe(0);
    });

    it("appends messages for the active channel", () => {
        let state = chatReducer(stateWith(channel("a")), openChannel("a"));
        state = chatReducer(state, newMessage({channelId: "a", message: message("m1")}));
        state = chatReducer(state, newMessage({channelId: "a", message: message("m1")}));
        expect(state.messagesOrderIds).toEqual(["m1"]);
        expect(state.channelsUnread.a).toBe(0);
    });

    it("ignores member removal for unknown channels", () => {
        const state = stateWith(channel("a"));
        const next = chatReducer(state, removeUsersFromChannel({
            data: {channelId: "missing", removedMembers: ["u1"], messageIds: ["x"]},
            userId: "u1",
        } as never));
        expect(next).toBe(state);
    });

    it("makes the channel read-only when the current user is removed", () => {
        const state = chatReducer(stateWith(channel("a")), removeUsersFromChannel({
            data: {channelId: "a", removedMembers: ["u1"], messageIds: ["x"]},
            userId: "u1",
        } as never));
        expect(state.channels.a.users.map((u) => u._id)).toEqual(["u2"]);
        expect(state.channels.a.metaData.readOnly).toBe(true);
        expect(state.channelsUnread.a).toBe(1);
    });

    it("deletes then hides a message on repeated deletes", () => {
        let state = chatReducer(undefined, setMessages([message("m1", {reactions: [{_id: "r"} as never]})]));
        state = chatReducer(state, updateDeletedMessageIds(["m1"]));
        expect(state.messages.m1).toMatchObject({status: "deleted", message: "", reactions: []});
        state = chatReducer(state, updateDeletedMessageIds(["m1"]));
        expect(state.messages.m1.status).toBe("hide");
    });

    it("replaces a reaction by id when adding and removes it otherwise", () => {
        let state = chatReducer(undefined, setMessages([message("m1")]));
        const reaction = {_id: "r1", reaction: "👍"} as never;
        state = chatReducer(state, updateMessageReaction({messageId: "m1", reaction, add: true}));
        state = chatReducer(state, updateMessageReaction({messageId: "m1", reaction, add: true}));
        expect(state.messages.m1.reactions).toHaveLength(1);
        state = chatReducer(state, updateMessageReaction({messageId: "m1", reaction, add: false}));
        expect(state.messages.m1.reactions).toEqual([]);
    });

    it("drops empty typing maps and clears them with the channel", () => {
        let state = chatReducer(stateWith(channel("a")), toggleTypingUser({channelId: "a", userId: "u1", typing: true}));
        expect(Object.keys(state.typingUsers.a)).toEqual(["u1"]);
        state = chatReducer(state, toggleTypingUser({channelId: "a", userId: "u1", typing: false}));
        expect(state.typingUsers.a).toBeUndefined();

        state = chatReducer(state, toggleTypingUser({channelId: "a", userId: "u1", typing: true}));
        state = chatReducer(state, deleteChannel("a"));
        expect(state.typingUsers.a).toBeUndefined();
        expect(state.channelsOrderIds).toEqual([]);
    });

    it("memoizes selectors across unrelated updates", () => {
        const chat = stateWith(channel("a"), channel("w", true));
        const root = {chat};
        const select = selectChannelOrderIdsByKind("internal");

        expect(select(root)).toEqual(["a"]);
        expect(selectChannelOrderIdsByKind("website")(root)).toEqual(["w"]);

        const afterUnrelated = {chat: chatReducer(chat, toggleTypingUser({channelId: "a", userId: "u1", typing: true}))};
        expect(select(afterUnrelated)).toBe(select(root));
        expect(selectInternalChatUnread(afterUnrelated)).toBe(0);
    });
});
