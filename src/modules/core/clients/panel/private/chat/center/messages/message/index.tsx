import {CSSProperties, ReactNode, useEffect, useRef, useState} from "react";
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
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@coreModule/components/ui/dialog.tsx";
import SingleFile from "@coreModule/components/custom/files/singleFile.tsx";
import {MessageSenderType, MessageType} from "armonia/src/modules/core/api/user/private/chats/messages/messages.form.response.type.ts";
import {ValidateTokenFormResponseType} from "armonia/src/modules/core/api/user/public/validateToken/validateToken.form.response.type.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import InfoRow from "@coreModule/components/custom/infoRow.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@coreModule/components/ui/avatar.tsx";

const MAX_FILES = 2;
const RECEIPT_MEDIA_BASE = "/api/auxiliary/media/";

type MessageProps = WithLanguageType & {
    openedChannel: Channel,
    messageId: string;
    nextMessageId?: string,
    previousMessageId?: string,
    /** Precomputed in MessagesList from visible neighbors (skips hide). */
    isFirstInGroup?: boolean,
    isLastInGroup?: boolean,
    /** Vertical stack margin from MessagesList (margin-only, no parent gap). */
    stackClassName?: string,
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
    previousMessageId,
    isFirstInGroup: isFirstInGroupProp,
    isLastInGroup: isLastInGroupProp,
    stackClassName,
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
    const [attachmentsOpen, setAttachmentsOpen] = useState<boolean>(false);

    const bubbleRef = useRef<HTMLDivElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);

    const message: MessageType = useSelector((state: RootState) => state.chat.messages[messageId]);
    const nextMessage = useSelector((state: RootState) => (nextMessageId ? state.chat?.messages?.[nextMessageId] : undefined));
    const previousMessage = useSelector((state: RootState) => (previousMessageId ? state.chat?.messages?.[previousMessageId] : undefined));

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
                        <span className={cn(
                            "font-medium cursor-pointer hover:underline",
                            message.sender?._id === user.id
                                ? "text-primary-foreground/90 underline-offset-2"
                                : "text-primary"
                        )}>
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
            <div ref={ref} className={cn("flex w-full items-center justify-center", stackClassName ?? "mb-2")}>
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
    const hasAttachments = (message.media?.length ?? 0) > 0;
    const hasText = Boolean(message.message?.trim());

    // Prefer list-computed flags (visible neighbors). Fall back for any non-list usage.
    const breaksGroup = (other?: MessageType) =>
        !other
        || other.type === "notification"
        || other.status === "hide"
        || other.sender?._id !== message.sender?._id;

    const isFirstInGroup = isFirstInGroupProp ?? breaksGroup(previousMessage);
    const isLastInGroup = isLastInGroupProp ?? breaksGroup(nextMessage);

    const messageBubbleClassNameResolver = () => {
        return cn(
            "relative wrap-break-word rounded-lg text-sm select-none hover:cursor-pointer",
            hasAttachments && !hasText ? "p-1.5" : "px-3 py-1.5",
            hasAttachments ? "max-w-[min(100%,20rem)] sm:max-w-[22rem]" : "max-w-[min(100%,28rem)]",
            owner ? "bg-primary text-primary-foreground" : "bg-muted",
            // WhatsApp-style tail only on the last bubble in a consecutive run.
            owner && isLastInGroup && "rounded-br-none",
            !owner && isLastInGroup && "rounded-bl-none",
            (contextOpened || reactionPickerOpened) && "ring-2 ring-primary/60",
        )
    }
    const messageTime = () => {
        return (
            <HiddenElement randomLength={2}>
                {
                    read.createdAt &&
                    <span className={cn(
                        "text-[10px] tabular-nums leading-none",
                        owner ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}>
                        {formatDate(message.date, {timeZone: user.timezone, format: {hour: "2-digit", minute: "2-digit"}})}
                    </span>
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
            <div className="w-full min-w-0">
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
        if (otherIds.length === 0) {return <Check className="size-3 opacity-70" aria-hidden />;}
        if (allRead) {icon = (<CheckCheck className="size-3 text-sky-300" aria-hidden/>);}
        else if (allDelivered) {icon = <CheckCheck className="size-3 opacity-70" aria-hidden />;}
        else {icon = <Check className="size-3 opacity-70" aria-hidden />;}

        return (
            <TooltipDisplayer tooltipRender={receiptTooltip} side="top" contentClassName="!max-w-[min(252px,calc(100vw-16px))] !w-full !flex-col !items-stretch !gap-0 !px-2.5 !py-1.5 !text-xs [&>svg]:hidden">
                <span className="inline-flex cursor-default items-center">{icon}</span>
            </TooltipDisplayer>
        )
    }
    const messageAvatar = () => {
        if (owner) {
            return null;
        }
        // Width-only gutter for non-last bubbles so row height = bubble height (same as own messages).
        if (!isLastInGroup) {
            return <div className="w-10 shrink-0" aria-hidden />;
        }
        if (!read.sender) {
            return <CustomAvatar avatarClassName="size-10 shrink-0 self-end" />;
        }
        return (
            <CustomAvatar
                avatarClassName="size-10 shrink-0 self-end"
                user={message.sender}
            />
        )
    }
    const messageFiles = () => {
        const media = message.media;
        if (!media?.length) {
            return null;
        }

        const visible = media.slice(0, MAX_FILES);
        const overflow = media.length - MAX_FILES;
        const count = media.length;
        const tileClass = cn(
            "group/file relative overflow-hidden",
            count === 1 ? "aspect-[4/3] w-full min-h-40" : "aspect-square w-full min-h-28",
        );

        return (
            <div className={cn(hasText && "mb-2")}>
                <div
                    className={cn(
                        "grid gap-1",
                        count === 1 ? "grid-cols-1" : "grid-cols-2",
                    )}
                >
                    {visible.map((file, index) => (
                        <div key={`${message._id}_${file._id}_${index}`} className={tileClass}>
                            <SingleFile
                                file={{id: file._id, file: file}}
                                specificUserId={specificUserId}
                                isBig={true}
                                canDownload={true}
                                variant="chat"
                                className="h-full w-full"
                            />
                            {index === visible.length - 1 && overflow > 0 && (
                                <button
                                    type="button"
                                    className={cn(
                                        "absolute inset-0 z-10 flex cursor-pointer items-center justify-center rounded-md text-sm font-semibold backdrop-blur-[2px]",
                                        owner
                                            ? "bg-primary/70 text-primary-foreground"
                                            : "bg-foreground/55 text-background",
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setContextOpened(false);
                                        setAttachmentsOpen(true);
                                    }}
                                    onPointerDown={(e) => {
                                        // Keep ContextMenu / parent bubble from swallowing the open action.
                                        e.stopPropagation();
                                    }}
                                >
                                    +{overflow}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const attachmentsDialog = () => {
        const media = message.media;
        if (!media?.length) {
            return null;
        }

        const count = media.length;
        const columns = Math.min(count, count <= 2 ? count : count <= 4 ? 3 : count <= 8 ? 4 : count <= 12 ? 5 : 6);
        const dialogWidth = cn(
            "w-[min(96vw,var(--attachments-dialog-w))] max-w-none sm:max-w-none",
        );
        const dialogWidthVar =
            count <= 2 ? "24rem"
            : count <= 4 ? "36rem"
            : count <= 8 ? "48rem"
            : count <= 12 ? "60rem"
            : "72rem";

        return (
            <Dialog open={attachmentsOpen} onOpenChange={setAttachmentsOpen} modal>
                <DialogContent
                    style={{"--attachments-dialog-w": dialogWidthVar} as CSSProperties}
                    className={cn(
                        "flex max-h-[min(90vh,56rem)] flex-col gap-4",
                        dialogWidth,
                        count <= 4 ? "h-auto" : "h-[min(90vh,56rem)]",
                    )}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {count} {resolveLanguageKey("attachments")}
                        </DialogTitle>
                    </DialogHeader>
                    <div
                        className={cn(
                            "grid min-h-0 gap-2 overflow-y-auto",
                            count > 4 && "flex-1",
                        )}
                        style={{gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`}}
                    >
                        {media.map((file, index) => (
                            <div
                                key={`${message._id}_all_${file._id}_${index}`}
                                className="relative aspect-square min-h-0 overflow-visible"
                            >
                                <SingleFile
                                    file={{id: file._id, file: file}}
                                    specificUserId={specificUserId}
                                    isBig={true}
                                    canDownload={true}
                                    variant="chat"
                                    className="h-full w-full"
                                />
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        )
    }
    const messageReliedTo = () => {
        if( (read?.replyTo && message.replyTo) ){
            return (
                <div
                    className={cn(
                        "mb-1 overflow-hidden rounded-md border-l-4 px-2 py-1 text-xs italic",
                        owner ? "border-primary-foreground/40 bg-primary-foreground/10" : "border-muted-foreground/50 bg-background/40"
                    )}
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
                    <div className="space-y-0.5">
                        <HiddenElement>
                            {
                                read?.replyTo?.keys?.sender &&
                                <>
                                    {
                                        !!message.replyTo?.sender &&
                                        <div className="flex items-center font-medium not-italic">
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
                <div className={cn(
                    "mb-1 overflow-hidden rounded-md border-l-4 px-2 py-1 text-xs italic",
                    owner ? "border-primary-foreground/40 bg-primary-foreground/10" : "border-muted-foreground/50 bg-background/40"
                )}>
                    <div className="space-y-0.5">
                        <div className="flex items-center font-medium not-italic">
                            <Forward size={12} className="mr-1 inline" />
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
        // Show sender name on the first bubble of a group in group chats.
        if(!owner && openedChannel.metaData.isGroup && isFirstInGroup ){
            return (
                <p className="mb-0.5 text-xs font-medium text-muted-foreground">
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

    const messageMeta = () => (
        <span
            className={cn(
                "inline-flex shrink-0 items-center gap-0.5 ps-2 pt-0.5 leading-none",
                owner ? "text-primary-foreground/70" : "text-muted-foreground",
            )}
        >
            {messageIsPinned()}
            {(message.status === "edited") && (
                <span className="text-[10px] leading-none opacity-80">{resolveLanguageKey("edited")}</span>
            )}
            {messageTime()}
            {messageReceiptTicks()}
        </span>
    )

    const messageBody = () => (
        <div className="grid min-w-0">
            <div className="col-start-1 row-start-1 min-w-0">
                {messageReliedTo()}
                {messageForwarded()}
                {messageSender()}
                {messageFiles()}
                {
                    hasText &&
                    <HiddenElement showLock={false}>
                        {
                            read.text &&
                            <p className="whitespace-pre-wrap wrap-break-word pe-[3.75rem]">
                                {renderMessageWithMentions(message.message)}
                            </p>
                        }
                    </HiddenElement>
                }
                {
                    !hasText && hasAttachments &&
                    <div className="h-5 w-full" aria-hidden />
                }
            </div>
            <div className="col-start-1 row-start-1 self-end justify-self-end">
                {messageMeta()}
            </div>
        </div>
    )

    if( message.status === "deleted" ){
        return (
            <div
                ref={ref}
                key={`message-${messageId}`}
                id={`message-${messageId}`}
                className={cn(
                    "flex w-full items-start gap-1",
                    stackClassName,
                )}
                onClick={() => {if( openDelete ){dispatch(toggleDeleteMessageId(message._id))}}}
            >
                <ToggleDelete messageId={message._id}/>
                <div
                    id={"message-center-content-" + messageId}
                    className={cn("flex min-w-0 grow gap-2", owner && "flex-row-reverse")}
                >
                    {messageAvatar()}
                    <div className={cn("group flex min-w-0 flex-col", owner && "items-end")}>
                        <ContextMenu
                            open={contextOpened && !attachmentsOpen}
                            onOpenChange={(open) => {
                                if (attachmentsOpen) {
                                    setContextOpened(false);
                                    return;
                                }
                                setContextOpened(open);
                            }}
                        >
                            <ContextMenuTrigger asChild>
                                <div
                                    className={cn(messageBubbleClassNameResolver(), "bg-muted text-muted-foreground")}
                                    ref={bubbleRef}
                                    onClick={(e) => {e.stopPropagation(); e.preventDefault();}}
                                >
                                    <div className="grid min-w-0">
                                        <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-1 pe-[3.75rem]">
                                            <CircleSlash size={12} />
                                            <p className="italic">{resolveLanguageKey(  message.sender._id === user.id ? "youDeletedTheMessage" : "messageDeleted")}</p>
                                        </div>
                                        <div className="col-start-1 row-start-1 self-end justify-self-end">
                                            {messageMeta()}
                                        </div>
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
            </div>
        )
    }

    return (
        <div
            ref={ref}
            key={`message-${messageId}`}
            id={`message-${messageId}`}
            className={cn(
                "flex w-full items-start gap-1",
                stackClassName,
            )}
            onClick={() => {if( openDelete ){dispatch(toggleDeleteMessageId(message._id))}}}
        >
            <ToggleDelete messageId={message._id}/>
            <div
                id={"message-center-content-" + messageId}
                className={cn("flex min-w-0 grow gap-2", owner && "flex-row-reverse")}
            >
                {messageAvatar()}
                <Popover open={reactionPickerOpened}>
                    <PopoverTrigger asChild>
                        <div className={cn("group flex min-w-0 flex-col", owner && "items-end")}>
                            <ContextMenu
                            open={contextOpened && !attachmentsOpen}
                            onOpenChange={(open) => {
                                if (attachmentsOpen) {
                                    setContextOpened(false);
                                    return;
                                }
                                setContextOpened(open);
                            }}
                        >
                                <ContextMenuTrigger asChild>
                                    <div
                                        className={messageBubbleClassNameResolver()}
                                        ref={bubbleRef}
                                        onClick={(e) => {e.stopPropagation(); e.preventDefault();}}
                                    >
                                        {messageBody()}
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
                    <PopoverContent side={"top"} align={message?.sender?._id === user.id ? "end" : "start"} className="w-fit border-0 bg-transparent p-0 shadow-none ring-0">
                        <div ref={pickerRef} className="select-none">
                            <ReactToMessage
                                messageId={message._id}
                                onSuccess={() => {setReactionPickerOpened(false)}}
                            />
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            {attachmentsDialog()}
        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/messages/message/index.tsx"),
    withDebug(true, true)
)(Message);