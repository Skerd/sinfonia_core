import type {ComponentType, MouseEvent, ReactNode} from "react";
import {isValidElement, Suspense, useState} from "react";
import {Link} from "react-router-dom";
import {cn} from "@coreModule/components/lib/utils.ts";
import {
    Item,
    ItemActions,
    ItemContent,
    ItemMedia,
    ItemTitle,
} from "@coreModule/components/ui/item.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {IconInfoCircle, IconLink} from "@tabler/icons-react";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useDismissSheetBeforeMenuNavigate} from "@coreModule/components/viewEngine/sheetMenuNavigateDismiss.tsx";
import SheetMediaAvatar from "@coreModule/components/viewEngine/sheetMediaAvatar.tsx";
import CountryFlag from "@coreModule/components/custom/countryFlag.tsx";
import {Dialog, DialogContent, DialogTitle} from "@coreModule/components/ui/dialog.tsx";
import DisplayValue, {type DisplayValueType} from "./displayValue.tsx";
import ExpandableText from "@coreModule/components/custom/expandableText.tsx";
import TruncatedValue from "@coreModule/components/custom/displayValue/truncatedValue.tsx";

function plainTextFromNode(node: ReactNode): string {
    if (node == null || typeof node === "boolean") return "";
    if (typeof node === "string" || typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(plainTextFromNode).join("");
    if (isValidElement(node) && node.props != null && typeof node.props === "object" && "children" in node.props) {
        return plainTextFromNode((node.props as {children?: ReactNode}).children as ReactNode);
    }
    return "";
}

/** Open/close wiring from `#DisplayCard`; renderer may bind extra props (e.g. `fetchId`). */
export type DisplayCardLinkedSheetOuterProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Called after linked entity delete succeeds; DisplayCard closes the nested sheet. */
    onLinkedDeleted?: () => void;
};

type DisplayCardVariant = "default" | "success" | "destructive" | "warning" | "info";

export type DisplayCardIcon = ComponentType<{className?: string}>;

type DisplayCardProps = {
    show?: boolean;
    /**
     * The account may not read this field. The card still renders — label, icon and all — with
     * a lock where the value would be, so the field reads as withheld rather than absent.
     */
    locked?: boolean;
    path?: string;
    type?: DisplayValueType;
    languageKeyCategory?: string;
    format?: Intl.DateTimeFormatOptions;
    size?: number;
    children?: (formatted: ReactNode) => ReactNode;
    variant?: DisplayCardVariant;
    title: string;
    Icon?: DisplayCardIcon;
    /**
     * Renders the referenced entity's photo in the icon slot instead of {@link Icon} — a user
     * card reads better with the face on it than with a generic person glyph. `name` seeds the
     * `alt` text and the two-letter fallback for a user with no photo.
     */
    avatar?: {mediaId: string; name: string};
    /** ISO country code shown as a flag in the icon slot. Ignored when {@link avatar} is set. */
    flagCode?: string;
    value: unknown;
    tooltip: string;
    dontRenderValue?: boolean;
    externalHref?: string;
    internalHref?: string;
    linkedReferenceSheet?: {
        resourceId: string;
        LinkedSheet: ComponentType<DisplayCardLinkedSheetOuterProps>;
    };
    /** When true, long values show read more / read less inside the card. */
    expandable?: boolean;
    maxLength?: number;
};

const containerStyles: Record<DisplayCardVariant, string> = {
    default: "border-transparent bg-muted/30",
    success: "border-success/30 bg-success/5",
    destructive: "border-destructive/30 bg-destructive/5",
    warning: "border-warning/30 bg-warning/5",
    info: "border-info/30 bg-info/5",
};

const iconWrapStyles: Record<DisplayCardVariant, string> = {
    default: "bg-background",
    success: "bg-success/15",
    destructive: "bg-destructive/10",
    warning: "bg-warning/15",
    info: "bg-info/15",
};

const accentTextStyles: Record<DisplayCardVariant, string> = {
    default: "text-muted-foreground",
    success: "text-success",
    destructive: "text-destructive",
    warning: "text-warning",
    info: "text-info",
};

const valueTextStyles: Record<DisplayCardVariant, string> = {
    default: "text-foreground",
    success: "text-success",
    destructive: "text-destructive",
    warning: "text-warning",
    info: "text-info",
};

function resourceHasPositiveRead(read: unknown): boolean {
    return (
        read === true ||
        (!!read && typeof read === "object" && Object.keys(read as object).length > 0)
    );
}

function DisplayCardNestedSheets({
    LinkedSheet,
    linkedOpen,
    onClose,
    onLinkedDeleted,
}: {
    LinkedSheet: ComponentType<DisplayCardLinkedSheetOuterProps>;
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
    if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^https?:/i.test(trimmed)) {
        return null;
    }
    return `https://${trimmed}`;
}

/**
 * Sheet tile. Value slot is `DisplayValue` (blur when denied, `ValueNotSet` when empty).
 */
export default function DisplayCard({
    show,
    locked = false,
    path,
    type,
    languageKeyCategory,
    format,
    size,
    children,
    variant = "default",
    title,
    Icon,
    avatar,
    flagCode,
    value,
    tooltip,
    dontRenderValue = false,
    externalHref,
    internalHref,
    linkedReferenceSheet,
    expandable = false,
    maxLength,
}: DisplayCardProps) {
    const accessResourceId = linkedReferenceSheet?.resourceId ?? "";
    const LinkedSheet = linkedReferenceSheet?.LinkedSheet;
    const linkedAccess = useAccess(accessResourceId);
    const dismissSheetBeforeNavigate = useDismissSheetBeforeMenuNavigate();
    const showLinkedBadge =
        linkedReferenceSheet != null &&
        LinkedSheet != null &&
        accessResourceId.length > 0 &&
        resourceHasPositiveRead(linkedAccess.read);

    const resolvedExternalHref =
        typeof externalHref === "string" ? normalizeExternalHref(externalHref) : null;
    const showExternalBadge = resolvedExternalHref != null;
    const resolvedInternalHref =
        typeof internalHref === "string" && internalHref.trim().startsWith("/")
            ? internalHref.trim()
            : null;
    const showInternalBadge = resolvedInternalHref != null;

    const onInternalNavigate = (e: MouseEvent) => {
        e.stopPropagation();
        dismissSheetBeforeNavigate();
    };

    const [linkedSheetOpen, setLinkedSheetOpen] = useState(false);
    const [avatarOpen, setAvatarOpen] = useState(false);
    const tooltipText = tooltip != null ? String(tooltip).trim() : "";
    const hasTooltip = tooltipText.length > 0;

    return (
        <>
            <Item
                variant="outline"
                className={cn("h-fit items-start gap-2 p-2", containerStyles[variant])}
            >
                {avatar != null ? (
                    <ItemMedia className="self-start">
                        <button
                            type="button"
                            aria-label={`View photo of ${avatar.name}`}
                            className="cursor-pointer rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() => setAvatarOpen(true)}
                        >
                            <SheetMediaAvatar
                                mediaId={avatar.mediaId}
                                name={avatar.name}
                                /* Sized to the icon well it replaces, not to a profile header. */
                                className="size-10 border-0 shadow-none"
                            />
                        </button>
                    </ItemMedia>
                ) : flagCode ? (
                    /* The same 40px square an icon's well occupies (20px glyph + p-2.5), but
                       filled edge to edge. `object-cover` crops the flag's sides rather than
                       stretching it out of its 4:3. */
                    <ItemMedia
                        className={cn(
                            "size-10 shrink-0 self-start overflow-hidden rounded-md",
                            iconWrapStyles[variant],
                        )}
                    >
                        <CountryFlag
                            code={flagCode}
                            width={40}
                            height={40}
                            className="h-full w-full rounded-none object-cover"
                        />
                    </ItemMedia>
                ) : (
                    Icon != null && (
                        <ItemMedia
                            className={cn(
                                "self-start p-2.5 rounded-md",
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
                    )
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
                    {!dontRenderValue && locked ? (
                        <HiddenElement showLock />
                    ) : !dontRenderValue && (
                        type === "media" || isValidElement(value) ? (
                            <DisplayValue
                                value={value}
                                path={path}
                                type={type}
                                languageKeyCategory={languageKeyCategory}
                                format={format}
                                size={size}
                                show={show}
                            />
                        ) : expandable ? (
                            <div
                                className={cn(
                                    "text-sm font-normal",
                                    value != null && value !== "" ? valueTextStyles[variant] : undefined,
                                )}
                            >
                                <DisplayValue
                                    value={value}
                                    path={path}
                                    type={type}
                                    languageKeyCategory={languageKeyCategory}
                                    format={format}
                                    size={size}
                                    show={show}
                                >
                                    {(formatted) => (
                                        <ExpandableText maxLength={maxLength} className="font-normal">
                                            {formatted}
                                        </ExpandableText>
                                    )}
                                </DisplayValue>
                            </div>
                        ) : (
                            <DisplayValue
                                value={value}
                                path={path}
                                type={type}
                                languageKeyCategory={languageKeyCategory}
                                format={format}
                                size={size}
                                show={show}
                            >
                                {(formatted) => (
                                    <TruncatedValue
                                        text={plainTextFromNode(children ? children(formatted) : formatted)}
                                        className={cn(
                                            "text-base font-semibold",
                                            value != null && value !== "" ? valueTextStyles[variant] : undefined,
                                        )}
                                    >
                                        {children ? children(formatted) : formatted}
                                    </TruncatedValue>
                                )}
                            </DisplayValue>
                        )
                    )}
                </ItemContent>
                {(showExternalBadge || showInternalBadge || (showLinkedBadge && LinkedSheet != null)) && (
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
                        {showInternalBadge && resolvedInternalHref != null ? (
                            <TooltipDisplayer tooltip={title}>
                                <Link
                                    to={resolvedInternalHref}
                                    className={cn(
                                        "shrink-0 p-1.5 flex items-center justify-center rounded-md border border-border",
                                        "bg-background text-sm font-semibold text-muted-foreground",
                                        "hover:bg-muted hover:text-foreground hover:cursor-pointer",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    )}
                                    aria-label={title}
                                    onClick={onInternalNavigate}
                                >
                                    <IconLink size={16} />
                                </Link>
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
                <DisplayCardNestedSheets
                    LinkedSheet={LinkedSheet}
                    linkedOpen={linkedSheetOpen}
                    onClose={() => { setLinkedSheetOpen(false); }}
                    onLinkedDeleted={() => {
                        setLinkedSheetOpen(false);
                    }}
                />
            )}
            {avatar != null && (
                /* `DialogContent` brings its own close button; the title is for screen
                   readers only, since the photo is the whole dialog. */
                <Dialog open={avatarOpen} onOpenChange={setAvatarOpen}>
                    <DialogContent className="p-2 sm:max-w-lg">
                        <DialogTitle className="sr-only">{avatar.name}</DialogTitle>
                        <img
                            src={`/api/auxiliary/media/${avatar.mediaId}`}
                            alt={avatar.name}
                            className="max-h-[80vh] w-full rounded-lg object-contain"
                        />
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
