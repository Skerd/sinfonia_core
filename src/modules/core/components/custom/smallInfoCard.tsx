import type { ComponentType, ReactNode } from "react";
import { Suspense, useState } from "react";
import { cn } from "@coreModule/components/lib/utils.ts";
import {
    Item,
    ItemActions,
    ItemContent,
    ItemMedia,
    ItemTitle,
} from "@coreModule/components/ui/item.tsx";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import { useAccess } from "@coreModule/helpers/hocs/withAccess.tsx";
import { IconInfoCircle, IconLink } from "@tabler/icons-react";

/** Open/close wiring from `#SmallInfoCard`; renderer may bind extra props (e.g. `fetchId`). */
export type SmallInfoCardLinkedSheetOuterProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Called after linked entity delete succeeds; SmallInfoCard clears value and disables the link badge. */
    onLinkedDeleted?: () => void;
};

type SmallInfoCardVariant = "default" | "success" | "destructive" | "warning" | "info";

/** Any icon component that accepts `className` (Lucide, react-icons, Phosphor, custom SVG, etc.). */
export type SmallInfoCardIcon = ComponentType<{ className?: string }>;

type SmallInfoCardProps = {
    show?: boolean,
    variant?: SmallInfoCardVariant;
    title: string;
    Icon?: SmallInfoCardIcon;
    value: any;
    tooltip: string;
    /** When true, only icon and title are shown (no value / ValueNotSet row). */
    dontRenderValue?: boolean;
    /**
     * External URL: shows a link badge that opens the URL in a new tab.
     * Prefer with `dontRenderValue` so long URLs do not overflow the sheet.
     */
    externalHref?: string;
    /**
     * Linked ref: badge uses `useAccess(resourceId)`; `LinkedSheet` comes from config `linkedSheetWidget`
     * (resolved in the view renderer).
     */
    linkedReferenceSheet?: {
        resourceId: string;
        LinkedSheet: ComponentType<SmallInfoCardLinkedSheetOuterProps>;
    };
};

/**
 * Applied over `Item variant="outline"`, so every variant keeps the same 1px box and
 * the grid stays aligned; `default` just makes its border invisible.
 */
const containerStyles: Record<SmallInfoCardVariant, string> = {
    default: "border-transparent bg-muted/30",
    success: "border-status-sold/30 bg-status-sold/5",
    destructive: "border-destructive/30 bg-destructive/5",
    warning: "border-status-reserved/30 bg-status-reserved/5",
    info: "border-status-available/30 bg-status-available/5",
};

const iconWrapStyles: Record<SmallInfoCardVariant, string> = {
    default: "bg-background",
    success: "bg-status-sold/15",
    destructive: "bg-destructive/10",
    warning: "bg-status-reserved/15",
    info: "bg-status-available/15",
};

/** Icon and value use the same semantic color per variant. */
const accentTextStyles: Record<SmallInfoCardVariant, string> = {
    default: "text-muted-foreground",
    success: "text-status-sold",
    destructive: "text-destructive",
    warning: "text-status-reserved",
    info: "text-status-available",
};

const valueTextStyles: Record<SmallInfoCardVariant, string> = {
    default: "text-foreground",
    success: "text-status-sold",
    destructive: "text-destructive",
    warning: "text-status-reserved",
    info: "text-status-available",
};

function resourceHasPositiveRead(read: unknown): boolean {
    return (
        read === true ||
        (!!read && typeof read === "object" && Object.keys(read as object).length > 0)
    );
}

function SmallInfoCardNestedSheets({
    LinkedSheet,
    linkedOpen,
    onClose,
    onLinkedDeleted,
}: {
    LinkedSheet: ComponentType<SmallInfoCardLinkedSheetOuterProps>;
    linkedOpen: boolean;
    onClose: () => void;
    onLinkedDeleted?: () => void;
}) {
    if (!linkedOpen) {
        return null;
    }
    return (
        <Suspense fallback={null}>
            <LinkedSheet
                open
                onLinkedDeleted={onLinkedDeleted}
                onOpenChange={(next: boolean) => {
                    if (!next) {
                        onClose();
                    }
                }}
            />
        </Suspense>
    );
}

function normalizeExternalHref(href: string): string | null {
    const trimmed = href.trim();
    if (!trimmed) {
        return null;
    }
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }
    if (/^\/\//.test(trimmed)) {
        return `https:${trimmed}`;
    }
    // Block javascript: and other non-http schemes
    if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^https?:/i.test(trimmed)) {
        return null;
    }
    return `https://${trimmed}`;
}

export default function SmallInfoCard({
    show = true,
    variant = "default",
    title,
    Icon,
    value,
    tooltip,
    dontRenderValue = false,
    externalHref,
    linkedReferenceSheet,
}: SmallInfoCardProps) {

    const accessResourceId = linkedReferenceSheet?.resourceId ?? "";
    const LinkedSheet = linkedReferenceSheet?.LinkedSheet;
    const linkedAccess = useAccess(accessResourceId);
    const showLinkedBadge =
        linkedReferenceSheet != null &&
        LinkedSheet != null &&
        accessResourceId.length > 0 &&
        resourceHasPositiveRead(linkedAccess.read);

    const resolvedExternalHref =
        typeof externalHref === "string" ? normalizeExternalHref(externalHref) : null;
    const showExternalBadge = resolvedExternalHref != null;

    const [linkedSheetOpen, setLinkedSheetOpen] = useState(false);
    const tooltipText = tooltip != null ? String(tooltip).trim() : "";
    const hasTooltip = tooltipText.length > 0;

    const checkValue = (v: ReactNode) => {
        if (v === null || v === undefined) return false;
        if (typeof v === "string") return v.trim().length > 0;
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === "boolean") {
            return true;
        }
        return true;
    };

    return (
        <>
            <Item
                variant="outline"
                className={cn("h-fit gap-2 p-2", containerStyles[variant])}
            >
                {Icon != null && (
                    <ItemMedia
                        className={cn(
                            "p-2.5 rounded-md",
                            iconWrapStyles[variant],
                        )}
                    >
                        <Icon
                            className={cn(
                                "h-5 w-5",
                                accentTextStyles[variant],
                            )}
                        />
                    </ItemMedia>
                )}
                <ItemContent className="min-w-0 gap-0.5">
                    <div className="flex items-center gap-1 min-w-0">
                        <ItemTitle className="min-w-0 font-medium text-muted-foreground">
                            {title}
                        </ItemTitle>
                        {hasTooltip && (
                            <TooltipDisplayer tooltip={tooltipText}>
                                <button
                                    type="button"
                                    className={cn(
                                        "inline-flex shrink-0 items-center justify-center rounded-full",
                                        "text-muted-foreground/70 hover:text-muted-foreground",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    )}
                                    aria-label={tooltipText}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <IconInfoCircle className="size-3.5" stroke={1.75} />
                                </button>
                            </TooltipDisplayer>
                        )}
                    </div>
                    {!dontRenderValue && (
                        <div
                            className={cn(
                                "text-base font-semibold",
                                value ? valueTextStyles[variant] : undefined,
                            )}
                        >
                            <HiddenElement randomLength={show ? 0 : 8}>
                                {
                                    !!show &&
                                    <>
                                        {checkValue(value) ? value : <div className="mt-0.5"><ValueNotSet /></div>}
                                    </>
                                }
                            </HiddenElement>
                        </div>
                    )}
                </ItemContent>
                {(showExternalBadge || (showLinkedBadge && LinkedSheet != null)) && (
                    <ItemActions>
                        {showExternalBadge && resolvedExternalHref != null ? (
                            <TooltipDisplayer tooltip={resolvedExternalHref}>
                                <a
                                    href={resolvedExternalHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                        "shrink-0 p-1.5 flex items-center justify-center rounded-md border border-border",
                                        "bg-background text-sm font-semibold text-muted-foreground",
                                        "hover:bg-muted hover:text-foreground hover:cursor-pointer",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    )}
                                    aria-label={title}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <IconLink size={16} />
                                </a>
                            </TooltipDisplayer>
                        ) : null}
                        {showLinkedBadge && LinkedSheet != null ? (
                            <TooltipDisplayer tooltip={title}>
                                <button
                                    type="button"
                                    className={cn(
                                        "shrink-0 p-1.5 flex items-center justify-center rounded-md border border-border",
                                        "bg-background text-sm font-semibold text-muted-foreground",
                                        "hover:bg-muted hover:text-foreground hover:cursor-pointer",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    )}
                                    aria-label={title}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setLinkedSheetOpen(true);
                                    }}
                                >
                                    <IconLink size={16} />
                                </button>
                            </TooltipDisplayer>
                        ) : null}
                    </ItemActions>
                )}
            </Item>
            {LinkedSheet != null && (
                <SmallInfoCardNestedSheets
                    LinkedSheet={LinkedSheet}
                    linkedOpen={linkedSheetOpen}
                    onClose={() => { setLinkedSheetOpen(false); }}
                    onLinkedDeleted={() => {
                        setLinkedSheetOpen(false);
                    }}
                />
            )}
        </>
    );
}
