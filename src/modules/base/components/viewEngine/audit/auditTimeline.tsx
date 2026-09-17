import {useState, type ComponentType} from "react";
import {format, formatDistanceToNow, isToday, isYesterday} from "date-fns";
import {IconArrowRight, IconPencil, IconPlus, IconRestore, IconRobot, IconTrash} from "@tabler/icons-react";
import type {
    DocumentAuditChangeDto,
    DocumentAuditEntryDto,
} from "armonia/src/modules/core/api/auxiliary/private/auditLog/documentAuditLog.dto.ts";
import type {ResolveLanguageKey} from "@baseModule/helpers/hocs/withLanguage.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Avatar, AvatarFallback} from "@coreModule/components/ui/avatar.tsx";
import {Skeleton} from "@coreModule/components/ui/skeleton.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {AuditDiffValuePresentation} from "./auditDisplayValue.tsx";
import {auditHintOrPrimitive, type AuditFieldHint} from "./auditFieldHints.ts";

type AuditAction = DocumentAuditEntryDto["action"];

type ActionStyle = {
    Icon: ComponentType<{className?: string}>;
    verbKey: string;
    /** Badge on the avatar. */
    badge: string;
};

const ACTION_STYLES: Record<AuditAction, ActionStyle> = {
    CREATE: {Icon: IconPlus, verbKey: "actionCreate", badge: "bg-success text-success-foreground"},
    UPDATE: {Icon: IconPencil, verbKey: "actionUpdate", badge: "bg-info text-info-foreground"},
    DELETE: {Icon: IconTrash, verbKey: "actionDelete", badge: "bg-destructive text-destructive-foreground"},
    RESTORE: {Icon: IconRestore, verbKey: "actionRestore", badge: "bg-warning text-warning-foreground"},
};

/** Changes shown before the rest are folded behind "Show all". */
const VISIBLE_CHANGES = 4;

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const letters = parts.length > 1 ? parts[0]![0]! + parts[parts.length - 1]![0]! : name.trim().slice(0, 2);
    return letters.toUpperCase() || "?";
}

function dayLabel(date: Date, t: ResolveLanguageKey): string {
    if (isToday(date)) return String(t("today"));
    if (isYesterday(date)) return String(t("yesterday"));
    return format(date, "PPP");
}

export type AuditDayGroup = {key: string; label: string; entries: DocumentAuditEntryDto[]};

/** Entries (newest first) grouped by calendar day, keeping order. */
export function groupEntriesByDay(entries: DocumentAuditEntryDto[], t: ResolveLanguageKey): AuditDayGroup[] {
    const groups: AuditDayGroup[] = [];
    for (const entry of entries) {
        const date = new Date(entry.createdAt);
        const key = format(date, "yyyy-MM-dd");
        const last = groups[groups.length - 1];
        if (last?.key === key) last.entries.push(entry);
        else groups.push({key, label: dayLabel(date, t), entries: [entry]});
    }
    return groups;
}

type ChangeListProps = {
    changes: DocumentAuditChangeDto[];
    /** A create has no previous values, so only the new ones are shown. */
    showFrom: boolean;
    fieldTitle: (field: string) => string;
    hints: Record<string, AuditFieldHint> | undefined;
    t: ResolveLanguageKey;
};

function ChangeList({changes, showFrom, fieldTitle, hints, t}: ChangeListProps) {
    const [expanded, setExpanded] = useState(false);
    const visible = expanded ? changes : changes.slice(0, VISIBLE_CHANGES);
    const hidden = changes.length - visible.length;

    return (
        <div className="overflow-hidden rounded-lg border border-sidebar-border/70 bg-sidebar-accent/20">
            <dl className="divide-y divide-sidebar-border/60">
                {visible.map((change) => {
                    const hint = auditHintOrPrimitive(change.field, hints);
                    return (
                        <div key={change.field} className="grid gap-1 px-3 py-2 text-xs">
                            <dt className="font-medium text-sidebar-foreground/70">{fieldTitle(change.field)}</dt>
                            <dd className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                                {showFrom && (
                                    <>
                                        <span className="min-w-0 text-sidebar-foreground/55 line-through decoration-sidebar-foreground/30">
                                            <AuditDiffValuePresentation value={change.from} hint={hint} resolveLanguageKey={t} />
                                        </span>
                                        <IconArrowRight aria-label={String(t("to"))} className="size-3.5 shrink-0 text-sidebar-foreground/40" />
                                    </>
                                )}
                                <span className="min-w-0 font-medium text-sidebar-foreground">
                                    <AuditDiffValuePresentation value={change.to} hint={hint} resolveLanguageKey={t} />
                                </span>
                            </dd>
                        </div>
                    );
                })}
            </dl>
            {changes.length > VISIBLE_CHANGES && (
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="w-full border-t border-sidebar-border/60 px-3 py-1.5 text-left text-xs font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                >
                    {expanded ? t("showFewerChanges") : `${t("showAllChanges")} (+${hidden})`}
                </button>
            )}
        </div>
    );
}

type AuditEntryProps = {
    entry: DocumentAuditEntryDto;
    isLast: boolean;
    fieldTitle: (field: string) => string;
    hints: Record<string, AuditFieldHint> | undefined;
    t: ResolveLanguageKey;
};

/** One timeline row: avatar with action badge, "who did what", when, and the field changes. */
export function AuditEntry({entry, isLast, fieldTitle, hints, t}: AuditEntryProps) {
    const style = ACTION_STYLES[entry.action] ?? ACTION_STYLES.UPDATE;
    const who = entry.actor?.displayName;
    const date = new Date(entry.createdAt);
    const showsChanges = entry.action === "UPDATE" || entry.action === "CREATE";
    const count = entry.changes.length;

    return (
        <li className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast && <span aria-hidden className="absolute top-10 bottom-0 left-4 w-px bg-sidebar-border/80" />}
            <div className="relative shrink-0">
                <Avatar>
                    <AvatarFallback className="bg-sidebar-accent text-xs font-medium text-sidebar-foreground">
                        {who ? initials(who) : <IconRobot className="size-4" />}
                    </AvatarFallback>
                </Avatar>
                <span
                    aria-hidden
                    className={cn(
                        "absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full ring-2 ring-sidebar",
                        style.badge,
                    )}
                >
                    <style.Icon className="size-2.5" />
                </span>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex min-w-0 items-start justify-between gap-2">
                    <p className="min-w-0 text-sm leading-5">
                        <span className="font-medium text-sidebar-foreground">{who ?? t("systemActor")}</span>{" "}
                        <span className="text-sidebar-foreground/70">{t(style.verbKey)}</span>
                        {showsChanges && count > 0 && (
                            <span className="text-sidebar-foreground/50">
                                {" · "}
                                {count} {t(count === 1 ? "fieldChanged" : "fieldsChanged")}
                            </span>
                        )}
                    </p>
                    <TooltipDisplayer tooltip={format(date, "PPpp")}>
                        <time dateTime={entry.createdAt} className="shrink-0 pt-0.5 text-xs text-sidebar-foreground/55">
                            {formatDistanceToNow(date, {addSuffix: true})}
                        </time>
                    </TooltipDisplayer>
                </div>

                {showsChanges &&
                    (count === 0 ? (
                        <p className="text-xs italic text-sidebar-foreground/60">{t("noFieldChanges")}</p>
                    ) : (
                        <ChangeList
                            changes={entry.changes}
                            showFrom={entry.action !== "CREATE"}
                            fieldTitle={fieldTitle}
                            hints={hints}
                            t={t}
                        />
                    ))}
            </div>
        </li>
    );
}

/** Placeholder rows while the first page loads. */
export function AuditTimelineSkeleton({label}: {label: string}) {
    return (
        <div className="flex flex-col gap-5" aria-busy>
            <span className="sr-only">{label}</span>
            {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                    <Skeleton className="size-8 shrink-0 rounded-full bg-sidebar-accent" />
                    <div className="flex flex-1 flex-col gap-2">
                        <Skeleton className="h-4 w-2/3 bg-sidebar-accent" />
                        <Skeleton className="h-16 w-full bg-sidebar-accent/60" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/** Sticky day heading above a group of entries. */
export function AuditDayHeading({label}: {label: string}) {
    return (
        <h3 className="sticky top-0 z-10 -mx-4 mb-3 bg-sidebar/95 px-4 py-1.5 text-xs font-semibold tracking-wide text-sidebar-foreground/60 uppercase backdrop-blur">
            {label}
        </h3>
    );
}
