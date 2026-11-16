import type {ChannelUser} from "armonia/src/modules/core/dto/channel.dto";
import type {SimpleUser} from "armonia/src/modules/core/dto/user.dto";
import {
    MENTION_TOKEN_SOURCE,
    recordToken,
    splitChatText,
    type MessageRecordRef,
} from "armonia/src/modules/core/helpers/chatTokens";
import {getName} from "@coreModule/helpers/general/names.ts";

/** The stored mention, `@` + a 24-hex user id (armonia `chatTokens`, shared with Maestro). */
export const MENTION_WIRE_REGEX = new RegExp(MENTION_TOKEN_SOURCE, "g");

/**
 * react-mentions `Mention` markup template (__display__ / __id__ placeholders).
 * Pass explicitly: React 19 does not apply `defaultProps` on function components.
 */
export const REACT_MENTIONS_MARKUP = "@[__display__](__id__)" as const;

/** react-mentions markup of a shared record (D162): `__id__` is `collection:recordId`, see {@link recordMentionId}. */
export const RECORD_MENTIONS_MARKUP = "@{__id__|__display__}" as const;

/** Parsed form of REACT_MENTIONS_MARKUP (display + id capturing groups) */
const MENTION_MARKUP_REGEX = /@\[([^\]]*)\]\(([a-fA-F0-9]{24})\)/g;

/** Parsed form of RECORD_MENTIONS_MARKUP (collection, id, display). */
const RECORD_MARKUP_REGEX = /@\{([A-Za-z0-9_]+):([a-fA-F0-9]{24})\|([^}]*)\}/g;

/** A record's react-mentions id. */
export function recordMentionId(ref: MessageRecordRef): string {
    return `${ref.collection}:${ref.id}`;
}

/** The record a react-mentions id names, or `null` for a user's id. */
export function recordRefOfMentionId(id: string): MessageRecordRef | null {
    const match = /^([A-Za-z0-9_]+):([a-fA-F0-9]{24})$/.exec(id);
    return match ? {collection: match[1], id: match[2].toLowerCase()} : null;
}

/** A label safe inside the record markup: a `}` would end the markup early. */
export function recordMentionDisplay(label: string): string {
    return label.replace(/[}\n\r]/g, " ").trim() || "…";
}

export function mentionsMarkupToWire(markupValue: string): string {
    return markupValue
        .replace(MENTION_MARKUP_REGEX, (_full, _display: string, id: string) => `@${id}`)
        .replace(RECORD_MARKUP_REGEX, (_full, collection: string, id: string) => recordToken({collection, id}));
}

/** Plain visible text (@Display) for typing indicators — mirrors `getPlainText` with default markup */
export function mentionsMarkupToPlainDisplay(markupValue: string): string {
    return markupValue
        .replace(MENTION_MARKUP_REGEX, (_full, display: string) => `@${display}`)
        .replace(RECORD_MARKUP_REGEX, (_full, _collection: string, _id: string, display: string) => `@${display}`);
}

function resolveLabel(
    userId: string,
    mentionedUsers: SimpleUser[] | undefined,
    channelUsers: ChannelUser[] | undefined
): string {
    const fromMention = mentionedUsers?.find((u) => u._id === userId);
    if (fromMention) {
        return getName(fromMention);
    }
    const fromChannel = channelUsers?.find((u) => u._id === userId);
    if (fromChannel) {
        return getName(fromChannel);
    }
    return userId;
}

/** A shared record's label as the reader may see it; the caller supplies it (live, per reader, D162). */
export type RecordLabel = (ref: MessageRecordRef) => string;

/**
 * Builds react-mentions value from persisted message text (wire format) for edit mode.
 */
export function wireTextToMentionsMarkup(
    wire: string,
    mentionedUsers: SimpleUser[] | undefined,
    channelUsers: ChannelUser[] | undefined,
    recordLabel: RecordLabel,
): string {
    return splitChatText(wire).map((part) => {
        if (part.kind === "text") return part.text;
        if (part.kind === "mention") return `@[${resolveLabel(part.userId, mentionedUsers, channelUsers)}](${part.userId})`;
        return `@{${recordMentionId(part.ref)}|${recordMentionDisplay(recordLabel(part.ref))}}`;
    }).join("");
}

/**
 * Replaces wire-format tokens with `@{display}`: users from `mentionedUsers` and channel members, records through
 * `recordLabel`. For compact previews (e.g. channel list) where react-mentions popovers are not used.
 */
export function wireTextWithResolvedMentions(
    wire: string,
    mentionedUsers: SimpleUser[] | undefined,
    channelUsers: ChannelUser[] | undefined,
    unknownLabel: string | undefined,
    recordLabel: RecordLabel,
): string {
    return splitChatText(wire).map((part) => {
        if (part.kind === "text") return part.text;
        if (part.kind === "record") return `@${recordLabel(part.ref)}`;
        const label = resolveLabel(part.userId, mentionedUsers, channelUsers);
        return `@${label === part.userId ? unknownLabel ?? part.userId : label}`;
    }).join("");
}
