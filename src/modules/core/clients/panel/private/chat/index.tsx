import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {useDispatch, useSelector} from "react-redux";
import {useCallback, useEffect, useRef, useState} from "react";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {clientWebSocket} from "@coreModule/helpers/hocs/withWebSocket.tsx";
import {openChannel, setChannels} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import LeftChatPanel from "@coreModule/clients/panel/private/chat/left";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import ChatHeader from "@coreModule/clients/panel/private/chat/center/chatHeader";
import ChatInputAll from "@coreModule/clients/panel/private/chat/center/chatInput/input.tsx";
import {MessageFetcherRender} from "@coreModule/clients/panel/private/chat/center/messages/messagesFetcher.tsx";
import MessagesList from "@coreModule/clients/panel/private/chat/center/messages/messagesList.tsx";
import {useIsMobile} from "@coreModule/helpers/hooks/useMobile.tsx";
import {useTheme} from "@coreModule/helpers/context/providers/theme-provider.tsx";
import TypingIndicators from "@coreModule/clients/panel/private/chat/center/typingIndicators.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";

type ChatProps = WithLanguageType & {}

function Chat({resolveLanguageKey}: ChatProps){

    const {theme} = useTheme();
    const dispatch = useDispatch();
    const scrollRef = useRef<HTMLDivElement | null>(null);
    /** Bumps when the scroll container mounts so MessagesList can attach IntersectionObserver to the real root. */
    const [scrollRootRevision, setScrollRootRevision] = useState(0);
    const scrollContainerRef = useCallback((el: HTMLDivElement | null) => {
        scrollRef.current = el;
        setScrollRootRevision((n) => n + 1);
    }, []);
    const isMobile = useIsMobile();
    const webSocketConnected = useSelector((state: RootState) => state.ui.webSocketConnected);
    const activeChannelId = useSelector((state: RootState) => state.chat.activeChannelId);

    useEffect(() => {
        if( !!webSocketConnected && clientWebSocket?.readyState === 1 ){
            clientWebSocket.send(JSON.stringify({code: "JOIN_ROOM", payload: ["allChats"] }));
        }
        return () => {
            if( !!webSocketConnected && clientWebSocket?.readyState === 1 ){
                clientWebSocket.send(JSON.stringify({code: "LEAVE_ROOM", payload: ["allChats"] }));
            }
        }
    }, [webSocketConnected]);

    useEffect(() => {
        return () => {
            dispatch(setChannels(null));
            dispatch(openChannel(null));
        }
    },[])

    const bird = () => {
        return (
            <div className="flex flex-col items-center justify-center space-y-0 py-4">
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
        <div className={cn("relative flex-full border", !mobile && "rounded-lg")}>
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-contain bg-center"
                style={{
                    backgroundImage: theme === "light" ? "url('/chatBackground.jpg')" : "url('/chatBackgroundDark.png')",
                    opacity: theme === "light" ? 0.4 : 0.1,
                    zIndex: 0,
                }}
            />
            <div className="relative z-1">
                <ChatHeader defaultTitle={""} />
            </div>
            <div ref={scrollContainerRef} className={cn("relative z-1 flex-full px-0 pt-1", mobile && "px-0")}>
                {
                    !!activeChannelId ?
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
                <TypingIndicators />
                <ChatInputAll />
            </div>
        </div>
    );

    return (
        <div className="flex-full flex-row">
            {
                isMobile ?
                <div className="flex-full w-full">
                    {
                        !activeChannelId ?
                        <div className="flex-full">
                            <LeftChatPanel />
                        </div>
                        :
                        conversationPane(true)
                    }
                </div>
                :
                <div className="grid h-full w-full grid-cols-8 gap-2">
                    <div className="col-span-2 flex-full">
                        <LeftChatPanel />
                    </div>
                    <div className="col-span-6 flex-full">
                        {conversationPane(false)}
                    </div>
                </div>
            }
        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/index.tsx"),
    withDebug(true, true)
)(Chat);
