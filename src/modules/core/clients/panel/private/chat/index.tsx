import withLanguage, {WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {useDispatch, useSelector} from "react-redux";
import {useCallback, useEffect, useRef, useState} from "react";
import {useSearchParams} from "react-router-dom";
import {RootState} from "@baseModule/helpers/redux/store/generalStore.ts";
import {useWebSocketRoom} from "@baseModule/helpers/hooks/useWebSocketRoom.ts";
import {openChannel, isPeekingWebsiteChannel, upsertChannel} from "@baseModule/helpers/redux/slices/chatSlice.ts";
import LeftChatPanel from "@coreModule/clients/panel/private/chat/left";
import withDebug from "@baseModule/helpers/hocs/withDebug.tsx";
import ChatHeader from "@coreModule/clients/panel/private/chat/center/chatHeader";
import ChatInputAll from "@coreModule/clients/panel/private/chat/center/chatInput/input.tsx";
import {MessageFetcherRender} from "@coreModule/clients/panel/private/chat/center/messages/messagesFetcher.tsx";
import MessagesList from "@coreModule/clients/panel/private/chat/center/messages/messagesList.tsx";
import {useIsMobile} from "@baseModule/helpers/hooks/useMobile.tsx";
import {useTheme} from "@baseModule/helpers/context/providers/theme-provider.tsx";
import TypingIndicators from "@coreModule/clients/panel/private/chat/center/typingIndicators.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import type {PublicChatInboxFilter} from "armonia/src/modules/core/api/user/private/chats/channels/channels.constants.ts";
import LeftWebsiteChatPanel from "@coreModule/clients/panel/private/websiteChats/left/index.tsx";
import WebsiteChatHeader from "@coreModule/clients/panel/private/websiteChats/center/chatHeader.tsx";
import PeekComposerBar from "@coreModule/clients/panel/private/websiteChats/center/peekComposerBar.tsx";
import apiClient from "@baseModule/helpers/apiClient/apiClient.ts";
import {GetChannelSingleFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/getChannelSingle.form.response.type.ts";

type ChatProps = WithLanguageType & {
    websiteChannels?: PublicChatInboxFilter;
}

function Chat({resolveLanguageKey, websiteChannels}: ChatProps){

    const {resolvedTheme} = useTheme();
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const scrollRef = useRef<HTMLDivElement | null>(null);
    /** Bumps when the scroll container mounts so MessagesList can attach IntersectionObserver to the real root. */
    const [scrollRootRevision, setScrollRootRevision] = useState(0);
    const scrollContainerRef = useCallback((el: HTMLDivElement | null) => {
        scrollRef.current = el;
        setScrollRootRevision((n) => n + 1);
    }, []);
    const isMobile = useIsMobile();
    const activeChannelId = useSelector((state: RootState) => state.chat.activeChannelId);
    const userId = useSelector((state: RootState) => state.authentication.user?.id);
    const openedChannel = useSelector((state: RootState) => state.chat.channels[activeChannelId ?? ""]);
    const isWebsiteInbox = !!websiteChannels;
    const peeking = isPeekingWebsiteChannel(openedChannel, userId);
    const room = isWebsiteInbox ? "websiteChats" : "allChats";
    const openChannelId = isWebsiteInbox ? searchParams.get("channelId")?.trim() || null : null;

    useWebSocketRoom(room);

    // Clear selection when entering / switching inbox (mine ↔ waiting).
    useEffect(() => {
        // dispatch(openChannel(null));
        // return () => {
            // dispatch(openChannel(null));
        // };
    }, [dispatch, isWebsiteInbox, websiteChannels]);

    // ?channelId=… → load channel, select it, drop the query param.
    useEffect(() => {
        if (!openChannelId) return;

        let cancelled = false;
        apiClient
            .post<GetChannelSingleFormResponseType>("/api/user/chats/channels/single", {id: openChannelId})
            .then((res) => {
                if (cancelled || !res.data?._id) return;
                dispatch(upsertChannel(res.data));
                dispatch(openChannel(res.data._id));
                setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.delete("channelId");
                    return next;
                }, {replace: true});
            })
            .catch(() => {});

        return () => {
            cancelled = true;
        };
    }, [openChannelId, dispatch, setSearchParams]);

    const bird = () => {
        return (
            <div className="flex flex-col items-center justify-center gap-y-0 py-4">
                <p className="text-sm font-semibold text-foreground">{resolveLanguageKey("welcome")}</p>
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
        )
    }

    const conversationPane = (mobile: boolean) => (
        <div className={cn("relative flex h-full min-h-0 flex-col overflow-visible border", !mobile && "rounded-lg")}>
            <div
                aria-hidden
                className={cn(
                    "pointer-events-none absolute inset-0 bg-contain bg-center",
                    !mobile && "rounded-lg",
                )}
                style={{
                    backgroundImage: resolvedTheme === "light" ? "url('/chatBackground.jpg')" : "url('/chatBackgroundDark.png')",
                    opacity: resolvedTheme === "light" ? 0.4 : 0.1,
                    zIndex: 0,
                }}
            />
            <div className="relative z-10 overflow-visible">
                {isWebsiteInbox ? <WebsiteChatHeader /> : <ChatHeader defaultTitle={""} />}
            </div>
            <div ref={scrollContainerRef} className={cn("relative z-1 min-h-0 flex-1 overflow-y-auto px-0 pt-1", mobile && "px-0")}>
                {
                    activeChannelId ?
                    <>
                        <MessageFetcherRender
                            scrollRoot={scrollRef}
                            fetchNewer={true}
                        />
                        <MessagesList scrollRoot={scrollRef} scrollRootRevision={scrollRootRevision} />
                    </>
                    :
                    bird()
                }
            </div>
            <div className="relative z-1 px-2 pb-2">
                {peeking ? (
                    <PeekComposerBar />
                ) : (
                    <>
                        <TypingIndicators />
                        <ChatInputAll />
                    </>
                )}
            </div>
        </div>
    );

    const leftPanel = isWebsiteInbox && websiteChannels
        ? <LeftWebsiteChatPanel websiteChannels={websiteChannels} />
        : <LeftChatPanel />;

    return (
        <div className="flex-full flex-row">
            {
                isMobile ?
                <div className="flex-full w-full">
                    {
                        !activeChannelId ?
                        <div className="flex-full">
                            {leftPanel}
                        </div>
                        :
                        conversationPane(true)
                    }
                </div>
                :
                <div className="grid h-full w-full grid-cols-8 gap-2">
                    <div className="col-span-2 flex min-h-0 flex-col overflow-hidden">
                        {leftPanel}
                    </div>
                    <div className="col-span-6 flex min-h-0 flex-col overflow-visible">
                        {conversationPane(false)}
                    </div>
                </div>
            }
        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/index.tsx"),
    withDebug(true, true, "channels")
)(Chat);
