import {beforeEach, describe, expect, it, vi} from "vitest";

const {postMock, sendReceiptsNowMock} = vi.hoisted(() => ({postMock: vi.fn(), sendReceiptsNowMock: vi.fn()}));

vi.mock("@baseModule/helpers/apiClient/apiClient.ts", () => ({default: {post: postMock}}));
vi.mock("@baseModule/helpers/chat/messageReceipts.ts", () => ({sendReceiptsNow: sendReceiptsNowMock}));

import {
    CHAT_API,
    handleWebSocketMessage,
    PUBLIC_CHAT_HANDOFF_CODE,
    type WebSocketMessageContext,
} from "@baseModule/helpers/websocket/webSocketMessages.ts";
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

const USER_ID = "me";

let dispatch: ReturnType<typeof vi.fn>;
let context: WebSocketMessageContext;
let errorLog: ReturnType<typeof vi.spyOn>;

/** Sends one frame the way the socket delivers it (JSON text). */
const receive = (code: string, payload?: unknown, ctx = context) =>
    handleWebSocketMessage(JSON.stringify({code, payload}), ctx);

/** Lets `.then` / `.catch` callbacks of the mocked requests run. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
    postMock.mockReset();
    sendReceiptsNowMock.mockReset();
    dispatch = vi.fn();
    context = {dispatch: dispatch as never, userId: USER_ID};
    errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    return () => errorLog.mockRestore();
});

describe("frame parsing", () => {
    it.each([
        ["non-JSON text", "not json"],
        ["a non-string frame", new ArrayBuffer(2)],
        ["JSON without a code", JSON.stringify({payload: {}})],
        ["a non-string code", JSON.stringify({code: 42})],
        ["a JSON array", JSON.stringify(["NEW_MESSAGE"])],
        ["JSON null", "null"],
        ["an unknown code", JSON.stringify({code: "SOMETHING_ELSE", payload: {}})],
        ["an inherited property name as code", JSON.stringify({code: "toString", payload: {}})],
    ])("ignores %s", (_label, data) => {
        expect(() => handleWebSocketMessage(data, context)).not.toThrow();
        expect(dispatch).not.toHaveBeenCalled();
        expect(postMock).not.toHaveBeenCalled();
    });

    it("ignores known codes whose payload is not an object", () => {
        receive("CHANNEL_DELETED", "c1");
        receive("TYPING_START", null);
        receive("MESSAGE_DELETED", ["m1"]);
        expect(dispatch).not.toHaveBeenCalled();
    });

    it("logs a throwing handler instead of propagating", () => {
        dispatch.mockImplementation(() => {
            throw new Error("reducer blew up");
        });
        expect(() => receive("CHANNEL_DELETED", {channelId: "c1"})).not.toThrow();
        expect(errorLog).toHaveBeenCalledWith(expect.stringContaining("[WebSocket] reducer blew up"), expect.anything());
    });
});

describe("direct store updates", () => {
    it.each([
        ["CHANNEL_USER_DEMOTED_FROM_ADMIN", {channelId: "c1", userId: "u1"}, demoteToUser],
        ["CHANNEL_USER_PROMOTED_TO_ADMIN", {channelId: "c1", userId: "u1"}, promoteToAdmin],
        ["CHANNEL_DESCRIPTION_UPDATED", {_id: "c1", description: "d"}, upsertChannel],
        ["TYPING_START", {channelId: "c1", userId: "u1", typing: true}, toggleTypingUser],
        ["TYPING_STOP", {channelId: "c1", userId: "u1", typing: false}, toggleTypingUser],
        ["ServerHealthUpdater", {mongo: {}}, updateServerHealth],
        ["ServerStatsUpdater", {users: 3}, updateServerStats],
    ] as const)("%s passes the payload through", (code, payload, action) => {
        receive(code, payload);
        expect(dispatch).toHaveBeenCalledExactlyOnceWith((action as (p: unknown) => unknown)(payload));
    });

    it("CHANNEL_MEMBER_REMOVED includes the current user", () => {
        const payload = {channelId: "c1", removedMembers: ["u1"], messageIds: ["m1"]};
        receive("CHANNEL_MEMBER_REMOVED", payload);
        expect(dispatch).toHaveBeenCalledWith(removeUsersFromChannel({data: payload as never, userId: USER_ID}));
    });

    it("CHANNEL_DELETED removes the channel", () => {
        receive("CHANNEL_DELETED", {channelId: "c1"});
        expect(dispatch).toHaveBeenCalledExactlyOnceWith(deleteChannel("c1"));
    });

    it("CHANNEL_MEMBER_LEFT maps to a single-member removal", () => {
        receive("CHANNEL_MEMBER_LEFT", {channelId: "c1", userId: "u1", messageId: "m1"});
        expect(dispatch).toHaveBeenCalledExactlyOnceWith(removeUsersFromChannel({
            data: {channelId: "c1", removedMembers: ["u1"], messageIds: ["m1"]},
            userId: USER_ID,
        }));
    });

    it("CHANNEL_MEMBER_LEFT without a system message removes no messages", () => {
        receive("CHANNEL_MEMBER_LEFT", {channelId: "c1", userId: "u1"});
        expect(dispatch).toHaveBeenCalledExactlyOnceWith(removeUsersFromChannel({
            data: {channelId: "c1", removedMembers: ["u1"], messageIds: []},
            userId: USER_ID,
        }));
    });

    it("MESSAGE_DELETED keeps only string ids", () => {
        receive("MESSAGE_DELETED", {channelId: "c1", messageIds: ["m1", 2, null, "m2"]});
        expect(dispatch).toHaveBeenCalledExactlyOnceWith(updateDeletedMessageIds(["m1", "m2"]));
    });

    it("MESSAGE_UNPINNED clears the pin", () => {
        receive("MESSAGE_UNPINNED", {channelId: "c1", messageId: "m1"});
        expect(dispatch).toHaveBeenCalledExactlyOnceWith(updateMessagePinned({messageId: "m1", pinned: null}));
    });

    it.each([
        ["CHANNEL_DELETED", {}],
        ["CHANNEL_MEMBER_LEFT", {channelId: "c1"}],
        ["MESSAGE_DELETED", {messageIds: []}],
        ["MESSAGE_UNPINNED", {messageId: ""}],
    ])("%s without the needed ids does nothing", (code, payload) => {
        receive(code, payload);
        expect(dispatch).not.toHaveBeenCalled();
    });
});

describe("fetch-then-update", () => {
    const message = {_id: "m1", message: "hi", sender: {_id: "other"}};

    it.each(["CHANNEL_CREATED", "CHANNEL_MEMBER_ADDED"])("%s loads and upserts the channel", async (code) => {
        const channel = {_id: "c1", name: "General"};
        postMock.mockResolvedValue({data: channel});

        receive(code, {channelId: "c1"});
        await flush();

        expect(postMock).toHaveBeenCalledExactlyOnceWith(CHAT_API.channel, {id: "c1"});
        expect(dispatch).toHaveBeenCalledExactlyOnceWith(upsertChannel(channel as never));
    });

    it("NEW_MESSAGE adds the message and acknowledges delivery", async () => {
        postMock.mockResolvedValue({data: message});

        receive("NEW_MESSAGE", {channelId: "c1", messageId: "m1"});
        await flush();

        expect(postMock).toHaveBeenCalledExactlyOnceWith(CHAT_API.message, {messageId: "m1"});
        expect(dispatch).toHaveBeenCalledExactlyOnceWith(newMessage({channelId: "c1", message: message as never}));
        expect(sendReceiptsNowMock).toHaveBeenCalledExactlyOnceWith("c1", ["m1"], "delivered");
    });

    it("NEW_MESSAGE does not acknowledge own messages", async () => {
        postMock.mockResolvedValue({data: {...message, sender: {_id: USER_ID}}});
        receive("NEW_MESSAGE", {channelId: "c1", messageId: "m1"});
        await flush();
        expect(dispatch).toHaveBeenCalledOnce();
        expect(sendReceiptsNowMock).not.toHaveBeenCalled();
    });

    it("NEW_MESSAGE does not acknowledge without a signed-in user", async () => {
        postMock.mockResolvedValue({data: message});
        receive("NEW_MESSAGE", {channelId: "c1", messageId: "m1"}, {dispatch: dispatch as never, userId: undefined});
        await flush();
        expect(sendReceiptsNowMock).not.toHaveBeenCalled();
    });

    it("MESSAGE_EDITED replaces the text", async () => {
        postMock.mockResolvedValue({data: {...message, message: "edited"}});
        receive("MESSAGE_EDITED", {channelId: "c1", messageId: "m1"});
        await flush();
        expect(dispatch).toHaveBeenCalledExactlyOnceWith(editMessage({messageId: "m1", message: "edited"} as never));
    });

    it("MESSAGE_PINNED stores the pin", async () => {
        const pin = {pinnedBy: "u1"};
        postMock.mockResolvedValue({data: pin});
        receive("MESSAGE_PINNED", {channelId: "c1", messageId: "m1"});
        await flush();
        expect(postMock).toHaveBeenCalledWith(CHAT_API.pin, {messageId: "m1"});
        expect(dispatch).toHaveBeenCalledExactlyOnceWith(updateMessagePinned({messageId: "m1", pinned: pin as never}));
    });

    it("MESSAGE_REACTION replaces the reactions", async () => {
        const reactions = [{emoji: "👍", users: ["u1"]}];
        postMock.mockResolvedValue({data: {reactions}});
        receive("MESSAGE_REACTION", {channelId: "c1", messageId: "m1"});
        await flush();
        expect(postMock).toHaveBeenCalledWith(CHAT_API.reactions, {messageId: "m1"});
        expect(dispatch).toHaveBeenCalledExactlyOnceWith(replaceMessageReactions({messageId: "m1", reactions: reactions as never}));
    });

    it("MESSAGE_RECEIPT_UPDATED merges the message", async () => {
        postMock.mockResolvedValue({data: message});
        receive("MESSAGE_RECEIPT_UPDATED", {channelId: "c1", messageId: "m1"});
        await flush();
        expect(dispatch).toHaveBeenCalledExactlyOnceWith(mergeMessageFromServer(message as never));
    });

    it.each([
        ["CHANNEL_CREATED", {}],
        ["NEW_MESSAGE", {messageId: "m1"}],
        ["NEW_MESSAGE", {channelId: "c1"}],
        ["MESSAGE_EDITED", {channelId: "c1"}],
        ["MESSAGE_PINNED", {messageId: 5}],
        ["MESSAGE_REACTION", {}],
        ["MESSAGE_RECEIPT_UPDATED", {}],
    ])("%s without the needed ids does not fetch", (code, payload) => {
        receive(code, payload);
        expect(postMock).not.toHaveBeenCalled();
    });

    it("logs a failed follow-up fetch and leaves the store alone", async () => {
        postMock.mockRejectedValue(new Error("offline"));
        receive("NEW_MESSAGE", {channelId: "c1", messageId: "m1"});
        await flush();
        expect(dispatch).not.toHaveBeenCalled();
        expect(errorLog).toHaveBeenCalledWith(expect.stringContaining("[WebSocket] offline"), expect.anything());
    });
});

describe("NEW_NOTIFICATIONS", () => {
    const note = (overrides: Record<string, unknown> = {}) => ({_id: "n", code: "SOMETHING", ...overrides});

    it("prepends, counts unread and remembers the newest", () => {
        const notifications = [note({_id: "n1"}), note({_id: "n2", readOn: "2026-01-01"}), note({_id: "n3"})];
        receive("NEW_NOTIFICATIONS", notifications);

        expect(dispatch.mock.calls.map(([action]) => action)).toEqual([
            prependNotificationItems(notifications as never),
            incrementUnreadNotifications(2),
            setLatestNotification(notifications[0] as never),
        ]);
        expect(postMock).not.toHaveBeenCalled();
    });

    it.each([[[]], [null], [{}]])("ignores an empty or invalid list (%j)", (payload) => {
        receive("NEW_NOTIFICATIONS", payload);
        expect(dispatch).not.toHaveBeenCalled();
    });

    it("bumps the waiting count once and loads each handed-off channel once", () => {
        postMock.mockResolvedValue({data: {}});
        receive("NEW_NOTIFICATIONS", [
            note({code: PUBLIC_CHAT_HANDOFF_CODE, content: {channelId: "c1"}}),
            note({code: PUBLIC_CHAT_HANDOFF_CODE, content: {channelId: "c1"}}),
            note({code: PUBLIC_CHAT_HANDOFF_CODE, content: {channelId: "c2"}}),
            note({code: PUBLIC_CHAT_HANDOFF_CODE, content: {}}),
            note(),
        ]);

        expect(dispatch.mock.calls.filter(([action]) => action.type === incrementWaitingCount().type)).toHaveLength(1);
        expect(postMock.mock.calls).toEqual([
            [CHAT_API.channel, {id: "c1"}],
            [CHAT_API.channel, {id: "c2"}],
        ]);
    });
});

describe("JOIN_ROOM acknowledgement", () => {
    it("logs rooms the server refused", () => {
        receive("JOIN_ROOM", {joined: ["home"], alreadyJoined: [], failed: ["secret", "other"]});
        expect(errorLog).toHaveBeenCalledWith("[WebSocket] Could not join rooms: secret, other", expect.anything());
        expect(dispatch).not.toHaveBeenCalled();
    });

    it("stays quiet when every room was joined", () => {
        receive("JOIN_ROOM", {joined: ["home"], alreadyJoined: ["chats"], failed: []});
        expect(errorLog).not.toHaveBeenCalled();
    });
});
