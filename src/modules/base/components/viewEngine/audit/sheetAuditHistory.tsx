import {compose} from "redux";
import {useCallback, useEffect, useMemo, useState, type ReactNode} from "react";
import withLanguage, {ResolveLanguageKey, WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";
import apiClient from "@baseModule/helpers/apiClient/apiClient.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@coreModule/components/ui/sheet.tsx";
import {FLOATING_SHEET_CONTENT_CLASS} from "../sheet/widgets/sheetFloatingChrome.ts";
import {cn} from "@coreModule/components/lib/utils.ts";
import {History, X} from "lucide-react";
import {IconAlertTriangle, IconChevronDown, IconRefresh} from "@tabler/icons-react";
import {Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle} from "@coreModule/components/ui/empty.tsx";
import Loader from "@baseModule/components/custom/loader/loader.tsx";
import type {
    DocumentAuditEntryDto,
    DocumentAuditLogResponseDto,
} from "armonia/src/modules/core/api/auxiliary/private/auditLog/documentAuditLog.dto.ts";
import type {AuditFieldHint} from "./auditFieldHints.ts";
import {AuditDayHeading, AuditEntry, AuditTimelineSkeleton, groupEntriesByDay} from "./auditTimeline.tsx";
import {AuditReferenceLabelsProvider} from "./auditDisplayValue.tsx";

export type SheetAuditHistoryDrawerProps = WithLanguageType & {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    documentId?: string | null;
    /** Mongo collection name (same as `ViewConfig.model`). */
    collectionName: string;
    /** Merged labels: view-config keys + optional overrides. */
    fieldLabels?: Record<string, string>;
    /** From {@link collectAuditFieldHintsFromViewNodes} — drives {@link SingleFile} and ref resolution. */
    auditFieldHints?: Record<string, AuditFieldHint>;
    /**
     * {@link ResolveLanguageKey} from the hosting sheet/page (same bundle {@link SheetViewRenderer} uses).
     * Resolves keys coming from {@link FieldBinding.label} in `*.views.ts` so audit rows match sheet copy.
     */
    sheetResolveLanguageKey: ResolveLanguageKey;
};

const AUDIT_DOCUMENT_URL = "/api/auxiliary/auditLog/document";

/**
 * Secondary panel: 36rem on tablets, 44rem on desktop, never wider than the viewport. `!` beats the
 * base sheet's `sm:max-w-sm` for right-side sheets. No z-index override:
 * it mounts after the entity sheet so it already stacks above it, and a raised layer would
 * hide the file menus and previews (z-50 portals) opened from inside it.
 */
const ACTIVITY_SHEET_WIDTH_CLASS =
    "!w-[98vw] !max-w-[98vw] sm:!w-[min(36rem,calc(100vw-16px))] lg:!w-[min(44rem,calc(100vw-16px))] overflow-y-auto";

function AuditActivityIcon({className}: {className?: string}) {
    return <History aria-hidden className={cn("shrink-0", className)} />;
}

function SheetAuditHistoryDrawerInner({
    open,
    onOpenChange,
    documentId,
    collectionName,
    fieldLabels = {},
    auditFieldHints,
    sheetResolveLanguageKey,
    resolveLanguageKey,
}: SheetAuditHistoryDrawerProps) {
    const [entries, setEntries] = useState<DocumentAuditEntryDto[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(false);
    const [referenceLabels, setReferenceLabels] = useState<Record<string, string>>({});

    const fetchPage = useCallback(
        async (cursor: string | null, append: boolean) => {
            if (!documentId || !collectionName) {
                return;
            }
            if (append) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
            setError(false);
            try {
                const res = await apiClient.get<DocumentAuditLogResponseDto>(AUDIT_DOCUMENT_URL, {
                    params: {
                        documentId,
                        collectionName,
                        limit: 25,
                        ...(cursor ? {cursor} : {}),
                    },
                });
                const data = res.data;
                setEntries((prev) => (append ? [...prev, ...data.entries] : data.entries));
                setReferenceLabels((prev) => (append ? {...prev, ...data.referenceLabels} : (data.referenceLabels ?? {})));
                setNextCursor(data.nextCursor ?? null);
            } catch {
                setError(true);
                if (!append) {
                    setEntries([]);
                    setNextCursor(null);
                }
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [documentId, collectionName],
    );

    useEffect(() => {
        if (!open || !documentId) {
            return;
        }
        void fetchPage(null, false);
    }, [open, documentId, collectionName, fetchPage]);

    const fieldTitle = useCallback(
        (fieldPath: string) => {
            const labelKey = fieldLabels[fieldPath];
            if (labelKey) {
                const fromSheet = sheetResolveLanguageKey(labelKey, true);
                if (typeof fromSheet === "string" && fromSheet.trim().length > 0) {
                    return fromSheet;
                }
            }
            const directKey = sheetResolveLanguageKey(fieldPath, true);
            if (typeof directKey === "string" && directKey.trim().length > 0) {
                return directKey;
            }
            return `${resolveLanguageKey("unknownField")} (${fieldPath})`;
        },
        [fieldLabels, sheetResolveLanguageKey, resolveLanguageKey],
    );

    const groups = useMemo(() => groupEntriesByDay(entries, resolveLanguageKey), [entries, resolveLanguageKey]);

    let body: ReactNode;
    if (loading && entries.length === 0) {
        body = <AuditTimelineSkeleton label={String(resolveLanguageKey("loading"))} />;
    } else if (error && entries.length === 0) {
        body = (
            <Empty className="py-10">
                <EmptyHeader>
                    <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
                        <IconAlertTriangle />
                    </EmptyMedia>
                    <EmptyTitle>{resolveLanguageKey("errorTitle")}</EmptyTitle>
                </EmptyHeader>
                <EmptyContent>
                    <Button variant="outline" size="sm" type="button" onClick={() => void fetchPage(null, false)}>
                        <IconRefresh />
                        {resolveLanguageKey("retry")}
                    </Button>
                </EmptyContent>
            </Empty>
        );
    } else if (entries.length === 0) {
        body = (
            <Empty className="py-10">
                <EmptyHeader>
                    <EmptyMedia variant="icon" className="bg-sidebar-accent text-sidebar-foreground/70">
                        <History />
                    </EmptyMedia>
                    <EmptyTitle>{resolveLanguageKey("empty")}</EmptyTitle>
                    <EmptyDescription>{resolveLanguageKey("emptyDescription")}</EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    } else {
        body = (
            <div className="flex flex-col gap-4">
                {groups.map((group) => (
                    <section key={group.key}>
                        <AuditDayHeading label={group.label} />
                        <ol className="flex flex-col">
                            {group.entries.map((entry, i) => (
                                <AuditEntry
                                    key={entry.id}
                                    entry={entry}
                                    isLast={i === group.entries.length - 1}
                                    fieldTitle={fieldTitle}
                                    hints={auditFieldHints}
                                    t={resolveLanguageKey}
                                />
                            ))}
                        </ol>
                    </section>
                ))}
                {nextCursor && (
                    <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        disabled={loadingMore}
                        onClick={() => void fetchPage(nextCursor, true)}
                        className="self-center text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    >
                        {loadingMore ? <Loader inline className="size-4" /> : <IconChevronDown />}
                        {loadingMore ? resolveLanguageKey("loading") : resolveLanguageKey("loadMore")}
                    </Button>
                )}
            </div>
        );
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                showCloseButton={false}
                className={cn(FLOATING_SHEET_CONTENT_CLASS, ACTIVITY_SHEET_WIDTH_CLASS)}
            >
                <div className="flex min-h-0 flex-1 flex-col">
                    <SheetHeader className="flex shrink-0 border-b border-sidebar-border/60 p-0">
                        <div className="flex w-full items-center justify-between gap-2 px-4 py-3">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div
                                    className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-foreground/80"
                                    aria-hidden
                                >
                                    <AuditActivityIcon className="size-4.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <SheetTitle className="text-base font-semibold">{resolveLanguageKey("drawerTitle")}</SheetTitle>
                                    <SheetDescription className="text-xs">{resolveLanguageKey("drawerDescription")}</SheetDescription>
                                </div>
                            </div>
                            <SheetClose asChild>
                                <Button variant="ghost" size="icon-sm" className="shrink-0" type="button" aria-label={String(resolveLanguageKey("close"))}>
                                    <X className="size-4" />
                                </Button>
                            </SheetClose>
                        </div>
                    </SheetHeader>

                    <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-1 pb-6">
                        <AuditReferenceLabelsProvider value={referenceLabels}>{body}</AuditReferenceLabelsProvider>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function SheetAuditHistoryMenuLabelInner({resolveLanguageKey}: WithLanguageType) {
    return (
        <>
            <AuditActivityIcon />
            <span>{resolveLanguageKey("menuItem")}</span>
        </>
    );
}

/** Localized “Activity” label for {@link SheetViewRenderer} action menu entries. */
export const SheetAuditHistoryMenuLabel = compose(
    withLanguage("src/modules/core/components/viewEngine/audit/sheetAuditHistory.tsx"),
)(SheetAuditHistoryMenuLabelInner);

const SheetAuditHistoryDrawer = compose(
    withLanguage("src/modules/core/components/viewEngine/audit/sheetAuditHistory.tsx"),
)(SheetAuditHistoryDrawerInner);

export default SheetAuditHistoryDrawer;
