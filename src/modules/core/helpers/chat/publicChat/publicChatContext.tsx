import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
/**
 * Conversation state for the public-website visitor chat, shared by every public
 * site. Each site renders its own panel on top of {@link usePublicChat}.
 */
import {
    clearVisitorToken,
    closeSession,
    eraseConversation,
    fetchMessages,
    requestHandoff as requestHandoffRequest,
    sendMessage as sendMessageRequest,
    startSession,
    type PublicChatMessageType,
    type PublicChatStatusType,
} from "@coreModule/helpers/chat/publicChat/publicChatClient.ts";
import {usePublicChatSocket} from "@coreModule/helpers/chat/publicChat/usePublicChatSocket.ts";

/**
 * One rendered message. Mirrors the server DTO, plus the optimistic entries the
 * widget shows before the round-trip completes.
 */
type PublicChatMessage = {
    id: string;
    text: string;
    author: "visitor" | "bot" | "agent";
    authorName?: string;
    sentAt: number;
    /** True while the visitor's own message is still in flight. */
    pending?: boolean;
    /** True when the send failed; the bubble renders a retry affordance. */
    failed?: boolean;
};

/**
 * Opaque ObjectId map sent with session start, e.g. `{project, unit}` from a
 * property page. The feature module chooses the keys.
 */
type PublicChatSessionContext = Record<string, string>;

type PublicChatContextValue = {
    isOpen: boolean;
    messages: PublicChatMessage[];
    status: PublicChatStatusType;
    /** True once a human agent is in the conversation. */
    hasAgent: boolean;
    agentName?: string;
    /** True between sending and the bot's reply arriving. */
    isBotThinking: boolean;
    /** True while a human agent is typing (socket-driven). */
    isAgentTyping: boolean;
    /** Session bootstrap is still running. */
    isConnecting: boolean;
    /** Chat is unavailable (tenant disabled it, or the session could not start). */
    isUnavailable: boolean;
    /** Whether the tenant offers "talk to a person". */
    humanHandoffEnabled: boolean;
    /** Whether the tenant wants contact details captured. */
    requireIdentification: boolean;
    /** True once the visitor has left their details. */
    hasIdentified: boolean;
    /** Record that the visitor left their details (the site owns that call). */
    markIdentified: () => void;
    open: (context?: PublicChatSessionContext) => void;
    close: () => void;
    toggle: () => void;
    sendMessage: (text: string) => void;
    /** Escalate to a human. No-op when already escalated. */
    requestHuman: (note?: string) => void;
    endConversation: () => void;
    /** Drop the closed session and open a fresh conversation in this panel. */
    startNewChat: () => void;
    /** Right-to-erasure: destroy this conversation entirely. */
    eraseConversationData: () => void;
};

const PublicChatContext = createContext<PublicChatContextValue | null>(null);

/** Poll cadence when the socket is down — this is the primary transport then. */
const POLL_INTERVAL_MS = 3000;
/**
 * Poll cadence while the socket is connected. Still polls, but rarely: the
 * socket is a wake-up signal, not a guarantee, and this catches anything a
 * dropped frame would otherwise lose.
 */
const SOCKET_POLL_INTERVAL_MS = 20000;
/** Give up on "bot is typing" after this long so the indicator can't hang. */
const BOT_THINKING_TIMEOUT_MS = 60000;

const toMessage = (dto: PublicChatMessageType): PublicChatMessage => ({
    id: dto._id,
    text: dto.text,
    author: dto.author,
    authorName: dto.authorName,
    sentAt: new Date(dto.createdAt).getTime(),
});

type PublicChatProviderProps = {
    children: ReactNode;
    /** Page context sent when a session starts; read at that moment. */
    sessionContext?: () => PublicChatSessionContext;
    /**
     * The site's login token while the visitor is signed in, so the conversation
     * belongs to their account. Changing it (sign in, sign out, switch account)
     * re-opens the chat as the new identity.
     */
    customerToken?: string | null;
};

function PublicChatProvider({children, sessionContext, customerToken = null}: PublicChatProviderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<PublicChatMessage[]>([]);
    const [status, setStatus] = useState<PublicChatStatusType>("bot");
    const [hasAgent, setHasAgent] = useState(false);
    const [agentName, setAgentName] = useState<string | undefined>(undefined);
    const [isBotThinking, setIsBotThinking] = useState(false);
    const [isAgentTyping, setIsAgentTyping] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isUnavailable, setIsUnavailable] = useState(false);
    /**
     * Mirrors `sessionStartedRef` as state. The socket hook needs to re-evaluate
     * when the session becomes available, and a ref mutation does not re-render.
     */
    const [hasSession, setHasSession] = useState(false);
    const [humanHandoffEnabled, setHumanHandoffEnabled] = useState(true);
    const [requireIdentification, setRequireIdentification] = useState(false);
    const [hasIdentified, setHasIdentified] = useState(false);

    const sessionStartedRef = useRef(false);
    const openContextRef = useRef<PublicChatSessionContext>({});
    const sessionContextRef = useRef(sessionContext);
    sessionContextRef.current = sessionContext;
    const customerTokenRef = useRef(customerToken);
    const lastMessageAtRef = useRef<string | undefined>(undefined);
    const thinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startingNewChatRef = useRef(false);

    const resetConversationState = useCallback(() => {
        sessionStartedRef.current = false;
        lastMessageAtRef.current = undefined;
        setHasSession(false);
        setHasIdentified(false);
        setMessages([]);
        setStatus("bot");
        setHasAgent(false);
        setAgentName(undefined);
        setIsAgentTyping(false);
        setIsBotThinking(false);
    }, []);

    /** Merge server messages in, replacing optimistic ones and de-duplicating. */
    const mergeServerMessages = useCallback((incoming: PublicChatMessageType[]) => {
        if (incoming.length === 0) {
            return;
        }
        setMessages((prev) => {
            const known = new Set(prev.map((message) => message.id));
            const merged = [...prev];
            let sawIncomingReply = false;

            for (const dto of incoming) {
                if (known.has(dto._id)) {
                    continue;
                }
                merged.push(toMessage(dto));
                if (dto.author !== "visitor") {
                    sawIncomingReply = true;
                }
            }

            if (sawIncomingReply) {
                setIsBotThinking(false);
            }
            // Drop optimistic entries that the server has now echoed back.
            const serverTexts = new Set(
                incoming.filter((dto) => dto.author === "visitor").map((dto) => dto.text),
            );
            return merged
                .filter((message) => !(message.pending && serverTexts.has(message.text)))
                .sort((a, b) => a.sentAt - b.sentAt);
        });

        const newest = incoming[incoming.length - 1];
        if (newest) {
            lastMessageAtRef.current = newest.createdAt;
        }
    }, []);

    const applyConversationState = useCallback(
        (next: {status: PublicChatStatusType; hasAgent: boolean; agentName?: string}) => {
            setStatus(next.status);
            setHasAgent(next.hasAgent);
            setAgentName(next.agentName);
            // A human owning the conversation means no bot reply is coming.
            if (next.hasAgent || next.status === "closed") {
                setIsBotThinking(false);
            }
            if (next.status === "closed") {
                setIsAgentTyping(false);
            }
        },
        [],
    );

    /** Bootstrap (or resume) the conversation. Runs once per mounted widget. */
    const ensureSession = useCallback(async () => {
        if (sessionStartedRef.current) {
            return;
        }
        sessionStartedRef.current = true;
        setIsConnecting(true);
        try {
            const session = await startSession({
                entryUrl: typeof window !== "undefined" ? window.location.href : undefined,
                referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
                // Site context first, explicit `open({...})` context wins.
                context: {...sessionContextRef.current?.(), ...openContextRef.current},
                customerToken: customerTokenRef.current ?? undefined,
            });

            applyConversationState({
                status: session.status,
                hasAgent: session.hasAgent,
                agentName: session.agentName,
            });
            setHumanHandoffEnabled(session.humanHandoffEnabled);
            setRequireIdentification(session.requireIdentification);

            const history = session.messages.map(toMessage);
            if (session.greeting && history.length === 0) {
                history.push({
                    id: "greeting",
                    text: session.greeting,
                    author: "bot",
                    sentAt: Date.now(),
                });
            }
            setMessages(history);

            const newest = session.messages[session.messages.length - 1];
            lastMessageAtRef.current = newest?.createdAt;
            setIsUnavailable(false);
            setHasSession(true);
        }
        catch {
            // Tenant has the widget switched off, or the API is unreachable.
            setIsUnavailable(true);
            sessionStartedRef.current = false;
            setHasSession(false);
        }
        finally {
            setIsConnecting(false);
        }
    }, [applyConversationState]);

    const open = useCallback(
        (context?: PublicChatSessionContext) => {
            if (context) {
                openContextRef.current = context;
            }
            setIsOpen(true);
            void ensureSession();
        },
        [ensureSession],
    );

    const close = useCallback(() => setIsOpen(false), []);

    const toggle = useCallback(() => {
        setIsOpen((prev) => {
            if (!prev) {
                void ensureSession();
            }
            return !prev;
        });
    }, [ensureSession]);

    const sendMessage = useCallback(
        (text: string) => {
            const trimmed = text.trim();
            if (!trimmed || isUnavailable) {
                return;
            }

            const optimisticId = `pending-${crypto.randomUUID()}`;
            setMessages((prev) => [
                ...prev,
                {id: optimisticId, text: trimmed, author: "visitor", sentAt: Date.now(), pending: true},
            ]);

            void (async () => {
                try {
                    await ensureSession();
                    const response = await sendMessageRequest({text: trimmed});

                    setMessages((prev) =>
                        prev.map((message) =>
                            message.id === optimisticId
                                ? {...toMessage(response.message), pending: false}
                                : message,
                        ),
                    );
                    setStatus(response.status);

                    if (response.awaitingBotReply) {
                        setIsBotThinking(true);
                        if (thinkingTimerRef.current) {
                            clearTimeout(thinkingTimerRef.current);
                        }
                        thinkingTimerRef.current = setTimeout(
                            () => setIsBotThinking(false),
                            BOT_THINKING_TIMEOUT_MS,
                        );
                    }
                }
                catch {
                    setMessages((prev) =>
                        prev.map((message) =>
                            message.id === optimisticId
                                ? {...message, pending: false, failed: true}
                                : message,
                        ),
                    );
                }
            })();
        },
        [ensureSession, isUnavailable],
    );

    const requestHuman = useCallback(
        (note?: string) => {
            void (async () => {
                try {
                    const response = await requestHandoffRequest({note});
                    setStatus(response.status);
                    // The bot posts its own "connecting you" line, which arrives
                    // through the normal refresh — nothing to render here.
                }
                catch {
                    // Handoff is best-effort from the visitor's point of view;
                    // they can always ask the bot in words instead.
                }
            })();
        },
        [],
    );

    const markIdentified = useCallback(() => setHasIdentified(true), []);

    const eraseConversationData = useCallback(() => {
        void (async () => {
            try {
                await eraseConversation();
            }
            catch {
                /* erasure is best-effort from the client; the sweep catches the rest */
            }
            resetConversationState();
            setIsOpen(false);
        })();
    }, [resetConversationState]);

    const endConversation = useCallback(() => {
        void (async () => {
            try {
                await closeSession();
            }
            catch {
                /* closing is best-effort */
            }
            resetConversationState();
            setIsOpen(false);
        })();
    }, [resetConversationState]);

    const startNewChat = useCallback(() => {
        if (startingNewChatRef.current) {
            return;
        }
        startingNewChatRef.current = true;
        clearVisitorToken();
        sessionStartedRef.current = false;
        lastMessageAtRef.current = undefined;
        setHasSession(false);
        setHasIdentified(false);
        setIsAgentTyping(false);
        setIsBotThinking(false);
        setIsOpen(true);
        // Leave the closed transcript on screen until the new session lands so
        // the panel does not flash an empty composer under a "closed" banner.
        void ensureSession().finally(() => {
            startingNewChatRef.current = false;
        });
    }, [ensureSession]);

    /** Single path for turning server state into rendered messages. */
    const refresh = useCallback(async () => {
        try {
            const response = await fetchMessages({since: lastMessageAtRef.current});
            applyConversationState({
                status: response.status,
                hasAgent: response.hasAgent,
                agentName: response.agentName,
            });
            mergeServerMessages(response.messages);
        }
        catch {
            // Transient failure: the next tick (or socket wake) retries.
        }
    }, [applyConversationState, mergeServerMessages]);

    // Signing in, out, or into another account changes who the conversation
    // belongs to: start over as the new identity. On sign-out (or a switch) the
    // stored visitor token is dropped too, so this browser stops holding the
    // previous customer's conversation.
    useEffect(() => {
        const previous = customerTokenRef.current;
        if (previous === customerToken) {
            return;
        }
        customerTokenRef.current = customerToken;
        if (previous) {
            clearVisitorToken();
        }
        resetConversationState();
        if (isOpen) {
            void ensureSession();
        }
    }, [customerToken, isOpen, ensureSession, resetConversationState]);

    const isLive = isOpen && !isUnavailable && status !== "closed";

    // The socket only signals "something changed" — the fetch above does the
    // work, so a dropped socket degrades to polling rather than to a second,
    // separately-buggy rendering path.
    const isSocketConnected = usePublicChatSocket({
        enabled: isLive && hasSession,
        onWake: () => {
            void refresh();
        },
        onAgentTyping: setIsAgentTyping,
    });

    // Poll while the panel is open: fast when the socket is down (it is then the
    // only transport), slow when it is up (a safety net for missed frames).
    useEffect(() => {
        if (!isLive) {
            return;
        }

        let cancelled = false;
        const timer = setInterval(() => {
            if (!cancelled) {
                void refresh();
            }
        }, isSocketConnected ? SOCKET_POLL_INTERVAL_MS : POLL_INTERVAL_MS);

        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [isLive, isSocketConnected, refresh]);

    useEffect(() => () => {
        if (thinkingTimerRef.current) {
            clearTimeout(thinkingTimerRef.current);
        }
    }, []);

    const value = useMemo(
        () => ({
            isOpen,
            messages,
            status,
            hasAgent,
            agentName,
            isBotThinking,
            isAgentTyping,
            isConnecting,
            isUnavailable,
            humanHandoffEnabled,
            requireIdentification,
            hasIdentified,
            markIdentified,
            open,
            close,
            toggle,
            sendMessage,
            requestHuman,
            endConversation,
            startNewChat,
            eraseConversationData,
        }),
        [
            isOpen,
            messages,
            status,
            hasAgent,
            agentName,
            isBotThinking,
            isAgentTyping,
            isConnecting,
            isUnavailable,
            humanHandoffEnabled,
            requireIdentification,
            hasIdentified,
            markIdentified,
            open,
            close,
            toggle,
            sendMessage,
            requestHuman,
            endConversation,
            startNewChat,
            eraseConversationData,
        ],
    );

    return <PublicChatContext.Provider value={value}>{children}</PublicChatContext.Provider>;
}

function usePublicChat() {
    const context = useContext(PublicChatContext);
    if (!context) {
        throw new Error("usePublicChat must be used within PublicChatProvider");
    }
    return context;
}

export type {PublicChatContextValue, PublicChatMessage, PublicChatSessionContext};
export {PublicChatProvider, usePublicChat};
