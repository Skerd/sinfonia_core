import { compose } from "redux";
import {useDispatch, useSelector} from "react-redux";
import {openChannel} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Fragment, RefObject, useEffect, useRef} from "react";
import {Info, Users} from "lucide-react";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Avatar} from "@coreModule/components/ui/avatar.tsx";
import CustomAvatar from "@coreModule/components/custom/customAvatar.tsx";
import CustomDateDisplayer from "@coreModule/components/custom/customDateDisplayer.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import ChannelsFetcher from "@coreModule/clients/panel/private/chat/left/channelsFetcher.tsx";
import LongText from "@coreModule/components/custom/longText.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {getName} from "@coreModule/helpers/general";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {MessageSenderType, MessageType} from "armonia/src/modules/core/api/user/private/chats/messages/messages.form.response.type.ts";
import {wireTextWithResolvedMentions} from "@coreModule/clients/panel/private/chat/center/chatInput/mentionWire.ts";

type ChannelProps = WithLanguageType & {
    channelId: string,
    index: number
}
function ChannelInfo({
    channelId,
    index,
    resolveLanguageKey,
}: ChannelProps){

    const {read} = useAccess("channels");
    const dispatch = useDispatch();
    const ref = useRef<HTMLButtonElement>(null);
    const user = useSelector((state: RootState) => state.authentication.user);
    const channel = useSelector((state: RootState) => state.chat.channels[channelId]);

    const avatarUser = channel.users?.find(u => u._id !== user.id) || null;
    const activeChannelId = useSelector( (state: RootState) => state.chat.activeChannelId );
    const typingUsers = useSelector((state: RootState) => state.chat.typingUsers?.[channelId]);

    function getTypingText(): string {
        const typers = typingUsers ? Object.keys(typingUsers).filter(uid => uid !== user.id) : [];
        if (typers.length === 0) return "";
        const channelMembers = channel?.users ?? [];
        const typingUserNames = typers
            .map(userId => channelMembers.find(m => m._id === userId)?.name)
            .filter(Boolean) as string[];
        if (typingUserNames.length === 1) {
            return `${typingUserNames[0]} ${resolveLanguageKey("isTyping")}`;
        }
        if (typingUserNames.length === 2) {
            return `${typingUserNames[0]} ${resolveLanguageKey("and")} ${typingUserNames[1]} ${resolveLanguageKey("areTyping")}`;
        }
        if (typingUserNames.length > 2) {
            return `${typingUserNames[0]} ${resolveLanguageKey("and")} ${typingUserNames.length - 1} ${resolveLanguageKey("others")} ${resolveLanguageKey("areTyping")}`;
        }
        return "";
    }

    function youOrOther(messageUser: MessageSenderType, toLowerCase?: boolean): string {
        if( messageUser?._id === user.id ){
            if( toLowerCase ){
                return resolveLanguageKey("you").toLowerCase();
            }
            return resolveLanguageKey("you");
        }
        return `${messageUser.name} ${messageUser.surname}`
    }
    function getUnreadMessages(messages: number){
        let messageCount = messages + "";
        if( messages > 99 ){
            messageCount = "99+"
        }

        return (
            <TooltipDisplayer tooltip={`${messages} ${resolveLanguageKey("unreadMessages")}`}>
                <span className="ms-auto flex size-5 shrink-0 items-center justify-center rounded-full bg-green-500 text-[10px] font-medium text-white dark:bg-green-800">
                    {messageCount}
                </span>
            </TooltipDisplayer>
        )
    }
    function lastMessageBodyWithMentions(message: MessageType): string {
        return wireTextWithResolvedMentions(
            message.message,
            message.mentionedUsers,
            channel?.users,
            resolveLanguageKey("unknown")
        );
    }

    function getLastMessage(message: MessageType){
        if( !message){
            return <></>
        }
        return (
            <div className="flex space-x-0.5 overflow-hidden">
                {
                    channel?.metaData?.isGroup ?
                    <>
                        {
                            message.type === "notification" ?
                            <>
                                <Info size={14} />
                                <div className="flex-full">
                                    <LongText className='max-w-full'>
                                        {
                                            !!message.receiver ?
                                            `${youOrOther(message.sender)} ${resolveLanguageKey(message.message)} ${youOrOther(message.receiver, true)}`
                                            :
                                            `${youOrOther(message.sender)} ${resolveLanguageKey(message.message)}`
                                        }
                                    </LongText>
                                </div>
                            </>
                            :
                            <div className="flex-full">
                                <LongText className='max-w-full'>
                                    {
                                        (message.status === "deleted") ?
                                        resolveLanguageKey("messageDeleted")
                                        :
                                       `${youOrOther(message.sender)} ${lastMessageBodyWithMentions(message)}`
                                    }
                                </LongText>
                            </div>
                        }
                    </>
                    :
                    <div className="flex-full">
                        <LongText className='max-w-full'>
                            {lastMessageBodyWithMentions(message)}
                        </LongText>
                    </div>
                }
            </div>
        )
    }

    useEffect(() => {
        if( !!ref && !!activeChannelId && channel && activeChannelId === channel._id ){
            setTimeout(() => {
                ref?.current?.scrollIntoView({ behavior: "smooth" });
            }, 10)
        }
    }, [ref, activeChannelId]);

    if( !read ){
        return <HiddenElement />
    }

    return (
        <Fragment key={channelId + "_" + index}>
            <button
                type='button'
                ref={ref}
                className={cn(
                    "group relative flex min-w-0 w-full cursor-pointer items-center gap-3 px-2 py-3 text-start hover:bg-muted/50",
                    activeChannelId === channel._id && "bg-muted"
                )}
                onClick={() => {
                    dispatch(openChannel(channel._id));
                }}
            >
                {
                    channel.metaData.isGroup ?
                    <Avatar className="flex size-10 shrink-0 items-center justify-center border">
                        <Users size={18} />
                    </Avatar>
                    :
                    <HiddenElement Render={<Avatar className="flex size-10 shrink-0 items-center justify-center border"><Users size={18} /></Avatar>}>
                        {
                            read.users &&
                            <>
                                {
                                    !!avatarUser &&
                                    <CustomAvatar user={avatarUser}/>
                                }
                            </>
                        }
                    </HiddenElement>
                }

                <div className="min-w-0 grow">
                    <div className="flex items-center justify-between gap-2">
                        {
                            (channel.metaData.isGroup) ?
                            <HiddenElement>
                                {read.name && <p className="truncate text-sm font-medium">{channel.name}</p>}
                            </HiddenElement>
                            :
                            <HiddenElement>
                                {
                                    read.users &&
                                    <>
                                        {
                                            !!avatarUser &&
                                            <p className="truncate text-sm font-medium">{getName(avatarUser)}</p>
                                        }
                                    </>
                                }
                            </HiddenElement>
                        }
                        {
                            !!channel.metaData?.lastMessage?.date &&
                            <span className="shrink-0 text-muted-foreground text-xs">
                                <CustomDateDisplayer timeZone={user.timezone} date={channel.metaData.lastMessage?.date} showOnlyWeekDay={true} showOnlyYesterday={true} />
                            </span>
                        }
                    </div>
                    {
                        (() => {
                            const isChannelOpened = activeChannelId === channel._id;
                            const typingText = !isChannelOpened ? getTypingText() : "";
                            const unread = channel.metaData?.unreadMessages ?? 0;
                            if (typingText) {
                                return (
                                    <div className="flex items-center gap-2">
                                        <span className="min-w-0 grow truncate text-sm italic text-muted-foreground animate-pulse">
                                            {typingText}
                                        </span>
                                        {unread > 0 ? getUnreadMessages(unread) : null}
                                    </div>
                                );
                            }
                            if (channel?.metaData?.lastMessage) {
                                return (
                                    <div className="flex items-center gap-2">
                                        <span className="min-w-0 grow truncate text-sm text-muted-foreground">
                                            {getLastMessage(channel.metaData.lastMessage)}
                                        </span>
                                        {unread > 0 ? getUnreadMessages(unread) : null}
                                    </div>
                                );
                            }
                            if (unread > 0) {
                                return (
                                    <div className="flex items-center justify-end">
                                        {getUnreadMessages(unread)}
                                    </div>
                                );
                            }
                            return null;
                        })()
                    }
                </div>
            </button>
        </Fragment>
    )
}
const ChannelRender = compose(
    withLanguage("src/modules/core/clients/panel/private/chat/left/channelsList.tsx"),
    withDebug(true, true)
)(ChannelInfo);


type ChannelsListProps = WithLanguageType & {
    searchName: string,
    scrollRoot: RefObject<HTMLElement>
}

function ChannelsList({searchName, scrollRoot, resolveLanguageKey}: ChannelsListProps){

    const {read} = useAccess("channels");
    const channelsOrderIds = useSelector((state: RootState) => state.chat.channelsOrderIds);

    if( !read ){
        return <HiddenElement />
    }

    const isEmpty = (!channelsOrderIds || channelsOrderIds.length === 0) && !searchName;

    return (
        <>
            {
                isEmpty &&
                <div className="flex flex-col items-center justify-center space-y-0 py-4">
                    <p className="text-sm font-semibold text-foreground">{resolveLanguageKey("noChats")}...</p>
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
                         className="text-muted-foreground">
                        <path d="M16 7h.01"></path>
                        <path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"></path>
                        <path d="m20 7 2 .5-2 .5"></path>
                        <path d="M10 18v3"></path>
                        <path d="M14 17.75V21"></path>
                        <path d="M7 18a6 6 0 0 0 3.84-10.61"></path>
                    </svg>
                </div>
            }
            <div className="divide-y">
                {
                    channelsOrderIds?.map((id, index) => {
                        return (
                            <ChannelRender
                                key={id}
                                channelId={id}
                                index={index}
                            />
                        )
                    })
                }
            </div>
            <ChannelsFetcher searchName={searchName} scrollRoot={scrollRoot} />
        </>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/left/channelsList.tsx"),
    withDebug(true, true)
)(ChannelsList);