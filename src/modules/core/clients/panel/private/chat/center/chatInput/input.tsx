import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Paperclip, Reply, RotateCw, Send, X} from "lucide-react";
import {Button} from "@coreModule/components/ui/button.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {useEffect, useImperativeHandle, useMemo, useRef, useState} from "react";
import {Mention, MentionsInput} from "react-mentions";
import SingleFile from "@coreModule/components/custom/files/singleFile.tsx";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import DeleteMessages from "@coreModule/clients/panel/private/chat/center/chatInput/actions/deleteMessages.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {addMessages, setActionMessage, upsertChannel} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import {sendWebsocketMessage} from "@coreModule/helpers/hocs/withWebSocket.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {getName} from "@coreModule/helpers/general";
import {toast} from "sonner";
import EditMessage from "@coreModule/clients/panel/private/chat/center/chatInput/actions/editMessage.tsx";
import ForwardMessageDialog from "@coreModule/clients/panel/private/chat/center/chatInput/actions/forwardMessageDialog.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {NewMessageFormType} from "armonia/src/modules/core/api/user/private/chats/messages/newMessage.form.type.ts";
import {MessageTypeWithParticipants} from "armonia/src/modules/core/api/user/private/chats/messages/messages.form.response.type.ts";
import type {ChannelUser} from "armonia/src/modules/core/types";
import {ChangeEvent, KeyboardEvent} from "react";
import {WebSocketFEMessageCodes} from "armonia/src/modules/core/websocket/types.ts";
import CustomAvatar from "@coreModule/components/custom/customAvatar.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {
    mentionsMarkupToPlainDisplay,
    mentionsMarkupToWire,
    REACT_MENTIONS_MARKUP,
    wireTextToMentionsMarkup
} from "./mentionWire.ts";
import "./chatMentionsInput.css";

type ChatInputAllProps = WithLanguageType & WithAxiosType<MessageTypeWithParticipants, NewMessageFormType> &  {
    specificUserId: string
}

function ChatInputAll({
    resolveLanguageKey,
    specificUserId,
    onFormDataChange,
    loading,
    innerRef
}: ChatInputAllProps) {

    const {create, write, delete: deleteMessages} = useAccess("messages");
    const dispatch = useDispatch();
    const ref = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTypingRef = useRef<boolean>(false);

    const openDelete = useSelector((state: RootState) => state.chat.openDelete);
    const activeChannelId = useSelector((state: RootState) => state.chat.activeChannelId);
    const openedChannel = useSelector((state: RootState) => state.chat.channels[activeChannelId ?? ""]);
    const user = useSelector((state: RootState) => state.authentication.user);

    const actionMessage = useSelector((state: RootState) => state.chat.actionMessage);

    const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
    const formatMaxSize = (bytes: number) => bytes >= 1024 * 1024 ? `${bytes / (1024 * 1024)}MB` : `${bytes / 1024}KB`;

    /** react-mentions markup (`@[display](id)`); serialize with mentionsMarkupToWire for API */
    const [message, setMessage] = useState<string>("");
    /** Plain display (`@Name`…) for typing-indicator WebSocket events */
    const [messagePlain, setMessagePlain] = useState<string>("");
    const [fireUpdate, setFireUpdate] = useState<number>(0);
    const [selectedFiles, setSelectedFiles] = useState<{id: string, file: File}[]>([]);

    function sendMessage(){
        if( !create ) return;
        if( !openedChannel || !activeChannelId || loading || ( !message && selectedFiles.length === 0 ) ) return;
        if( !!actionMessage && actionMessage.action === "edit" ){
            setFireUpdate(Date.now());
        }
        else{
            let postBody: NewMessageFormType = {
                channel: openedChannel._id,
                text: mentionsMarkupToWire(message),
                mediaFiles: selectedFiles.length,
                replyTo: actionMessage?.message?._id || undefined
            }
            const formData = new FormData();
            if( !!selectedFiles ) {
                for( let selectedFile of selectedFiles ){
                    formData.append("files", selectedFile.file);
                }
            }
            formData.append("data", JSON.stringify(postBody))
            onFormDataChange(formData);
        }
    }

    useImperativeHandle(innerRef, () => ({
        success: (data: MessageTypeWithParticipants) => {

            dispatch(addMessages({messages: [data], startOrEnd: "end"}))
            dispatch(upsertChannel(openedChannel));
            dispatch(setActionMessage(null));

            setMessage("");
            setMessagePlain("");
            setSelectedFiles([]);

            // Send typing stop after message sent
            endTyping();

            if( !!ref ){
                setTimeout(() => ref.current?.focus(), 10)
            }
        }
    }))

    const startTyping = () => {
        if (!openedChannel) {return;}

        // Only send TYPING_START if we haven't sent it yet
        if (!isTypingRef.current) {
            sendWebsocketMessage?.({
                code: WebSocketFEMessageCodes.TYPING_START,
                payload: {
                    channelId: openedChannel._id,
                    userId: specificUserId || user.id
                }
            });
            isTypingRef.current = true;
        }

        // Clear existing timeout and set a new one
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set timeout to send TYPING_STOP after user stops typing
        typingTimeoutRef.current = setTimeout(() => {
            endTyping();
        }, 500);
    }
    
    const endTyping = () => {
        if (!openedChannel) {return;}
        
        // Only send TYPING_STOP if we've sent TYPING_START
        if (isTypingRef.current) {
            sendWebsocketMessage?.({
                code: WebSocketFEMessageCodes.TYPING_STOP,
                payload: {
                    channelId: openedChannel._id,
                    userId: specificUserId || user.id
                }
            });
            isTypingRef.current = false;
        }
        
        // Clear timeout if it exists
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
    }

    useEffect(() => {
        if (messagePlain.length > 0) {
            // User is typing - start typing indicator (only sends once)
            startTyping();
        }
        else{
            // User cleared the message - stop typing immediately
            endTyping();
        }
        return () => {
            // Cleanup timeout on unmount or message change
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
        };
    }, [messagePlain]);

    useEffect(() => {
        if( !!actionMessage && actionMessage.action === "edit" ){
            const markup = wireTextToMentionsMarkup(
                actionMessage.message?.message || "",
                actionMessage.message?.mentionedUsers,
                openedChannel?.users
            );
            setMessage(markup);
            setMessagePlain(mentionsMarkupToPlainDisplay(markup));
        }
        else{
            setMessage("");
            setMessagePlain("");
        }
    }, [actionMessage, openedChannel?.users]);

    const usersById = useMemo(() => {
        const map = new Map<string, ChannelUser>();
        for (const u of openedChannel?.users ?? []) {
            map.set(u._id, u);
        }
        return map;
    }, [openedChannel?.users]);

    const mentionData = useMemo(() => (openedChannel?.users ?? []).map((u) => ({id: u._id, display: getName(u)})), [openedChannel?.users]);

    /** Overrides react-mentions default `backgroundColor: white` on suggestions; uses design tokens for light/dark */
    const chatMentionsThemeStyle = useMemo(() => ({
            suggestions: {
                zIndex: 50,
                backgroundColor: "var(--popover)",
                color: "var(--popover-foreground)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "0 10px 15px -3px color-mix(in oklch, var(--foreground) 12%, transparent), 0 4px 6px -4px color-mix(in oklch, var(--foreground) 8%, transparent)",
                marginTop: 6,
                minWidth: "min(18rem, calc(100vw - 2rem))",
                list: {
                    margin: 0,
                    padding: 4,
                    listStyleType: "none",
                    maxHeight: 240,
                    overflowY: "auto",
                    backgroundColor: "var(--popover)",
                    color: "var(--popover-foreground)",
                    borderRadius: "calc(var(--radius-lg) - 1px)"
                },
                item: {
                    color: "var(--popover-foreground)",
                    borderRadius: "calc(var(--radius-lg) - 4px)"
                }
            }
    }), []);

    if( openDelete && deleteMessages ){
        return (
            <DeleteMessages specificUserId={specificUserId}/>
        )
    }
    if( !activeChannelId || !openedChannel || !create){
        return <></>
    }
    if( !!openedChannel && openedChannel.metaData?.readOnly ){
        return (
            <div className='border-input text-center bg-card text-muted-foreground text-xs rounded-md border px-2 py-1'>
                <p>{resolveLanguageKey("noLongerMember")}</p>
            </div>
        )
    }

    return (
        <div className='flex w-full flex-none flex-col gap-0.5 ' style={{border: "0px solid red"}}>

            {
                !!actionMessage && !!actionMessage.message && !!actionMessage.action &&
                <>
                    {
                        write.replyTo  && actionMessage.action === "reply" &&
                        <div className="flex items-center justify-between bg-muted rounded-lg px-3 py-2 border-l-4 border-primary">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Reply size={16} className="text-primary shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold text-primary">
                                        {getName(actionMessage.message?.sender)}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">
                                        <p>
                                            {
                                                actionMessage.message.status === "deleted" ?
                                                resolveLanguageKey("messageDeleted")
                                                :
                                                `${(actionMessage.message.message).substring(0, 50)}${actionMessage.message.message.length > 50 ? "..." : ""}`
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                onClick={() => dispatch(setActionMessage(null))}
                            >
                                <X size={14} />
                            </Button>
                        </div>
                    }
                    {
                        write.text && actionMessage.action === "edit" &&
                        <EditMessage
                            resolveLanguageKey={resolveLanguageKey}
                            editMessage={actionMessage.message}
                            newMessage={mentionsMarkupToWire(message)}
                            onSuccess={() => {
                                setFireUpdate(0);
                                setMessage("");
                                setSelectedFiles([]);
                                dispatch(setActionMessage(null));
                            }}
                            fireUpdate={fireUpdate}
                        />
                    }
                    {
                        write.forwardedText && actionMessage.action === "forward" &&
                        <ForwardMessageDialog
                            message={actionMessage.message}
                            open={!!actionMessage.message}
                            onOpenChange={(open: boolean) => {
                                if (!open) {
                                    dispatch(setActionMessage(null));
                                }
                            }}
                        />
                    }
                </>
            }
            {
                !!selectedFiles &&
                <div className="flex flex-wrap space-x-1 space-y-1 max-h-42 overflow-y-auto">
                    {
                        selectedFiles.map((file, index: number) => {
                            return (
                                <SingleFile
                                    key={file.id + "_" + index}
                                    canRemove={true}
                                    onRemove={(id: string) => {
                                        let tempFiles = selectedFiles.filter((file) => file.id !== id);
                                        setSelectedFiles(tempFiles);
                                    }}
                                    specificUserId={specificUserId}
                                    file={file}
                                />
                            )
                        })
                    }
                </div>
            }

            <div className="flex items-end border rounded-lg px-1 space-x-1" style={{border: "0px solid red"}}>

                <TooltipDisplayer tooltip={(resolveLanguageKey("attach") as string)?.replace("{}", formatMaxSize(MAX_FILE_SIZE_BYTES))}>
                    <div className="bg-card rounded-full flex items-center justify-center md:p-1">
                        <Button
                            size='icon'
                            type='button'
                            variant='ghost'
                            disabled={loading}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Paperclip className='stroke-muted-foreground' />
                        </Button>
                        <input
                            type='file'
                            ref={fileInputRef}
                            className='hidden'
                            multiple
                            onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                const files = event.target.files;
                                if (!!files && files.length) {
                                    const fileArray = Array.from(files);
                                    const validFiles = fileArray.filter((file) => file.size < MAX_FILE_SIZE_BYTES);
                                    const rejectedCount = fileArray.length - validFiles.length;
                                    if (rejectedCount > 0) {
                                        toast.error(resolveLanguageKey("fileTooLarge"));
                                    }
                                    if (validFiles.length > 0) {
                                        setSelectedFiles((prev) => prev.concat(validFiles.map((file, index) => ({
                                            id: `${Date.now()}_${index}_${file.name}`,
                                            file
                                        }))));
                                    }
                                }
                                event.target.value = "";
                            }}
                        />
                    </div>
                </TooltipDisplayer>

                <div className="min-w-0 flex-1 bg-card rounded-2xl shadow-md">
                    <MentionsInput
                        id="message_inputer"
                        value={message}
                        onChange={(_e, newValue, newPlain) => {
                            setMessage(newValue);
                            setMessagePlain(newPlain);
                        }}
                        onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                sendMessage();
                            }
                        }}
                        disabled={loading}
                        className="chatMentions"
                        style={chatMentionsThemeStyle as Record<string, unknown>}
                        inputRef={ref}
                        placeholder={resolveLanguageKey("message")}
                        aria-label={resolveLanguageKey("message")}
                        allowSuggestionsAboveCursor={true}
                        forceSuggestionsAboveCursor={true}
                        a11ySuggestionsListLabel={resolveLanguageKey("mentionSuggestions")}
                    >
                        <Mention
                            trigger="@"
                            markup={REACT_MENTIONS_MARKUP}
                            displayTransform={(_id, display) => {
                                const name = display?.trim() || _id;
                                return name.startsWith("@") ? name : `@${name}`;
                            }}
                            data={mentionData}
                            appendSpaceOnAdd={true}
                            className="font-medium text-green-600 dark:text-green-500"
                            renderSuggestion={(entry, _search, highlightedDisplay, _index, focused) => {
                                const user = usersById.get(String(entry.id));
                                return (
                                    <div className={cn("flex items-center gap-2 px-2 py-1.5 text-sm text-popover-foreground", focused && "bg-muted text-foreground")}>
                                        <CustomAvatar user={user} avatarClassName="size-7 shrink-0" />
                                        <span className="min-w-0 truncate">{highlightedDisplay}</span>
                                    </div>
                                );
                            }}
                        />
                    </MentionsInput>
                </div>

                <TooltipDisplayer tooltip={resolveLanguageKey("send")}>
                    <div className="bg-card rounded-full flex items-center justify-center md:p-1">
                        <Button variant='ghost' size='icon' onClick={() => { if(!loading)sendMessage();}} disabled={loading}>
                            {(loading) ? <RotateCw className="animate-spin"/> : <Send/>}
                        </Button>
                    </div>
                </TooltipDisplayer>

            </div>

        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/chatInput/input.tsx"),
    withAxios(
        {
            url: "/api/user/chats/messages",
            method: "put",
            data: {}
        },
        true
    ),
    withDebug(true, true)
)(ChatInputAll);