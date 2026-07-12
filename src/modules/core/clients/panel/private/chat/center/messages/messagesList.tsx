import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useSelector} from "react-redux";
import Message from "@coreModule/clients/panel/private/chat/center/messages/message";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {memo, useEffect, useRef, type RefObject} from "react";
import {store} from "@coreModule/helpers/redux/store/generalStore.ts";
import {sendMessageReceiptBatch} from "@coreModule/helpers/chat/messageReceipts.ts";

const MemoizedMessage = memo(Message);

type MessagesListProps = WithLanguageType & {
    /** Scroll container for messages (`flex-full` / `overflow-y: auto`); required for correct read detection. */
    scrollRoot?: RefObject<HTMLElement | null>;
    /** Increments when `scrollRoot` mounts so the observer uses the real element, not `null` from first paint. */
    scrollRootRevision?: number;
}

function MessagesList({scrollRoot, scrollRootRevision = 0}: MessagesListProps){
    const {read} = useAccess("messages");
    const user = useSelector((state: RootState) => state.authentication.user);
    const messagesOrderIds = useSelector((state: RootState) => state.chat.messagesOrderIds);
    const messages = useSelector((state: RootState) => state.chat.messages);
    const activeChannelId = useSelector((state: RootState) => state.chat.activeChannelId);
    const openedChannel = useSelector((state: RootState) => state.chat.channels[activeChannelId ?? ""]);
    const readAckedRef = useRef<Set<string>>(new Set());
    const pendingReadIdsRef = useRef<Set<string>>(new Set());
    const readFlushRafRef = useRef<number>(0);
    const activeChannelRef = useRef<string | null>(null);
    activeChannelRef.current = activeChannelId;

    const messagesOrderKey = messagesOrderIds?.join("\x1e") ?? "";

    /** Skip hide entries so they don't fake a sender-group break between visible bubbles. */
    const getVisibleNeighbor = (fromIndex: number, direction: -1 | 1) => {
        if (!messagesOrderIds?.length) {
            return undefined;
        }
        for (let i = fromIndex + direction; i >= 0 && i < messagesOrderIds.length; i += direction) {
            const candidate = messages[messagesOrderIds[i]];
            if (!candidate || candidate.status === "hide") {
                continue;
            }
            return candidate;
        }
        return undefined;
    };

    const breaksSenderGroup = (
        self: (typeof messages)[string] | undefined,
        other: (typeof messages)[string] | undefined,
    ) =>
        !self
        || !other
        || self.type === "notification"
        || other.type === "notification"
        || self.sender?._id !== other.sender?._id;

    useEffect(() => {
        readAckedRef.current = new Set();
        pendingReadIdsRef.current.clear();
        if (readFlushRafRef.current) {
            cancelAnimationFrame(readFlushRafRef.current);
            readFlushRafRef.current = 0;
        }
    }, [activeChannelId]);

    useEffect(() => {
        if (!activeChannelId || !messagesOrderIds?.length || !user?.id) {
            return;
        }
        if (scrollRoot && scrollRoot.current == null) {
            return;
        }

        const observerRoot = scrollRoot?.current ?? null;
        const uid = user.id as string;

        const flushPendingReads = () => {
            readFlushRafRef.current = 0;
            const ch = activeChannelRef.current;
            const ids = [...pendingReadIdsRef.current];
            pendingReadIdsRef.current.clear();
            if (ch && ids.length > 0) {
                sendMessageReceiptBatch(ch, ids, "read");
            }
        };

        const obs = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) {
                        continue;
                    }
                    const rawId = entry.target.id || "";
                    const messageId = rawId.startsWith("message-") ? rawId.slice("message-".length) : "";
                    if (!messageId || readAckedRef.current.has(messageId)) {
                        continue;
                    }
                    const msg = store.getState().chat.messages[messageId];
                    if (!msg || msg.sender?._id === uid) {
                        continue;
                    }
                    if (msg.status === "deleted" || msg.status === "hide") {
                        continue;
                    }
                    readAckedRef.current.add(messageId);
                    pendingReadIdsRef.current.add(messageId);
                    if (!readFlushRafRef.current) {
                        readFlushRafRef.current = requestAnimationFrame(flushPendingReads);
                    }
                }
            },
            {
                root: observerRoot,
                rootMargin: "0px",
                threshold: [0, 0.01, 0.25, 0.5],
            }
        );

        for (const mid of messagesOrderIds) {
            const el = document.getElementById(`message-${mid}`);
            if (el) {
                obs.observe(el);
            }
        }

        return () => {
            if (readFlushRafRef.current) {
                cancelAnimationFrame(readFlushRafRef.current);
                readFlushRafRef.current = 0;
            }
            pendingReadIdsRef.current.clear();
            obs.disconnect();
        };
    }, [activeChannelId, messagesOrderKey, scrollRoot, scrollRootRevision, user?.id]);

    // const groupMessagesByDay = (messages: any[], timeZone: string) => {
    //     const groups: Record<string, any[]> = {};
    //
    //     messages.forEach(msg => {
    //         const dayLabel = formatChatGroupDate(msg.date, timeZone);
    //         if (!groups[dayLabel]) groups[dayLabel] = [];
    //         groups[dayLabel].push(msg);
    //     });
    //
    //     return groups;
    // };
    // const formatChatGroupDate = (dateString: string, timeZone: string) => {
    //     const d = new Date(new Date(dateString).toLocaleString("en-US", { timeZone }));
    //     const now = new Date(new Date().toLocaleString("en-US", { timeZone }));
    //
    //     const pad = (n: number) => ("0" + n).slice(-2);
    //
    //     const isToday =
    //         d.getFullYear() === now.getFullYear() &&
    //         d.getMonth() === now.getMonth() &&
    //         d.getDate() === now.getDate();
    //
    //     const yesterday = new Date(now);
    //     yesterday.setDate(now.getDate() - 1);
    //
    //     const isYesterday =
    //         d.getFullYear() === yesterday.getFullYear() &&
    //         d.getMonth() === yesterday.getMonth() &&
    //         d.getDate() === yesterday.getDate();
    //
    //     const days = resolveLanguageKey("weekDays");
    //
    //     // Day difference (midnight comparison)
    //     const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    //     const startOfD = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    //     const diffDays = Math.floor((startOfNow.getTime() - startOfD.getTime()) / 86400000); // 24*60*60*1000
    //
    //     if (isToday) return resolveLanguageKey("today");
    //     if (isYesterday) return resolveLanguageKey("yesterday");
    //
    //     // If date is within last 7 days, return weekday
    //     if (diffDays >= 2 && diffDays < 7) {
    //         return days[d.getDay()];
    //     }
    //
    //     return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
    // };
    // const grouped = groupMessagesByDay(data?.messages || [], user.timezone);

    if( !read ){
        return <HiddenElement />
    }
    // if( messagesOrderIds.length === 0){
    //     return (
    //         <div className="flex flex-col space-y-0 items-center justify-center py-4">
    //             <p className="font-semibold text-sm text-foreground">{resolveLanguageKey("welcome")}</p>
    //             <svg data-v-ad307406="" xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24"
    //                  fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"
    //                  className="lucide animal-icon lucide-animal-icon lucide-animal animal-icon"
    //                  data-darkreader-inline-stroke="">
    //                 <path d="M16 7h.01"></path>
    //                 <path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"></path>
    //                 <path d="m20 7 2 .5-2 .5"></path>
    //                 <path d="M10 18v3"></path>
    //                 <path d="M14 17.75V21"></path>
    //                 <path d="M7 18a6 6 0 0 0 3.84-10.61"></path>
    //             </svg>
    //         </div>
    //     )
    // }
    if( !openedChannel ){
        return <></>
    }

    return (
        // Margin-only stacking (no flex gap) so every consecutive pair uses the same rule.
        <div className="flex flex-col px-3 py-2">
            {
                messagesOrderIds?.map((messageId, index) => {
                    const message = messages[messageId];
                    const previousVisible = getVisibleNeighbor(index, -1);
                    const nextVisible = getVisibleNeighbor(index, 1);
                    const isFirstInGroup = breaksSenderGroup(message, previousVisible);
                    const isLastInGroup = breaksSenderGroup(message, nextVisible);
                    // Same stack rhythm for own and received: tight within a run, looser on sender change.
                    const stackClassName =
                        message && message.status !== "hide" && previousVisible
                            ? (isFirstInGroup ? "mt-3" : "mt-1.5")
                            : undefined;

                    return (
                        <MemoizedMessage
                            key={messageId}
                            user={user}
                            messageId={messageId}
                            previousMessageId={messagesOrderIds[index - 1]}
                            nextMessageId={messagesOrderIds[index + 1]}
                            isFirstInGroup={isFirstInGroup}
                            isLastInGroup={isLastInGroup}
                            stackClassName={stackClassName}
                            index={index}
                            openedChannel={openedChannel}
                            goTo={index === messagesOrderIds.length - 1}
                        />
                    )
                })
            }
        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/messages/messagesList.tsx"),
    withDebug(true, true)
)(MessagesList);