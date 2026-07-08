import type {ChannelUser} from "armonia/src/modules/core/types";
import type {MessageSenderType} from "armonia/src/modules/core/api/user/private/chats/messages/messages.form.response.type.ts";
import {getName} from "@coreModule/helpers/general";

/** Matches Maestro `parseMentions`: @ + 24 hex ObjectId */
export const MENTION_WIRE_REGEX = /@([a-fA-F0-9]{24})(?![a-fA-F0-9])/g;

/**
 * react-mentions `Mention` markup template (__display__ / __id__ placeholders).
 * Pass explicitly: React 19 does not apply `defaultProps` on function components.
 */
export const REACT_MENTIONS_MARKUP = "@[__display__](__id__)" as const;

/** Parsed form of REACT_MENTIONS_MARKUP (display + id capturing groups) */
const MENTION_MARKUP_REGEX = /@\[([^\]]*)\]\(([a-fA-F0-9]{24})\)/g;

export function mentionsMarkupToWire(markupValue: string): string {
    return markupValue.replace(MENTION_MARKUP_REGEX, (_full, _display: string, id: string) => `@${id}`);
}

/** Plain visible text (@Display) for typing indicators — mirrors `getPlainText` with default markup */
export function mentionsMarkupToPlainDisplay(markupValue: string): string {
    return markupValue.replace(MENTION_MARKUP_REGEX, (_full, display: string) => `@${display}`);
}

function resolveLabel(
    userId: string,
    mentionedUsers: MessageSenderType[] | undefined,
    channelUsers: ChannelUser[] | undefined
): string {
    const fromMention = mentionedUsers?.find((u) => u.id === userId);
    if (fromMention) {
        return getName(fromMention);
    }
    const fromChannel = channelUsers?.find((u) => u._id === userId);
    if (fromChannel) {
        return getName(fromChannel);
    }
    return userId;
}

/**
 * Builds react-mentions value from persisted message text (wire format) for edit mode.
 */
export function wireTextToMentionsMarkup(
    wire: string,
    mentionedUsers: MessageSenderType[] | undefined,
    channelUsers: ChannelUser[] | undefined
): string {
    if (!wire) {
        return "";
    }
    let result = "";
    let last = 0;
    const re = new RegExp(MENTION_WIRE_REGEX.source, "g");
    let match: RegExpExecArray | null;
    while ((match = re.exec(wire)) !== null) {
        result += wire.slice(last, match.index);
        const id = match[1];
        const label = resolveLabel(id, mentionedUsers, channelUsers);
        result += `@[${label}](${id})`;
        last = match.index + match[0].length;
    }
    result += wire.slice(last);
    return result;
}

/**
 * Replaces wire-format @ObjectId tokens with @{display} using `mentionedUsers` and channel members.
 * For compact previews (e.g. channel list) where react-mentions popovers are not used.
 */
export function wireTextWithResolvedMentions(
    wire: string,
    mentionedUsers: MessageSenderType[] | undefined,
    channelUsers: ChannelUser[] | undefined,
    unknownLabel?: string
): string {
    if (!wire) {
        return "";
    }
    let result = "";
    let last = 0;
    const re = new RegExp(MENTION_WIRE_REGEX.source, "g");
    let match: RegExpExecArray | null;
    while ((match = re.exec(wire)) !== null) {
        result += wire.slice(last, match.index);
        const id = match[1];
        const label = resolveLabel(id, mentionedUsers, channelUsers);
        const display = label === id ? unknownLabel ?? id : label;
        result += `@${display}`;
        last = match.index + match[0].length;
    }
    result += wire.slice(last);
    return result;
}
