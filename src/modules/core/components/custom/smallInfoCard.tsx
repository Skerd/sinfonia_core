import type { ComponentType, ReactNode } from "react";
import { Suspense, useState } from "react";
import { cn } from "@coreModule/components/lib/utils.ts";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import { useAccess } from "@coreModule/helpers/hocs/withAccess.tsx";
import { IconLink } from "@tabler/icons-react";

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
     * Linked ref: badge uses `useAccess(resourceId)`; `LinkedSheet` comes from config `linkedSheetWidget`
     * (resolved in the view renderer).
     */
    linkedReferenceSheet?: {
        resourceId: string;
        LinkedSheet: ComponentType<SmallInfoCardLinkedSheetOuterProps>;
    };
};

const containerStyles: Record<SmallInfoCardVariant, string> = {
    default: "bg-muted/30",
    success: "border border-status-sold/30 bg-status-sold/5",
    destructive: "border border-destructive/30 bg-destructive/5",
    warning: "border border-status-reserved/30 bg-status-reserved/5",
    info: "border border-status-available/30 bg-status-available/5",
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

export default function SmallInfoCard({
    show = true,
    variant = "default",
    title,
    Icon,
    value,
    tooltip,
    dontRenderValue = false,
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

    const [linkedSheetOpen, setLinkedSheetOpen] = useState(false);

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
            <TooltipDisplayer tooltip={tooltip}>
                <div
                    className={cn(
                        "flex items-center gap-1 p-1 rounded-lg h-fit",
                        containerStyles[variant],
                    )}
                >
                    {Icon != null && (
                        <div
                            className={cn(
                                "shrink-0 p-2 rounded-md",
                                iconWrapStyles[variant],
                            )}
                        >
                            <Icon
                                className={cn(
                                    "h-4 w-4",
                                    accentTextStyles[variant],
                                )}
                            />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-muted-foreground">
                            {title}
                        </div>
                        {!dontRenderValue && (
                            <div
                                className={cn(
                                    "text-sm font-semibold",
                                    value ? valueTextStyles[variant] : undefined,
                                )}
                            >
                                <HiddenElement>
                                    {
                                        !!show &&
                                        <>
                                            {checkValue(value) ? value : <div className="mt-0.5"><ValueNotSet /></div>}
                                        </>
                                    }
                                </HiddenElement>
                            </div>
                        )}
                    </div>
                    {showLinkedBadge && LinkedSheet != null && (
                        <TooltipDisplayer tooltip={title}>
                            <div
                                className={cn(
                                    "shrink-0 p-1 flex items-center justify-center rounded-md border border-border",
                                    "bg-background text-xs font-semibold text-muted-foreground",
                                    "hover:bg-muted hover:text-foreground hover:cursor-pointer",
                                )}
                                aria-label={title}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLinkedSheetOpen(true);
                                }}
                            >
                                <IconLink size={14} />
                            </div>
                        </TooltipDisplayer>
                    )}
                </div>
            </TooltipDisplayer>
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
