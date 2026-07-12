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
}: SheetGroupProps) {
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
                <div className="shrink-0 rounded-md bg-background p-1">{titleIcon}</div>
            ) : null}
            <p className="text-base font-semibold uppercase tracking-wide text-muted-foreground transition-colors group-hover/sheet-group:text-foreground">
                {label}
            </p>
        </>
    );

    const headerRow = (opts?: {collapsible?: boolean}) => (
        <div
            className={cn(
                "flex w-full min-w-0 items-center gap-2",
                "transition-colors",
                open ? "border-b border-transparent pb-0" : "border-b border-border/70 pb-2",
                opts?.collapsible && !open && "group/sheet-group hover:border-foreground/25",
            )}
        >
            {opts?.collapsible ? (
                <>
                    <CollapsibleTrigger asChild>
                        <button
                            type="button"
                            className={cn(
                                "group/sheet-group-header flex min-w-0 flex-1 items-center gap-2",
                                "bg-transparent p-0 text-left",
                                "hover:cursor-pointer focus-visible:outline-none",
                            )}
                        >
                            {headerLeading}
                        </button>
                    </CollapsibleTrigger>
                    {titleActions != null ? (
                        <div className="flex shrink-0 items-center">{titleActions}</div>
                    ) : null}
                    <CollapsibleTrigger asChild>
                        <button
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
                        </button>
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
            <div className="space-y-2">
                {label ? headerRow() : null}
                {children}
            </div>
        );
    }

    return (
        <Collapsible open={open} onOpenChange={onOpenChange} className="space-y-2">
            {headerRow({collapsible: true})}
            <CollapsibleContent className="space-y-2 data-[state=closed]:animate-none">
                {children}
            </CollapsibleContent>
        </Collapsible>
    );
}
