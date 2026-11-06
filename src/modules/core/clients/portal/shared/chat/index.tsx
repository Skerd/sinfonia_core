import {IconMessageCircle, IconSend, IconX} from "@tabler/icons-react";
import {useCallback, useEffect, useRef, useState, type KeyboardEvent} from "react";
import {Link, useLocation} from "react-router-dom";
import {useSelector} from "react-redux";
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {
    PublicChatProvider,
    usePublicChat,
    type PublicChatMessage,
} from "@coreModule/helpers/chat/publicChat/publicChatContext.tsx";
import {PUBLIC_CHAT_MAX_MESSAGE_LENGTH} from "armonia/src/modules/core/api/user/public/publicChat/sendPublicChatMessage/sendPublicChatMessage.form.validator";
import {usePortalSession} from "../portalSession.tsx";
import {usePortalSite} from "../portalSiteContext.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";

const LANGUAGE_PATH = "src/modules/core/clients/portal/shared/chat/index.tsx";

const SCROLL_CLASS = cn(
    "[scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.45)_rgba(255,255,255,0.12)]",
    "[&::-webkit-scrollbar]:w-1.5",
    "[&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-primary-foreground/10",
    "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary-foreground/45",
);

const TEXT_LINK_CLASS = "cursor-pointer text-xs text-primary-foreground/75 underline underline-offset-2 transition-colors hover:text-primary-foreground";

/** One chat bubble. The customer speaks on the right; the assistant and the team on the left. */
function PortalChatBubble({message, notDelivered}: {message: PublicChatMessage; notDelivered: string}) {
    const isVisitor = message.author === "visitor";

    return (
        <div className={cn("flex w-full flex-col", isVisitor ? "items-end" : "items-start")}>
            {message.author === "agent" && message.authorName ? (
                <span className="mb-1 px-1 text-xs text-primary-foreground/70">{message.authorName}</span>
            ) : null}
            <p
                className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-left text-sm leading-relaxed text-primary-foreground",
                    isVisitor ? "bg-primary-foreground/15" : "bg-primary-foreground/20",
                    message.pending && "opacity-60",
                    message.failed && "border border-red-300/70",
                )}
            >
                {message.text}
            </p>
            {message.failed ? <span className="mt-1 px-1 text-xs text-red-200">{notDelivered}</span> : null}
        </div>
    );
}

/** Three-dot "someone is composing a reply" indicator. */
function PortalChatTyping({label}: {label: string}) {
    return (
        <div className="flex w-full justify-start" aria-live="polite" aria-label={label}>
            <span className="flex items-center gap-1.5 rounded-2xl bg-primary-foreground/20 px-3.5 py-3">
                {[0, 150, 300].map((delay) => (
                    <span key={delay} className="size-1.5 animate-pulse rounded-full bg-primary-foreground/80" style={{animationDelay: `${delay}ms`}} />
                ))}
            </span>
        </div>
    );
}

function PortalChatPanel({resolveLanguageKey}: WithLanguageType) {
    const {
        messages,
        close,
        sendMessage,
        isBotThinking,
        isAgentTyping,
        isConnecting,
        isUnavailable,
        hasAgent,
        agentName,
        status,
        humanHandoffEnabled,
        requestHuman,
        startNewChat,
    } = usePublicChat();
    const {site} = usePortalSite();
    const {isAuthenticated, user} = usePortalSession();
    const location = useLocation();
    const [draft, setDraft] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isClosed = status === "closed";
    const canSend = !isUnavailable && !isClosed;
    const isWaitingForHuman = status === "requested_human";
    // Offer "talk to a person" only while the assistant still owns the conversation.
    const canRequestHuman = humanHandoffEnabled && canSend && status === "bot";

    // Greeting-only counts as the idle hero, not a sparse message thread.
    const greetingMessage = messages.length === 1 && messages[0]?.id === "greeting" ? messages[0] : null;
    const hasConversation = messages.some((message) => message.id !== "greeting") || isBotThinking || isAgentTyping;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messages.length, isBotThinking, isAgentTyping, isClosed]);

    const handleSend = useCallback(() => {
        if (!draft.trim() || !canSend) {
            return;
        }
        sendMessage(draft);
        setDraft("");
    }, [draft, sendMessage, canSend]);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
            }
        },
        [handleSend],
    );

    const idleCopy = isConnecting
        ? resolveLanguageKey("connecting")
        : isUnavailable
            ? resolveLanguageKey("unavailable")
            : greetingMessage?.text ?? resolveLanguageKey("idleGreeting");
    const title = hasAgent && agentName
        ? agentName
        : site?.company.name ?? resolveLanguageKey("fallbackTitle");
    const banner = isClosed
        ? resolveLanguageKey("closedBanner")
        : hasAgent && agentName
            ? resolveLanguageKey("agentJoined").replace("{name}", agentName)
            : isWaitingForHuman
                ? resolveLanguageKey("waitingBanner")
                : null;
    const loginHref = `/login?next=${encodeURIComponent(location.pathname + location.search)}`;

    return (
        <div
            role="dialog"
            aria-label={title}
            className="relative flex h-[min(85vh,40rem)] w-[min(calc(100vw-2rem),26rem)] flex-col overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-[0_18px_50px_rgba(2,40,140,0.35)]"
        >
            <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
                <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-primary-foreground/90">{title}</p>
                        {isAuthenticated && user.name ? (
                            <p className="truncate text-xs text-primary-foreground/65">
                                {resolveLanguageKey("chattingAs").replace("{name}", user.name)}
                            </p>
                        ) : null}
                    </div>
                    <Button variant="bare"
                        type="button"
                        onClick={close}
                        aria-label={resolveLanguageKey("close")}
                        className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-primary-foreground/10"
                    >
                        <IconX className="size-4" aria-hidden />
                    </Button>
                </div>

                {banner ? (
                    <div className="mb-3 shrink-0 rounded-xl bg-primary-foreground/12 px-3 py-2 text-xs leading-relaxed text-primary-foreground/95">
                        {banner}
                    </div>
                ) : null}

                <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                    {hasConversation ? (
                        <div className={cn("mb-3 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pe-1", SCROLL_CLASS)}>
                            {messages.map((message) => (
                                <PortalChatBubble key={message.id} message={message} notDelivered={resolveLanguageKey("notDelivered")} />
                            ))}
                            {isAgentTyping ? (
                                <PortalChatTyping label={resolveLanguageKey("teamTyping").replace("{name}", agentName ?? resolveLanguageKey("ourTeam"))} />
                            ) : isBotThinking ? (
                                <PortalChatTyping label={resolveLanguageKey("assistantTyping")} />
                            ) : null}
                            <div ref={messagesEndRef} />
                        </div>
                    ) : (
                        <div className="mb-3 flex min-h-0 flex-1 flex-col items-center justify-center gap-3.5 overflow-hidden px-3">
                            <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 md:size-[4.5rem]">
                                <IconMessageCircle className="size-7" aria-hidden />
                            </span>
                            <p className="max-w-[19rem] shrink-0 text-center font-display text-lg font-semibold leading-snug md:text-xl">
                                {idleCopy}
                            </p>
                        </div>
                    )}
                </div>

                {canRequestHuman || (!isAuthenticated && canSend) ? (
                    <div className="mb-2 flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-1">
                        {!isAuthenticated && canSend ? (
                            <Link to={loginHref} onClick={close} className={TEXT_LINK_CLASS}>
                                {resolveLanguageKey("logInHint")}
                            </Link>
                        ) : null}
                        {canRequestHuman ? (
                            <Button variant="bare" type="button" onClick={() => requestHuman()} className={TEXT_LINK_CLASS}>
                                {resolveLanguageKey("talkToPerson")}
                            </Button>
                        ) : null}
                    </div>
                ) : null}

                {isClosed ? (
                    <Button variant="bare"
                        type="button"
                        onClick={() => {
                            setDraft("");
                            startNewChat();
                        }}
                        disabled={isConnecting}
                        className="w-full shrink-0 cursor-pointer rounded-xl bg-primary-foreground px-3 py-2.5 text-sm font-medium text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {resolveLanguageKey(isConnecting ? "starting" : "startNewChat")}
                    </Button>
                ) : (
                    <div className="flex shrink-0 items-center gap-2 rounded-xl border border-primary-foreground/70 bg-primary-foreground/5 px-3 py-2.5">
                        <Input
                            type="text"
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={!canSend}
                            maxLength={PUBLIC_CHAT_MAX_MESSAGE_LENGTH}
                            placeholder={resolveLanguageKey(isUnavailable ? "placeholderUnavailable" : "placeholder")}
                            aria-label={resolveLanguageKey("placeholder")}
                            className="h-auto min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-[15px] leading-6 text-primary-foreground shadow-none outline-none placeholder:text-primary-foreground/55 focus-visible:ring-0 disabled:cursor-not-allowed disabled:bg-transparent disabled:opacity-60 md:text-[15px] dark:bg-transparent"
                        />
                        <Button variant="bare"
                            type="button"
                            onClick={handleSend}
                            disabled={!draft.trim() || !canSend}
                            aria-label={resolveLanguageKey("send")}
                            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-primary-foreground/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <IconSend className="size-[17px]" aria-hidden />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

/** Floating launcher + panel, pinned bottom-right on every shop page. */
function PortalChatWidget(props: WithLanguageType) {
    const {isOpen, open} = usePublicChat();

    return (
        <div aria-live="polite" className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 md:bottom-8 md:right-8">
            {isOpen ? (
                <PortalChatPanel {...props} />
            ) : (
                <Button variant="bare"
                    type="button"
                    /* Wrapped: `open` takes an optional context object, and React
                       would otherwise pass the MouseEvent into it. */
                    onClick={() => open()}
                    aria-label={props.resolveLanguageKey("open")}
                    className="flex size-14 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_18px_50px_rgba(2,40,140,0.35)] transition-transform duration-300 hover:scale-110 md:size-16"
                >
                    <IconMessageCircle className="size-6 md:size-7" aria-hidden />
                </Button>
            )}
        </div>
    );
}

/**
 * Website chat for the shop — the same visitor chat the propertyManagement site
 * runs, without lead capture. A signed-in customer's conversation belongs to
 * their account (named in the team's inbox, resumable on any device); a
 * signed-out visitor chats anonymously. Either way it reaches the team's
 * "Website chats" queue once they ask for a person.
 *
 * Renders nothing unless the company has switched the website chat on (on its own site only).
 */
function PortalChatInner(props: WithLanguageType) {
    const {site} = usePortalSite();
    const {isAuthenticated} = usePortalSession();
    const token = useSelector((state: RootState) => state.authentication.token);

    if (!site?.company.chatEnabled) {
        return null;
    }

    return (
        <PublicChatProvider customerToken={isAuthenticated ? token : null}>
            <PortalChatWidget {...props} />
        </PublicChatProvider>
    );
}

export default compose(withLanguage(LANGUAGE_PATH), withDebug(true, true))(PortalChatInner);
