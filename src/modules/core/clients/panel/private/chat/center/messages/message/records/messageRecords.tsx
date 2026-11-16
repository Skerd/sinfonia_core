import {IconChevronRight, IconFileDescription, IconLock, IconLinkOff} from "@tabler/icons-react";
import {Suspense, useState, type ReactNode} from "react";
import withLanguage, {type WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Dialog, DialogContent} from "@coreModule/components/ui/dialog.tsx";
import {MediaAvatar} from "@coreModule/components/viewEngine/widgets/display/mediaAvatar.tsx";
import {resolveWidget} from "@coreModule/components/viewEngine/widgetRegistry.ts";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import {UserProfile} from "@coreModule/clients/panel/private/users/center/cardView";
import {useChatRecords, useRecordTypeLabel, useResolvedRecords} from "@coreModule/helpers/chat/chatRecords.tsx";
import {recordRefKey, type MessageRecordRef} from "armonia/src/modules/core/helpers/chatTokens";
import type {ResolvedChatRecord} from "armonia/src/modules/core/api/user/private/chats/records/records.form.response.type";

/** Cards shown under a message before "+N more". */
const VISIBLE_CARDS = 3;
/** Company users open in their profile, not a sheet: they have no sheet view. */
const USERS = "users";

function initials(label: string): string {
    return label.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join("");
}

/** The sheet a record opens in, or `null` when its kind has none the user may see. */
function useRecordSheet(record: MessageRecordRef): {canOpen: boolean; render: (open: boolean, onOpenChange: (open: boolean) => void) => ReactNode} {
    const token = useViewConfig(record.collection, "sheet")?.sheetWidget;
    if (record.collection.toLowerCase() === USERS) {
        return {
            canOpen: true,
            render: (open, onOpenChange) => (
                <Dialog open={open} onOpenChange={onOpenChange}>
                    <DialogContent className="border-0 p-0">
                        <UserProfile specificUserId={record.id} />
                    </DialogContent>
                </Dialog>
            ),
        };
    }
    const Sheet = token ? resolveWidget(token) : null;
    return {
        canOpen: !!Sheet,
        render: (open, onOpenChange) => Sheet && open ? (
            <Suspense fallback={null}>
                <Sheet open={open} onOpenChange={onOpenChange} fetchId={record.id} />
            </Suspense>
        ) : null,
    };
}

type RecordState = {
    resolved: ResolvedChatRecord | undefined;
    /** Checked when the message was written; a token the server did not keep shows as unavailable. */
    kept: boolean;
};

function stateOf({resolved, kept}: RecordState): "loading" | "ok" | "noAccess" | "unavailable" {
    if (!kept) return "unavailable";
    return resolved?.status ?? "loading";
}

type RecordViewProps = WithLanguageType & {
    record: MessageRecordRef;
    kept: boolean;
};

/** One record's open/close state, wrapped around whatever shows it (chip or card). */
function useRecordOpener(record: MessageRecordRef) {
    const [open, setOpen] = useState(false);
    const records = useChatRecords();
    const sheet = useRecordSheet(record);
    const onOpenChange = (next: boolean) => {
        setOpen(next);
        // The sheet may have renamed or deleted it.
        if (!next) records?.refresh(record);
    };
    return {sheet, open, setOpen, element: sheet.render(open, onOpenChange)};
}

/** The small picture that leads a record: its photo, else a person's initials or the kind of state it is in. */
function RecordGlyph({record, state, resolved, className, iconClassName}: {
    record: MessageRecordRef;
    state: ReturnType<typeof stateOf>;
    resolved: ResolvedChatRecord | undefined;
    className: string;
    iconClassName: string;
}) {
    if (state === "ok" && resolved?.status === "ok" && resolved.photo) {
        return <MediaAvatar mediaId={resolved.photo} alt="" className={cn("border-0", className)} fallback={initials(resolved.label)} />;
    }
    let glyph: ReactNode = <IconFileDescription className={iconClassName} aria-hidden />;
    if (state === "noAccess") glyph = <IconLock className={iconClassName} aria-hidden />;
    else if (state === "unavailable") glyph = <IconLinkOff className={iconClassName} aria-hidden />;
    else if (record.collection.toLowerCase() === USERS && resolved?.status === "ok") glyph = initials(resolved.label);
    return <span className={cn("flex shrink-0 items-center justify-center", className)}>{glyph}</span>;
}

/** A record inside a message's text: a small pill with its picture and name, or why it can't be shown. */
function RecordChipInner({record, kept, owner, resolveLanguageKey}: RecordViewProps & {owner: boolean}) {
    const [resolved] = useResolvedRecords(kept ? [record] : []);
    const typeLabel = useRecordTypeLabel()(record.collection);
    const state = stateOf({resolved, kept});
    const {sheet, setOpen, element} = useRecordOpener(record);
    const label = resolved?.status === "ok" ? resolved.label : typeLabel;
    const openable = state === "ok" && sheet.canOpen;

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                aria-disabled={!openable}
                onClick={() => { if (openable) setOpen(true); }}
                title={state === "noAccess" ? resolveLanguageKey("noAccess") : state === "unavailable" ? resolveLanguageKey("unavailable") : `${label} · ${typeLabel}`}
                className={cn(
                    "mx-0.5 inline-flex h-auto max-w-full gap-1 rounded-md px-1.5 py-px align-baseline text-[length:inherit] leading-[inherit] font-medium",
                    owner
                        ? "bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25 hover:text-primary-foreground"
                        : "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
                    !openable && "cursor-default opacity-80",
                )}
            >
                <RecordGlyph record={record} state={state} resolved={resolved} className="size-4 rounded-sm text-3xs" iconClassName="size-3.5" />
                <span className="truncate">{label}</span>
            </Button>
            {element}
        </>
    );
}

/** One record as a compact card in the bubble's colours: picture, name and kind, all kinds alike. */
function RecordCardInner({record, kept, owner, resolveLanguageKey}: RecordViewProps & {owner: boolean}) {
    const [resolved] = useResolvedRecords(kept ? [record] : []);
    const typeLabel = useRecordTypeLabel()(record.collection);
    const state = stateOf({resolved, kept});
    const {sheet, setOpen, element} = useRecordOpener(record);
    const openable = state === "ok" && sheet.canOpen;
    const label = resolved?.status === "ok" ? resolved.label : undefined;

    let title: ReactNode;
    if (state === "ok") title = label;
    else if (state === "noAccess") title = resolveLanguageKey("noAccess");
    else if (state === "unavailable") title = resolveLanguageKey("unavailable");
    else title = <span className={cn("inline-block h-3.5 w-28 animate-pulse rounded", owner ? "bg-primary-foreground/20" : "bg-muted")} aria-hidden />;

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                aria-disabled={!openable}
                onClick={() => { if (openable) setOpen(true); }}
                aria-label={state === "ok" && label ? resolveLanguageKey("open").replace("{}", label) : undefined}
                className={cn(
                    "group/record flex h-auto w-full min-w-52 max-w-xs justify-start gap-2.5 rounded-lg border p-2 text-left font-normal whitespace-normal",
                    owner
                        ? "border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
                        : "border-border bg-background/70 text-foreground hover:bg-background hover:text-foreground",
                    !openable && "cursor-default hover:bg-transparent",
                )}
            >
                <RecordGlyph
                    record={record}
                    state={state}
                    resolved={resolved}
                    className={cn("size-9 rounded-md text-xs font-medium", owner ? "bg-primary-foreground/15" : "bg-muted text-muted-foreground")}
                    iconClassName="size-4.5"
                />
                <span className="flex min-w-0 flex-1 flex-col">
                    <span className={cn("truncate text-sm font-medium", state !== "ok" && "opacity-75")}>{title}</span>
                    <span className={cn("truncate text-xs", owner ? "text-primary-foreground/70" : "text-muted-foreground")}>{typeLabel}</span>
                </span>
                {openable ? <IconChevronRight className="size-4 shrink-0 opacity-50 transition-opacity group-hover/record:opacity-90" aria-hidden /> : null}
            </Button>
            {element}
        </>
    );
}

type MessageRecordCardsProps = WithLanguageType & {
    /** The records the server kept for the message. */
    records: MessageRecordRef[] | undefined;
    /** The signed-in user's own message: the cards take its bubble's colours. */
    owner: boolean;
};

/** The records a message shares, as cards under its text: the first few, then "+N more". */
function MessageRecordCardsInner({records, owner, resolveLanguageKey}: MessageRecordCardsProps) {
    const [expanded, setExpanded] = useState(false);
    if (!records?.length) return null;
    const visible = expanded ? records : records.slice(0, VISIBLE_CARDS);
    const hidden = records.length - visible.length;
    return (
        <div className="mt-1.5 mb-0.5 flex flex-col gap-1">
            {visible.map((record) => <RecordCard key={recordRefKey(record)} record={record} kept owner={owner} />)}
            {hidden > 0 ? (
                <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className={cn("h-auto self-start p-0 text-xs", owner && "text-primary-foreground/80")}
                    onClick={() => setExpanded(true)}
                >
                    {resolveLanguageKey("more").replace("{}", String(hidden))}
                </Button>
            ) : null}
        </div>
    );
}

export const RecordChip = withLanguage("src/modules/core/clients/panel/private/chat/center/messages/message/records/messageRecords.tsx")(RecordChipInner);
export const RecordCard = withLanguage("src/modules/core/clients/panel/private/chat/center/messages/message/records/messageRecords.tsx")(RecordCardInner);
export const MessageRecordCards = withLanguage("src/modules/core/clients/panel/private/chat/center/messages/message/records/messageRecords.tsx")(MessageRecordCardsInner);
