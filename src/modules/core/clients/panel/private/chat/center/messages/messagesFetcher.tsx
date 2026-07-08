import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {RefObject, useEffect, useImperativeHandle, useRef, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import useIsInViewport from "@coreModule/helpers/hooks/useIsInViewPort.ts";
import {addMessages, setMessages} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import {sendMessageReceiptBatch} from "@coreModule/helpers/chat/messageReceipts.ts";
import {store} from "@coreModule/helpers/redux/store/generalStore.ts";
import Loader from "@coreModule/components/custom/loader.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import {
    MessagesFormResponseType,
    MessageType
} from "armonia/src/modules/core/api/user/private/chats/messages/messages.form.response.type.ts";
import {MessagesFormType} from "armonia/src/modules/core/api/user/private/chats/messages/messages.form.type.ts";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type MessagesFetcherProps = WithLanguageType & WithAxiosType<MessagesFormResponseType, MessagesFormType> & {
    scrollRoot: RefObject<HTMLElement>,
    oldestMessageTime?: string
    earliestMessageTime?: string,
    // channelData?: Channel,
    fetchNewer: boolean,
    latestId: string
}

function MessagesFetcher({
    resolveLanguageKey,
    loading,
    error,
    onFilterChange,
    scrollRoot,
    innerRef,
    // channelData,
    oldestMessageTime,
    earliestMessageTime,
    fetchNewer,
    latestId
}: MessagesFetcherProps) {

    const {read} = useAccess("messages");

    const messagesLimit = 200;
    const dispatch = useDispatch();
    const [lastMessage, setLastMessage] = useState<MessageType | null>(null);
    const [ready, setReady] = useState<boolean>(false);
    const ref= useRef<HTMLDivElement>(null);

    const activeChannelId = useSelector((state: RootState) => state.chat.activeChannelId);
    const {_id: channelId} = useSelector((state: RootState) => state.chat.channels[activeChannelId ?? ""]);
    const channelIdRef = useRef<string | undefined>(undefined);
    channelIdRef.current = channelId;
    const {lastUserReadTime} = useSelector((state: RootState) => state.chat.channels[activeChannelId ?? ""]?.metaData) || {};

    const [newOldestMessageTime, setNewOldestMessageTime] = useState<string | null>(null);
    const [fetchedMessages, setFetchedMessages] = useState<number>(0);

    const [forceReload, setForceReload] = useState(1);
    const [fetchCompleted, setFetchCompleted] = useState(false);

    const inView = useIsInViewport(ref, scrollRoot);

    useEffect(() => {
        let found = document.getElementById(`message-${latestId}`);
        if( found ){
            found.scrollIntoView({behavior: "instant"});
        }
        setReady(true);
    }, [latestId]);

    useEffect(() => {
        if( !ready || fetchCompleted) return;
        if( !!channelId && inView && !fetchCompleted){
            if( fetchNewer ){
                const payload: MessagesFormType = {
                    channel: channelId,
                    limit: messagesLimit,
                    earliestMessage: earliestMessageTime || lastUserReadTime.toString()
                };
                onFilterChange(payload);
            }
            else if( !fetchNewer && !!oldestMessageTime ){
                const payload: MessagesFormType = {
                    channel: channelId,
                    limit: messagesLimit,
                    oldestMessage: oldestMessageTime
                };
                onFilterChange(payload);
            }
            return;
        }
    }, [channelId, lastUserReadTime, inView, forceReload, fetchCompleted, ready]);

    useEffect(() => {
        setNewOldestMessageTime(null);
        setFetchCompleted(false);
    }, [activeChannelId, channelId]);

    useImperativeHandle(innerRef, () => ({
        success: (data: MessagesFormResponseType) => {
            setFetchCompleted(true);

            if( fetchNewer ){
                setNewOldestMessageTime(data.lastRead?.toString() ?? null);
            }
            else{
                if( !!data.messages.length ){
                    const last = data.messages[data.messages.length - 1];
                    setLastMessage(last);

                    let found = document.getElementById(`message-${last._id}`);
                    if( found ){
                        setLastMessage(last);
                        found.scrollIntoView({behavior: "instant"});
                    }
                }

                setTimeout(() => {
                    const first = data.messages[0];

                    if( !!first ){
                        setNewOldestMessageTime(first.date.toString());
                    }
                }, 50)
            }

            if (fetchNewer) {
                dispatch(setMessages(data.messages));
            }
            else {
                dispatch(addMessages({messages: data.messages, startOrEnd: "start"}))
            }

            const uid = store.getState().authentication.user?.id;
            const chId = channelIdRef.current;
            if (uid && chId && data.messages.length) {
                const fromOthers = data.messages
                    .filter((m) => m.sender?._id && m.sender._id !== uid)
                    .map((m) => m._id);
                if (fromOthers.length) {
                    sendMessageReceiptBatch(chId, fromOthers, "delivered");
                }
            }

            setFetchedMessages(data.messages.length);
            setTimeout(() => {
                // const first = data.messages[0];
                // setNewOldestMessageTime(first?.date?.toString());
            }, 200)
        },
    }));

    const renderRefData = (render: boolean) => {
        if( render ){
            return (
                <div className="px-3 py-2 rounded-lg border text-muted-foreground">
                    <p>Is in viewport: {inView ? "YES" : "NO"}</p>
                    <p>Is fetch newer: {fetchNewer ? "YES" : "NO"}</p>
                    <p>Message Count: {fetchedMessages}</p>
                    <p>{!!activeChannelId ? `channel Id: ${activeChannelId}` : "no channel id"}</p>
                    <p>{fetchCompleted ? "fetch-completed" : "fetch-not-done"}</p>
                    {/*<p>[{channel.metaData?.lastUserReadTime}]</p>*/}
                    {/*<p>{readyForNextFetch ? "ready" : "not ready"}</p>*/}
                    <p>{oldestMessageTime || "-"} / {newOldestMessageTime}</p>
                    <p>{forceReload}</p>

                    <div style={{border: "2px solid red"}}>
                        {/*<pre>*/}
                        {/*    {JSON.stringify(stateChannel, null, 2)}*/}
                        {/*</pre>*/}
                    </div>

                </div>
            )
        }
        else{
            return <></>
        }
    }


    if( !read ){
        return <HiddenElement />
    }

    return (
        <>
            <div ref={ref} className="relative text-muted-foreground" onClick={() => {}} style={{border: "0px solid red"}}>
                {renderRefData(false)}
                {
                    !activeChannelId || !channelId ?
                    <></>
                    :
                    <>
                        {
                            (loading) ?
                            <div className="absolute top-0 right-0 flex items-center justify-center w-full">
                                <Loader />
                            </div>
                            :
                            <>
                                {
                                    error ?
                                    <SimpleError
                                        title={resolveLanguageKey("failTitle")}
                                        description={resolveLanguageKey("failTitleTooltip")}
                                        onClick={() => setForceReload(Date.now())}
                                    />
                                    :
                                    <></>
                                }
                            </>
                        }
                    </>
                }
            </div>

            {
                !!newOldestMessageTime && activeChannelId &&
                <div>
                    <MessageFetcherRender
                        scrollRoot={scrollRoot}
                        oldestMessageTime={newOldestMessageTime}
                        latestId={lastMessage?._id}
                    />
                </div>
            }
        </>
    )
}

export const MessageFetcherRender = compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/messages/messagesFetcher.tsx"),
    withAxios(
        {
            url: "/api/user/chats/messages",
            method: "POST",
            data: {}
        },
        true
    ),
    withDebug(true, true)
)(MessagesFetcher);