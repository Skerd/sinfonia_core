import {ReactNode, useEffect, useRef, useState} from "react";
import {cn} from "@coreModule/components/lib/utils.ts";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {ContextMenu, ContextMenuContent, ContextMenuTrigger} from "@coreModule/components/ui/context-menu.tsx";
import {Forward, CircleSlash, Pin, User, Calendar, Check, CheckCheck} from "lucide-react";
import {toggleDeleteMessageId, updateOpenDelete} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import CustomAvatar from "@coreModule/components/custom/customAvatar.tsx";
import LongText from "@coreModule/components/custom/longText.tsx";
import DeleteMessage from "@coreModule/clients/panel/private/chat/center/messages/message/contextActions/deleteMessage.tsx";
import PinMessage from "@coreModule/clients/panel/private/chat/center/messages/message/contextActions/pinMessage.tsx";
import UnpinMessage from "@coreModule/clients/panel/private/chat/center/messages/message/contextActions/unpinMessage.tsx";
import ReactMessage from "@coreModule/clients/panel/private/chat/center/messages/message/contextActions/react.tsx";
import {Channel} from "armonia/src/modules/core/api/user/private/chats/channels/channels.form.response.type.ts";
import ReactToMessage from "@coreModule/clients/panel/private/chat/center/messages/message/actions/addReaction.tsx";
import {useOutsideClick} from "@coreModule/helpers/hooks/useOutsideClick.ts";
import ToggleDelete from "@coreModule/clients/panel/private/chat/center/messages/message/actions/toggleDelete.tsx";
import {formatDate, getName} from "@coreModule/helpers/general";
import Reactions from "@coreModule/clients/panel/private/chat/center/messages/message/info/reactions.tsx";
import ReplyMessage from "@coreModule/clients/panel/private/chat/center/messages/message/contextActions/replyMessage.tsx";
import ForwardMessage from "@coreModule/clients/panel/private/chat/center/messages/message/contextActions/forwardMessage.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import EditMessage from "@coreModule/clients/panel/private/chat/center/messages/message/contextActions/editMessage.tsx";
import {Popover, PopoverContent, PopoverTrigger} from "@coreModule/components/ui/popover.tsx";
import SingleFile from "@coreModule/components/custom/files/singleFile.tsx";
import {MessageSenderType, MessageType} from "armonia/src/modules/core/api/user/private/chats/messages/messages.form.response.type.ts";
import {ValidateTokenFormResponseType} from "armonia/src/modules/core/api/user/public/validateToken/validateToken.form.response.type.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import InfoRow from "@coreModule/components/custom/infoRow.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@coreModule/components/ui/avatar.tsx";

const MAX_FILES = 2;
const RECEIPT_MEDIA_BASE = "/api/auxiliary/media/";

type MessageProps = WithLanguageType & {
    openedChannel: Channel,
    messageId: string;
    nextMessageId?: string,
    user: ValidateTokenFormResponseType,
    scrollIntoView: boolean,
    specificUserId?: string,
    index: number,
    goTo?: boolean
}

function Message({
    resolveLanguageKey,
    messageId,
    nextMessageId,
    scrollIntoView,
    user,
    specificUserId,
    openedChannel,
    goTo
}: MessageProps){
    //@ts-ignore
    const ref = useRef<any>();
    const {read = {}} = useAccess("messages") || {};
    const dispatch = useDispatch();
    const [contextOpened, setContextOpened] = useState<boolean>(false);
    const [reactionPickerOpened, setReactionPickerOpened] = useState<boolean>(false);

    const bubbleRef = useRef<HTMLDivElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);

    const message: MessageType = useSelector((state: RootState) => state.chat.messages[messageId]);
    const nextMessage = useSelector((state: RootState) => (nextMessageId ? state.chat?.messages?.[nextMessageId] : undefined));

    const [openAllFiles, setOpenAllFiles] = useState<boolean>(false);
    const openDelete = useSelector((state: RootState) => state.chat.openDelete);

    useOutsideClick(pickerRef, () => setReactionPickerOpened(false));

    function youOrOther(messageUser: MessageSenderType, toLowerCase?: boolean): string {
        if( messageUser?._id === user.id ){
            if( toLowerCase ){
                return resolveLanguageKey("you").toLowerCase();
            }
            return resolveLanguageKey("you");
        }
        return `${messageUser.name} ${messageUser.surname}`
    }

    useEffect(() => {
        if( !!ref && scrollIntoView){
            setTimeout(() => {
                ref?.current?.scrollIntoView({behavior: "smooth"});
            }, 0)
        }
    }, [ref, scrollIntoView]);

    useEffect(() => {
        if( contextOpened ){
            dispatch(updateOpenDelete(false));
        }
    }, [contextOpened]);

    useEffect(() => {
        if( goTo ){
            setTimeout(() => {
                if( !!ref && ref.current ){
                    ref.current.scrollIntoView({behavior: "smooth"});
                }
            }, 0)
        }
    }, [ref]);

    function renderMessageWithMentions(text: string): ReactNode[] {
        const mentionRegex = /@([a-fA-F0-9]{24})(?![a-fA-F0-9])/g;
        const nodes: ReactNode[] = [];
        const mentionedUsers = message.mentionedUsers || [];

        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = mentionRegex.exec(text)) !== null) {
            const start = match.index;
            const end = mentionRegex.lastIndex;
            const userId = match[1];
            const foundMention = mentionedUsers.find((mention) => mention._id === userId);

            // Plain text before mention
            if (start > lastIndex) {
                nodes.push(text.slice(lastIndex, start));
            }

            // Mention with popover
            nodes.push(
                <Popover key={`mention-${start}`}>
                    <PopoverTrigger asChild>
                        <span className="text-green-600 font-medium cursor-pointer hover:underline">
                            {
                                foundMention ?
                                <>
                                    @{getName(foundMention)}
                                </>
                                :
                                <>
                                    @{resolveLanguageKey("unknown")}
                                </>
                            }
                        </span>
                    </PopoverTrigger>

                    <PopoverContent
                        side="top"
                        align="start"
                        className="w-64 p-3 text-sm"
                    >
                        {
                            !!foundMention &&
                            <div className="flex items-center space-x-1">
                                <CustomAvatar user={foundMention} />
                                <p>{getName(foundMention)}</p>
                            </div>
                        }
                    </PopoverContent>
                </Popover>
            );

            lastIndex = end;
        }

        // Remaining text
        if (lastIndex < text?.length) {
            nodes.push(text?.slice(lastIndex));
        }

        return nodes;
    }

    if( !read ){
        return <HiddenElement />
    }
    if( !openedChannel || !message){
        return (<></>)
    }
    if( message.status === "hide" ){
        return <></>
    }
    if( message.type === "notification" ){
        return (
            <div ref={ref} className='flex items-center justify-center w-full mb-2'>
                <div className="bg-card text-muted-foreground border text-sm font-semibold rounded-lg px-6 py-1">
                    <LongText className='max-w-full'>
                        {
                            !!message.receiver ?
                            `${youOrOther(message.sender)} ${resolveLanguageKey(message.message)} ${youOrOther(message.receiver, true)}`
                            :
                            `${youOrOther(message.sender)} ${resolveLanguageKey(message.message)}`
                        }
                    </LongText>
                </div>
            </div>
        )
    }

    const owner = user.id === message.sender?._id;

    const messageBubbleClassNameResolver = () => {
        return {
            "relative wrap-break-word shadow max-w-[99%] sm:max-w-[75%] md:max-w-[680px] mx-2 mb-1.5 py-1 px-0 rounded-lg hover:cursor-pointer select-none space-y-0": true,
            "bg-muted dark:bg-muted dark:text-white": !owner,
            "bg-card dark:bg-green-900 dark:text-white ": owner,
            "rounded-ee-none": ( owner && (nextMessage?.sender?._id !== message.sender?._id || nextMessage?.type === "notification")),
            "rounded-es-none": ( !owner && (nextMessage?.sender?._id !== message.sender?._id || nextMessage?.type === "notification")),
            "border-green-500 border-2": (contextOpened || reactionPickerOpened),
            "border-2 border-transparent": !(contextOpened || reactionPickerOpened)
        }
    }
    const messageTime = () => {
        return (
            <HiddenElement randomLength={2}>
                {
                    read.createdAt &&
                    <p className="flex items-end text-[10px]/[10px]">
                        {formatDate(message.date, {timeZone: user.timezone, format: {hour: "2-digit", minute: "2-digit"}})}
                    </p>
                }
            </HiddenElement>
        )
    }

    const messageReceiptTicks = () => {
        if (!owner || message.type === "notification") {
            return null;
        }
        const senderId = message.sender?._id;
        const otherIds = (openedChannel.users || [])
            .map((u) => u._id)
            .filter((id) => id && id !== senderId);

        const deliveryRows = otherIds.map((oid) => message.delivery?.find((d) => d.user._id === oid));
        const allRead = otherIds.length > 0 && deliveryRows.every((r) => !!r?.readDate);
        const allDelivered = otherIds.length > 0 && deliveryRows.every((r) => !!r?.date);

        const receiptTooltip = () => (
            <div className="w-full min-w-0" style={{border: "0px solid red"}}>
                <p className="border-b border-background/20 pb-1 text-[10px] font-semibold uppercase tracking-wide text-background/85">
                    {resolveLanguageKey("readReceipts")}
                </p>
                <ul className="mt-0.5 flex list-none flex-col p-0">
                    {
                        otherIds.map((oid) => {
                            const channelUser = openedChannel.users?.find((u) => u._id === oid);
                            const row = message.delivery?.find((d) => d.user._id === oid);
                            const fromDelivery = row?.user;
                            const name = fromDelivery?.name ?? channelUser?.name ?? "";
                            const surname = fromDelivery?.surname ?? channelUser?.surname ?? "";
                            const photo = fromDelivery?.photo ?? channelUser?.photo;
                            const hasPhoto = Boolean(photo);

                            let statusLabel: string;
                            let statusTime: string | null = null;
                            if (row?.readDate) {
                                statusLabel = resolveLanguageKey("receiptRead");
                                statusTime = formatDate(row.readDate, {
                                    timeZone: user.timezone,
                                    format: {hour: "2-digit", minute: "2-digit"}
                                });
                            }
                            else if (row?.date) {
                                statusLabel = resolveLanguageKey("receiptDelivered");
                                statusTime = formatDate(row.date, {
                                    timeZone: user.timezone,
                                    format: {hour: "2-digit", minute: "2-digit"}
                                });
                            }
                            else {
                                statusLabel = resolveLanguageKey("receiptWaitingDelivery");
                            }

                            const displayName = [name, surname].filter(Boolean).join(" ").trim() || resolveLanguageKey("unknown");
                            const statusLine = statusTime != null ? `${statusLabel}\u00A0·\u00A0${statusTime}` : statusLabel;

                            return (
                                <li
                                    key={oid}
                                    className="flex items-center gap-2 border-b border-background/15 py-1 last:border-b-0"
                                >
                                    <Avatar className="size-7 shrink-0 border border-background/25 ring-0 bg-background/10">
                                        {
                                            hasPhoto ? <AvatarImage src={`${RECEIPT_MEDIA_BASE}${photo}`} alt="" className="object-cover"/> : null
                                        }
                                        <AvatarFallback className="rounded-full bg-background/15">
                                            <User className="size-4 text-background/70" aria-hidden />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1 text-left">
                                        <p className="truncate text-sm font-medium leading-tight text-background">
                                            {displayName}
                                        </p>
                                    </div>
                                    <p className="max-w-[min(7.5rem,32vw)] shrink-0 text-right text-xs leading-tight text-background/75 tabular-nums">
                                        {statusLine}
                                    </p>
                                </li>
                            )
                        })
                    }
                </ul>
            </div>
        );

        let icon: ReactNode;
        if (otherIds.length === 0) {return <Check className="size-4 shrink-0 text-muted-foreground" aria-hidden />;}
        if (allRead) {icon = (<CheckCheck className="size-4 shrink-0 text-primary" aria-hidden/>);}
        else if (allDelivered) {icon = <CheckCheck className="size-4 shrink-0 text-muted-foreground" aria-hidden />;}
        else {icon = <Check className="size-4 shrink-0 text-muted-foreground" aria-hidden />;}

        return (
            <div className="flex items-center justify-center ms-1">
                <TooltipDisplayer tooltipRender={receiptTooltip} side="top" contentClassName="!max-w-[min(252px,calc(100vw-16px))] !w-full !flex-col !items-stretch !gap-0 !px-2.5 !py-1.5 !text-xs [&>svg]:hidden">
                    <span className="inline-flex cursor-default items-end">{icon}</span>
                </TooltipDisplayer>
            </div>
        )
    }
    const messageAvatar = () => {
        if( !owner && openedChannel.metaData.isGroup ){
            return (
                <div className="flex items-start h-full">
                    {
                        read.sender &&
                        <CustomAvatar avatarClassName="size-8" user={message.sender}/>
                    }
                </div>
            )
        }
        return <></>
    }
    const messageFiles = () => {
        if( !!message.media?.length ){
            if( message.media?.length > MAX_FILES ){
                return (
                    <div className="w-full flex items-center justify-end space-x-1 mb-0.5">
                        {
                            message.media?.map((file, index) => {
                                if( index < MAX_FILES ){
                                    return (
                                        <div className="relative">
                                            <SingleFile
                                                key={message._id + "_" + index}
                                                file={{id: file._id, file: file}}
                                                specificUserId={specificUserId}
                                                isBig={openAllFiles}
                                                canDownload={true}
                                            />
                                        </div>
                                    )
                                }
                            })
                        }
                        <div className="backdrop-blur-sm  rounded-lg flex items-center justify-center z-2 hover:cursor-pointer">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Badge variant="outline" className="text-xs">
                                        +{(message.media?.length ?? 0) - (MAX_FILES + 1)}
                                    </Badge>
                                </PopoverTrigger>
                                <PopoverContent className="w-fit" side={"top"} align={message?.sender?._id === user.id ? "end" : "start"}>
                                    <div className="grid grid-cols-3 gap-1 max-h-80 overflow-y-auto">
                                        {
                                            message.media?.map((file, index) => {
                                                if( index >= MAX_FILES ){
                                                    return (
                                                        <div className="relative">
                                                            <SingleFile
                                                                key={message._id + "_" + index}
                                                                file={{id: file._id, file: file}}
                                                                specificUserId={specificUserId}
                                                                isBig={openAllFiles}
                                                                canDownload={true}
                                                            />
                                                        </div>
                                                    )
                                                }
                                            })
                                        }
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                )
            }
            else{
                return (
                    <div className="w-full flex items-center justify-end space-x-1 mb-0.5">
                        {
                            message.media?.map((file, index) => {
                                return (
                                    <div className="relative">
                                        <SingleFile
                                            key={message._id + "_" + index}
                                            file={{id: file._id, file: file}}
                                            specificUserId={specificUserId}
                                            isBig={openAllFiles}
                                            canDownload={true}
                                        />
                                    </div>

                                )
                            })
                        }
                    </div>
                )
            }
        }
        return <></>
    }
    const messageReliedTo = () => {
        if( (read?.replyTo && message.replyTo) ){
            return (
                <div
                    className="flex text-xs rounded-lg italic overflow-hidden border-l-4 border-muted-foreground mb-0.5"
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if( message.replyTo?._id ) {
                            let found = document.getElementById(`message-${message.replyTo._id}`);
                            if( found ){
                                found.scrollIntoView({behavior: "smooth"});
                            }
                        }
                    }}
                >
                    <div className="p-1 space-y-1">
                        <HiddenElement>
                            {
                                read?.replyTo?.keys?.sender &&
                                <>
                                    {
                                        !!message.replyTo?.sender &&
                                        <div className="flex items-center">
                                            {message.replyTo.sender._id === user.id ? resolveLanguageKey("you") : getName(message.replyTo.sender)}
                                        </div>
                                    }
                                </>
                            }
                        </HiddenElement>
                        <HiddenElement>
                            {
                                read?.replyTo?.keys?.text &&
                                <>
                                    {
                                        message?.replyTo?.message &&
                                        <p>
                                            {message.replyTo.status === "deleted" ? resolveLanguageKey("messageDeleted") : `${(message.replyTo.message).substring(0, 30)}${message.replyTo.message.length > 30 ? "..." : ""}`}
                                        </p>
                                    }
                                </>
                            }
                        </HiddenElement>
                    </div>
                </div>
            )
        }
        return <></>
    }
    const messageForwarded = () => {
        if( read?.forwardedText && message.forwardedMessage ) {
            return (
                <div className="flex text-xs rounded-lg italic overflow-hidden border-l-4 border-muted-foreground mb-1">
                    <div className="p-1 space-y-1">
                        <div className="flex items-center">
                            <Forward size={12} className="inline mr-1" />
                            <p>{resolveLanguageKey("forwarded")}</p>
                        </div>
                        <p>
                            {message.forwardedMessage}
                        </p>
                    </div>
                </div>
            )
        }
        return <></>
    }
    const messageSender = () => {
        // Show sender name if message is not from the owner and the channel is a group
        if(!owner && openedChannel.metaData.isGroup ){
            return (
                <p className="text-xs italic text-muted-foreground px-2">
                    {getName(message.sender)}
                </p>
            )
        }
        return <></>
    }
    const messageIsPinned = () => {
        if( read.pinned?.keys?.date || read.pinned?.keys?.user ){
            return (
                <>
                    {
                        (!!message && !!message.pinned) &&
                        <TooltipDisplayer
                            tooltipRender={() => (
                                <div className="">
                                    {
                                        !!message.pinned &&
                                        <>
                                            <InfoRow
                                                className="dark:text-black text-white"
                                                icon={User}
                                                label={resolveLanguageKey("pinnedBy")}
                                                value={
                                                    <HiddenElement>
                                                        {
                                                            read.pinned?.keys?.user &&
                                                            <>
                                                                {getName(message?.pinned.user)}
                                                            </>
                                                        }
                                                    </HiddenElement>
                                                }
                                            />
                                            <InfoRow
                                                className="dark:text-black text-white"
                                                icon={Calendar}
                                                label={resolveLanguageKey("pinnedAt")}
                                                value={
                                                    <HiddenElement>
                                                        {
                                                            read.pinned?.keys?.date &&
                                                            <>
                                                                {
                                                                    !!message.pinned.date &&
                                                                    formatDate(message.pinned?.date, {timeZone: user?.timezone})
                                                                }
                                                            </>
                                                        }
                                                    </HiddenElement>
                                                }
                                            />
                                        </>
                                    }
                                </div>
                            )}
                        >
                            <Pin size={12} className="inline" />
                        </TooltipDisplayer>
                    }
                </>
            )
        }
        return <></>

    }

    if( message.status === "deleted" ){
        return (
            <div ref={ref} key={`message-${messageId}`} id={`message-${messageId}`} className="flex w-full items-center" onClick={() => {if( openDelete ){dispatch(toggleDeleteMessageId(message._id))}}}>
                <ToggleDelete messageId={message._id}/>
                <div id={"message-center-content-" + messageId} className={cn("flex grow space-x-1 items-center", {"justify-start": !owner, "justify-end ": owner})}>
                    {messageAvatar()}
                    <ContextMenu onOpenChange={setContextOpened}>
                        <ContextMenuTrigger asChild>
                            <div className={cn(messageBubbleClassNameResolver())} ref={bubbleRef} onClick={(e) => {e.stopPropagation(); e.preventDefault();}}>
                                <div className={cn("flex grow w-full space-x-2 px-2", {"justify-start": !owner, "justify-end": owner})}>
                                    <div className="flex grow items-center space-x-0.5 text-muted-foreground">
                                        <CircleSlash size={12} />
                                        <p className="italic">{resolveLanguageKey(  message.sender._id === user.id ? "youDeletedTheMessage" : "messageDeleted")}</p>
                                    </div>
                                    {messageTime()}
                                </div>
                            </div>
                        </ContextMenuTrigger>
                        {
                            (!openedChannel.metaData?.readOnly && !openDelete) &&
                            <ContextMenuContent className="w-fit">
                                <DeleteMessage messageId={message._id} shortcutOverride={"1"} />
                            </ContextMenuContent>
                        }
                    </ContextMenu>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div ref={ref} key={`message-${messageId}`} id={`message-${messageId}`} className="flex w-full items-center" onClick={() => {if( openDelete ){dispatch(toggleDeleteMessageId(message._id))}}}>
                <ToggleDelete messageId={message._id}/>
                <div id={"message-center-content-" + messageId} className={cn("flex grow space-x-1 items-center", {"justify-start": !owner, "justify-end ": owner})}>
                    {messageAvatar()}
                    <Popover open={reactionPickerOpened}>
                        <PopoverTrigger asChild>
                            <div>
                                <ContextMenu onOpenChange={setContextOpened}>
                                    <ContextMenuTrigger asChild>
                                        <div className={cn(messageBubbleClassNameResolver())} ref={bubbleRef} onClick={(e) => {e.stopPropagation(); e.preventDefault();}}>
                                            {/*Show reply to message info*/}
                                            <div className="px-0.5">
                                                {messageReliedTo()}
                                                {messageForwarded()}
                                                {messageSender()}
                                                {messageFiles()}
                                            </div>
                                            <div className="flex" onClick={(e) => {e.stopPropagation(); setOpenAllFiles(false);}}>
                                                <div className={cn("flex grow w-full space-x-1 px-2", {"justify-start": !owner, "justify-end": owner})}>
                                                    <HiddenElement showLock={false}>
                                                        {
                                                            read.text &&
                                                            <div className="flex grow">
                                                                <p className="whitespace-pre-wrap wrap-break-word">
                                                                    {renderMessageWithMentions(message.message)}
                                                                </p>
                                                            </div>
                                                        }
                                                    </HiddenElement>
                                                    <p className="flex items-end mb-1 gap-0.5">
                                                        {messageIsPinned()}
                                                        {(message.status === "edited") && <p className="text-[10px]/[10px]">{resolveLanguageKey("edited")}</p>}
                                                        {messageTime()}
                                                        {messageReceiptTicks()}
                                                    </p>
                                                </div>
                                            </div>
                                            <Reactions
                                                messageId={message._id}
                                                owner={owner}
                                            />
                                        </div>
                                    </ContextMenuTrigger>
                                    {
                                        (!openedChannel.metaData?.readOnly && !openDelete) &&
                                        <ContextMenuContent className="w-48">
                                            {
                                                message.sender._id === user.id &&
                                                <EditMessage message={message}/>
                                            }
                                            <ReplyMessage message={message}/>
                                            {
                                                (message.status === "active" || message.status === "edited") &&
                                                <ForwardMessage message={message}/>
                                            }
                                            <ReactMessage messageId={message._id} openReactionPicker={(value: boolean) => {setReactionPickerOpened(value)}}/>
                                            {
                                                message.pinned ?
                                                    <UnpinMessage messageId={message._id}/>
                                                    :
                                                    <PinMessage messageId={message._id}/>
                                            }
                                            <DeleteMessage messageId={message._id} />
                                        </ContextMenuContent>
                                    }
                                </ContextMenu>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent side={"top"} align={message?.sender?._id === user.id ? "end" : "start"} className="p-0 w-fit bg-[#00000000] ring-0 shadow-none" style={{border: "0px !important"}}>
                            <div ref={pickerRef} className="select-none">
                                <ReactToMessage
                                    messageId={message._id}
                                    onSuccess={() => {setReactionPickerOpened(false)}}
                                />
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/messages/message/index.tsx"),
    withDebug(true, true)
)(Message);