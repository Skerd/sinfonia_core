import {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {ReactNode} from "react";
import {useEffect, useState} from "react";
import {IconChevronDown} from "@tabler/icons-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@coreModule/components/ui/collapsible.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import type {EnumTone} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type.ts";

type SheetGroupProps = {
    title?: string;
    /** Optional icon element (Tabler `#…` token is resolved to an element in `ViewRenderer` for `#SheetGroup`). */
    titleIcon?: ReactNode;
    /** Optional trailing controls in the title row (e.g. `#ReferencesViewModeToggle` resolved in `ViewRenderer`). */
    titleActions?: ReactNode;
    resolveLanguageKey?: ResolveLanguageKey;
    children?: ReactNode;
    /**
     * Stable localStorage id for open/closed persistence (set by ViewRenderer from the
     * raw title key + sheet model, or override via view config `collapseKey`).
     */
    collapseStorageKey?: string;
    /** Initial open state when nothing is stored. Default true. */
    defaultOpen?: boolean;
    /** When false, renders a static header (no collapse). Default true when a title is present. */
    collapsible?: boolean;
    /** Root class (e.g. nested card chrome under a parent `#SheetGroup`). */
    className?: string;
    /** Merged onto the title. Use to drop section-header casing for nested groups. */
    titleClassName?: string;
    /**
     * Marks a section that is about managing the record rather than its own data (lifecycle, a request's approval):
     * a coloured left rule, a light tint and the title and icon in that tone, so it never reads as a model field.
     */
    accent?: EnumTone;
};

/** Theme tokens only, so Tailwind generates them from this file whatever view config asks for them. */
const ACCENTS: Record<EnumTone, {box: string; title: string}> = {
    success: {box: "border-l-success bg-success/5", title: "text-success"},
    warning: {box: "border-l-warning bg-warning/5", title: "text-warning"},
    danger: {box: "border-l-destructive bg-destructive/5", title: "text-destructive"},
    info: {box: "border-l-info bg-info/5", title: "text-info"},
    neutral: {box: "border-l-muted-foreground/40 bg-muted/30", title: "text-muted-foreground"},
};

const STORAGE_PREFIX = "sheetGroupCollapse:";

function storageKeyFor(id: string): string {
    return `${STORAGE_PREFIX}${id}`;
}

function readStoredOpen(id: string | undefined, fallback: boolean): boolean {
    if (!id || typeof window === "undefined") {
        return fallback;
    }
    try {
        const v = localStorage.getItem(storageKeyFor(id));
        if (v === "1" || v === "true") return true;
        if (v === "0" || v === "false") return false;
    } catch {
        /* ignore quota / private mode */
    }
    return fallback;
}

function writeStoredOpen(id: string | undefined, open: boolean): void {
    if (!id) return;
    try {
        localStorage.setItem(storageKeyFor(id), open ? "1" : "0");
    } catch {
        /* ignore */
    }
}

export function SheetGroup({
    title,
    titleIcon,
    titleActions,
    resolveLanguageKey,
    children,
    collapseStorageKey,
    defaultOpen = true,
    collapsible = true,
    className,
    titleClassName,
    accent,
}: SheetGroupProps) {
    const tone = accent ? ACCENTS[accent] : undefined;
    const rootClassName = cn("flex flex-col gap-y-2", tone && cn("rounded-md border-l-4 py-2 pl-3 pr-2", tone.box), className);
    const label = resolveLanguageKey && title ? String(resolveLanguageKey(title)) : title;
    const canCollapse = collapsible && !!label;

    const [open, setOpen] = useState(() => readStoredOpen(collapseStorageKey, defaultOpen));

    useEffect(() => {
        setOpen(readStoredOpen(collapseStorageKey, defaultOpen));
    }, [collapseStorageKey, defaultOpen]);

    const onOpenChange = (next: boolean) => {
        setOpen(next);
        writeStoredOpen(collapseStorageKey, next);
    };

    const headerLeading = (
        <>
            {titleIcon != null ? (
                <div className={cn("shrink-0 rounded-md bg-background p-1", tone?.title)}>{titleIcon}</div>
            ) : null}
            <p
                className={cn(
                    "text-base font-semibold uppercase tracking-wide text-muted-foreground transition-colors group-hover/sheet-group:text-foreground",
                    tone?.title,
                    titleClassName,
                )}
            >
                {label}
            </p>
        </>
    );

    const headerRow = (opts?: {collapsible?: boolean}) => (
        <div
            className={cn(
                "flex w-full min-w-0 items-center gap-2",
                "transition-colors",
                !canCollapse || open ? "border-b border-transparent pb-0" : "border-b border-border/70 pb-2",
                opts?.collapsible && !open && "group/sheet-group hover:border-foreground/25",
            )}
        >
            {opts?.collapsible ? (
                <>
                    <CollapsibleTrigger asChild>
                        <Button variant="bare"
                            type="button"
                            className={cn(
                                "group/sheet-group-header flex min-w-0 flex-1 items-center gap-2",
                                "bg-transparent p-0 text-left",
                                "hover:cursor-pointer focus-visible:outline-none",
                            )}
                        >
                            {headerLeading}
                        </Button>
                    </CollapsibleTrigger>
                    {titleActions != null ? (
                        <div className="flex shrink-0 items-center">{titleActions}</div>
                    ) : null}
                    <CollapsibleTrigger asChild>
                        <Button variant="bare"
                            type="button"
                            className={cn(
                                "group/sheet-group-chevron shrink-0 bg-transparent p-0",
                                "hover:cursor-pointer focus-visible:outline-none",
                            )}
                            aria-label={label}
                        >
                            <IconChevronDown
                                className={cn(
                                    "size-3.5 text-muted-foreground/60 transition-transform duration-200",
                                    "group-hover/sheet-group:text-muted-foreground",
                                    open && "rotate-180",
                                )}
                                aria-hidden
                            />
                        </Button>
                    </CollapsibleTrigger>
                </>
            ) : (
                <>
                    <div className="flex min-w-0 flex-1 items-center gap-2">{headerLeading}</div>
                    {titleActions != null ? (
                        <div className="flex shrink-0 items-center">{titleActions}</div>
                    ) : null}
                </>
            )}
        </div>
    );

    if (!canCollapse) {
        return (
            <div className={rootClassName}>
                {label ? headerRow() : null}
                {children}
            </div>
        );
    }

    return (
        <Collapsible open={open} onOpenChange={onOpenChange} className={rootClassName}>
            {headerRow({collapsible: true})}
            <CollapsibleContent className="flex flex-col gap-y-2">
                {children}
            </CollapsibleContent>
        </Collapsible>
    );
}
