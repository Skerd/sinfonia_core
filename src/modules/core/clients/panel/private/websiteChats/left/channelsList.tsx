import {compose} from "redux";
import {useDispatch, useSelector} from "react-redux";
import {decrementWaitingCount, openChannel, selectChannelOrderIdsByKind, upsertChannel} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Fragment, type MouseEvent, RefObject, useState} from "react";
import {Globe, UserCheck} from "lucide-react";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Avatar} from "@coreModule/components/ui/avatar.tsx";
import CustomAvatar from "@coreModule/components/custom/customAvatar.tsx";
import CustomDateDisplayer from "@coreModule/components/custom/customDateDisplayer.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import LongText from "@coreModule/components/custom/longText.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {getName} from "@coreModule/helpers/general";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {MessageType} from "armonia/src/modules/core/api/user/private/chats/messages/messages.form.response.type.ts";
import {wireTextWithResolvedMentions} from "@coreModule/clients/panel/private/chat/center/chatInput/mentionWire.ts";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";
import type {Channel} from "armonia/src/modules/core/api/user/private/chats/channels/channels.form.response.type.ts";
import type {PublicChatInboxFilter} from "armonia/src/modules/core/api/user/private/chats/channels/channels.constants.ts";
import WebsiteChannelsFetcher from "@coreModule/clients/panel/private/websiteChats/left/channelsFetcher.tsx";

type ChannelProps = WithLanguageType & {
    channelId: string;
    index: number;
    websiteChannels: PublicChatInboxFilter;
};

function WebsiteChannelInfo({
    channelId,
    index,
    websiteChannels,
    resolveLanguageKey,
}: ChannelProps) {
    const {read, write} = useAccess("channels");
    const canTakeOver = write === true || (!!write && typeof write === "object" && !!write.users);
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.authentication.user);
    const channel = useSelector((state: RootState) => state.chat.channels[channelId]);
    const avatarUser = channel?.users?.find((u) => u._id !== user.id) || null;
    const activeChannelId = useSelector((state: RootState) => state.chat.activeChannelId);
    const [joining, setJoining] = useState(false);

    function getUnreadMessages(messages: number) {
        let messageCount = messages + "";
        if (messages > 99) {
            messageCount = "99+";
        }
        return (
            <TooltipDisplayer tooltip={`${messages} ${resolveLanguageKey("unreadMessages")}`}>
                <span className="ms-auto flex size-5 shrink-0 items-center justify-center rounded-full bg-success text-3xs font-medium text-success-foreground">
                    {messageCount}
                </span>
            </TooltipDisplayer>
        );
    }

    function lastMessageBodyWithMentions(message: MessageType): string {
        return wireTextWithResolvedMentions(
            message.message,
            message.mentionedUsers,
            channel?.users,
            resolveLanguageKey("unknown"),
        );
    }

    async function handleTakeOver(event: MouseEvent) {
        event.stopPropagation();
        if (!canTakeOver || joining) {
            return;
        }
        setJoining(true);
        try {
            const {data} = await apiClient.post<Channel>(
                "/api/user/chats/channels/join",
                {_id: channel._id},
            );
            dispatch(upsertChannel(data));
            dispatch(decrementWaitingCount());
            dispatch(openChannel(data._id));
        }
        catch {
            // Someone else took it, or the join was rejected.
        }
        finally {
            setJoining(false);
        }
    }

    if (!read || !channel || !channel.metaData?.isPublicChat) {
        return <HiddenElement />;
    }

    const unread = channel.metaData?.unreadMessages ?? 0;
    const isWaiting = websiteChannels === "waiting" && channel.metaData?.publicChatStatus !== "human";
    const displayName = channel.name || (avatarUser ? getName(avatarUser) : resolveLanguageKey("anonymousVisitor"));

    return (
        <Fragment key={channelId + "_" + index}>
            <div
                className={cn(
                    "group relative flex min-w-0 w-full items-center gap-3 px-2 py-3 text-start",
                    !isWaiting && "cursor-pointer hover:bg-muted/50",
                    isWaiting && "hover:bg-muted/30",
                    activeChannelId === channel._id && "bg-muted",
                )}
                onClick={() => {
                    if (!isWaiting) {
                        dispatch(openChannel(channel._id));
                    }
                }}
                role={!isWaiting ? "button" : undefined}
            >
                {avatarUser ? (
                    <CustomAvatar user={avatarUser} />
                ) : (
                    <Avatar className="flex size-10 shrink-0 items-center justify-center border">
                        <Globe size={18} />
                    </Avatar>
                )}

                <div className="min-w-0 grow">
                    <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{displayName}</p>
                        {channel.metaData?.lastMessage?.date && (
                            <span className="shrink-0 text-muted-foreground text-xs">
                                <CustomDateDisplayer
                                    timeZone={user.timezone}
                                    date={channel.metaData.lastMessage?.date}
                                    showOnlyWeekDay={true}
                                    showOnlyYesterday={true}
                                />
                            </span>
                        )}
                    </div>
                    {channel.metaData?.lastMessage ? (
                        <div className="flex items-center gap-2">
                            <span className="min-w-0 grow truncate text-sm text-muted-foreground">
                                <LongText className="max-w-full">
                                    {channel.metaData.lastMessage.status === "deleted"
                                        ? resolveLanguageKey("messageDeleted")
                                        : lastMessageBodyWithMentions(channel.metaData.lastMessage)}
                                </LongText>
                            </span>
                            {unread > 0 ? getUnreadMessages(unread) : null}
                        </div>
                    ) : unread > 0 ? (
                        <div className="flex items-center justify-end">
                            {getUnreadMessages(unread)}
                        </div>
                    ) : null}

                    {isWaiting && canTakeOver && (
                        <div className="pt-2">
                            <button
                                type="button"
                                disabled={joining}
                                onClick={(event) => void handleTakeOver(event)}
                                className="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs disabled:opacity-50"
                            >
                                <UserCheck size={13} />
                                {joining ? resolveLanguageKey("joining") : resolveLanguageKey("takeOver")}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Fragment>
    );
}

const WebsiteChannelRender = compose(
    withLanguage("src/modules/core/clients/panel/private/websiteChats/left/channelsList.tsx"),
    withDebug(true, true),
)(WebsiteChannelInfo);

type WebsiteChannelsListProps = WithLanguageType & {
    searchName: string;
    scrollRoot: RefObject<HTMLElement>;
    websiteChannels: PublicChatInboxFilter;
};

function WebsiteChannelsList({searchName, scrollRoot, websiteChannels, resolveLanguageKey}: WebsiteChannelsListProps) {
    const {read} = useAccess("channels");
    const channels = useSelector((state: RootState) => state.chat.channels);
    const websiteChannelIds = useSelector(selectChannelOrderIdsByKind("website"));
    const channelsOrderIds = websiteChannelIds.filter((channelId) => {
        const status = channels[channelId]?.metaData?.publicChatStatus;
        if (websiteChannels === "waiting") {
            return status !== "human";
        }
        if (websiteChannels === "mine") {
            return status === "human";
        }
        return true;
    });

    if (!read) {
        return <HiddenElement />;
    }

    const isEmpty = (!channelsOrderIds || channelsOrderIds.length === 0) && !searchName;

    return (
        <>
            {isEmpty && (
                <div className="flex flex-col items-center justify-center gap-y-0 py-4">
                    <p className="text-sm font-semibold text-foreground">
                        {resolveLanguageKey(websiteChannels === "mine" ? "noMine" : "noWaiting")}
                    </p>
                </div>
            )}
            <div className="divide-y">
                {channelsOrderIds?.map((id, index) => (
                    <WebsiteChannelRender
                        key={id}
                        channelId={id}
                        index={index}
                        websiteChannels={websiteChannels}
                    />
                ))}
            </div>
            <WebsiteChannelsFetcher
                searchName={searchName}
                scrollRoot={scrollRoot}
                websiteChannels={websiteChannels}
            />
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/websiteChats/left/channelsList.tsx"),
    withDebug(true, true),
)(WebsiteChannelsList);
