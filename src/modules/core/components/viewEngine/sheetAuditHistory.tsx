import {compose} from "redux";
import {useCallback, useEffect, useMemo, useState} from "react";
import withLanguage, {ResolveLanguageKey, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@coreModule/components/ui/sheet.tsx";
import {FLOATING_SHEET_CONTENT_CLASS} from "@coreModule/components/viewEngine/sheetFloatingChrome.ts";
import {cn} from "@coreModule/components/lib/utils.ts";
import Loader from "@coreModule/components/custom/loader.tsx";
import {formatDistanceToNow} from "date-fns";
import {History, X} from "lucide-react";
import type {
    DocumentAuditChangeDto,
    DocumentAuditEntryDto,
    DocumentAuditLogResponseDto,
} from "armonia/src/modules/core/api/auxiliary/private/auditLog/documentAuditLog.dto";
import type {AuditFieldHint} from "@coreModule/components/viewEngine/collectFieldLabelsFromViewConfig.ts";
import {auditHintOrPrimitive} from "@coreModule/components/viewEngine/collectFieldLabelsFromViewConfig.ts";
import {AuditDiffValuePresentation} from "@coreModule/components/viewEngine/auditDisplayValue.tsx";

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

/** Secondary panel — slightly narrower than the main entity sheet body. */
const ACTIVITY_SHEET_WIDTH_CLASS =
    "max-w-[98vw] min-w-[98vw] sm:min-w-0 lg:max-w-md lg:min-w-[min(28rem,calc(100vw-16px))] overflow-y-auto !z-[60]";

function AuditActivityIcon({className}: {className?: string}) {
    return <History aria-hidden className={cn("shrink-0", className)} />;
}

function actionVerb(
    action: DocumentAuditEntryDto["action"],
    resolveLanguageKey: ResolveLanguageKey,
): string {
    switch (action) {
        case "CREATE":
            return String(resolveLanguageKey("actionCreate"));
        case "UPDATE":
            return String(resolveLanguageKey("actionUpdate"));
        case "DELETE":
            return String(resolveLanguageKey("actionDelete"));
        case "RESTORE":
            return String(resolveLanguageKey("actionRestore"));
        default:
            return action;
    }
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

    const labels = useMemo(() => fieldLabels, [fieldLabels]);

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
            const labelKey = labels[fieldPath];
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
        [labels, sheetResolveLanguageKey, resolveLanguageKey],
    );

    const renderChangeRow = useCallback(
        (c: DocumentAuditChangeDto) => (
            <div
                key={c.field}
                className={cn(
                    "rounded-md border px-3 py-2 text-xs space-y-1",
                    "border-sidebar-border/70 bg-sidebar-accent/25 text-sidebar-foreground",
                )}
            >
                <p className="font-medium">{fieldTitle(c.field)}</p>
                <div className="grid gap-1 text-sidebar-foreground/80">
                    <p>
                        <span className="font-medium text-sidebar-foreground">{resolveLanguageKey("from")}:</span>{" "}
                        <AuditDiffValuePresentation
                            value={c.from}
                            hint={auditHintOrPrimitive(c.field, auditFieldHints)}
                            resolveLanguageKey={resolveLanguageKey}
                        />
                    </p>
                    <p>
                        <span className="font-medium text-sidebar-foreground">{resolveLanguageKey("to")}:</span>{" "}
                        <AuditDiffValuePresentation
                            value={c.to}
                            hint={auditHintOrPrimitive(c.field, auditFieldHints)}
                            resolveLanguageKey={resolveLanguageKey}
                        />
                    </p>
                </div>
            </div>
        ),
        [auditFieldHints, fieldTitle, resolveLanguageKey],
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                showCloseButton={false}
                className={cn(FLOATING_SHEET_CONTENT_CLASS, ACTIVITY_SHEET_WIDTH_CLASS)}
            >
                <div className="flex min-h-0 flex-1 flex-col">
                    <SheetHeader className="flex shrink-0 border-b border-sidebar-border/60 bg-sidebar-accent/15 p-0 shadow-sm">
                        <div className="flex w-full items-start justify-between gap-2 p-2">
                            <div className="flex min-w-0 flex-1 items-start gap-3">
                                <div
                                    className={cn(
                                        "flex size-10 shrink-0 items-center justify-center rounded-lg",
                                        "bg-sidebar-accent/50 text-sidebar-foreground/80 ring-1 ring-sidebar-border/70",
                                    )}
                                    aria-hidden
                                >
                                    <AuditActivityIcon className="size-5" />
                                </div>
                                <div className="min-w-0 flex-1 space-y-1">
                                    <SheetTitle className="text-base font-medium md:text-lg">
                                        {resolveLanguageKey("drawerTitle")}
                                    </SheetTitle>
                                    <SheetDescription className="text-sm">
                                        {resolveLanguageKey("drawerDescription")}
                                    </SheetDescription>
                                </div>
                            </div>
                            <SheetClose asChild>
                                <Button variant="ghost" size="icon" className="shrink-0" type="button" aria-label="Close">
                                    <X className="size-4" />
                                </Button>
                            </SheetClose>
                        </div>
                    </SheetHeader>

                    <div className="flex-full min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-6 mt-4">
                        {loading && entries.length === 0 ? (
                            <div className="flex justify-center py-8">
                                <Loader />
                                <span className="sr-only">{String(resolveLanguageKey("loading"))}</span>
                            </div>
                        ) : null}

                        {error && !loading && entries.length === 0 ? (
                            <div className="space-y-3 py-8 text-center">
                                <p className="text-sm font-medium text-sidebar-foreground">{resolveLanguageKey("errorTitle")}</p>
                                <Button variant="outline" size="sm" type="button" onClick={() => void fetchPage(null, false)}>
                                    {resolveLanguageKey("retry")}
                                </Button>
                            </div>
                        ) : null}

                        {!loading && !error && entries.length === 0 ? (
                            <p className="py-8 text-center text-sm text-sidebar-foreground/80">{resolveLanguageKey("empty")}</p>
                        ) : null}

                        {entries.length > 0 ? (
                            <ul className="relative ml-2 space-y-6 border-l border-sidebar-border/80 pl-3">
                                {entries.map((e) => {
                                    const when = formatDistanceToNow(new Date(e.createdAt), {addSuffix: true});
                                    const who = e.actor?.displayName ?? String(resolveLanguageKey("systemActor"));
                                    const verb = actionVerb(e.action, resolveLanguageKey);
                                    return (
                                        <li key={e.id} className="space-y-2 pl-5 -translate-x-[1px]">
                                            <div className="relative">
                                                <span
                                                    className="pointer-events-none absolute -left-[1.375rem] top-1.5 size-2.5 rounded-full border border-sidebar-border bg-sidebar shadow-[0_0_0_4px_var(--color-sidebar)]"
                                                    aria-hidden
                                                />
                                                <p className="text-sm">
                                                    <span className="font-medium text-sidebar-foreground">{who}</span>{" "}
                                                    <span className="text-sidebar-foreground/75">{verb}</span>
                                                </p>
                                                <p className="mt-0.5 text-xs text-sidebar-foreground/65">{when}</p>
                                            </div>
                                            {(e.action === "UPDATE" || e.action === "CREATE") &&
                                                (e.changes.length === 0 ? (
                                                    <p className="text-xs italic text-sidebar-foreground/70">
                                                        {resolveLanguageKey("noFieldChanges")}
                                                    </p>
                                                ) : (
                                                    <div className="space-y-2">{e.changes.map((c) => renderChangeRow(c))}</div>
                                                ))}
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : null}

                        {entries.length > 0 && nextCursor ? (
                            <div className="flex justify-center pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                    disabled={loadingMore}
                                    onClick={() => void fetchPage(nextCursor, true)}
                                    className="border-sidebar-border/80 bg-transparent"
                                >
                                    {loadingMore ? resolveLanguageKey("loading") : resolveLanguageKey("loadMore")}
                                </Button>
                            </div>
                        ) : null}
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
    withLanguage("src/modules/core/components/viewEngine/sheetAuditHistory.tsx"),
)(SheetAuditHistoryMenuLabelInner);

const SheetAuditHistoryDrawer = compose(
    withLanguage("src/modules/core/components/viewEngine/sheetAuditHistory.tsx"),
)(SheetAuditHistoryDrawerInner);

export default SheetAuditHistoryDrawer;
