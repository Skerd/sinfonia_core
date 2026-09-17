/**
 * The shared chrome every server-driven table cell is built from.
 *
 * Split out of `columnConfigToColumnDef` so the mapper stays a registry of cell
 * types: the pieces here decide how a value looks (empty, truncated, collapsed
 * behind a counter), the mapper only decides which value goes in.
 */

import {Fragment, type ReactNode} from "react";
import {Link} from "react-router-dom";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Popover, PopoverContent, PopoverTrigger} from "@coreModule/components/ui/popover.tsx";
import {LongText} from "@coreModule/components/custom/longText.tsx";
import {formatDate} from "@baseModule/helpers/general/dateTime.ts";
import {cn} from "@coreModule/components/lib/utils.ts";

/** Keeps a long badge from stretching the column past the rest of the table. */
const BADGE_MAX_WIDTH = "max-w-[16rem]";

/** Distinguishes "the server sent nothing" from "the cell failed to render". */
export function EmptyCell() {
    return <span className="text-muted-foreground/50 select-none">—</span>;
}

export type InlineItem = {key: string; node: ReactNode};

/**
 * Badge-style triggers must be real buttons: `Badge` renders a `<span>`, and a span
 * inside `PopoverTrigger asChild` is unreachable by keyboard.
 */
function PopoverBadgeTrigger({children}: {children: ReactNode}) {
    return (
        <PopoverTrigger asChild>
            <Badge
                asChild
                variant="secondary"
                className="cursor-pointer font-normal hover:bg-accent hover:text-accent-foreground"
            >
                <button type="button" onClick={(e) => e.stopPropagation()}>
                    {children}
                </button>
            </Badge>
        </PopoverTrigger>
    );
}

/**
 * Renders the first `max` entries inline and collapses the rest behind one
 * "+N more" popover — the single rule every multi-value cell type follows.
 */
export function InlineItems({items, max, moreLabel}: {items: InlineItem[]; max: number; moreLabel: string}) {
    if (items.length === 0) return <EmptyCell />;
    const visible = items.slice(0, max);
    const overflow = items.slice(max);
    return (
        <div className="flex min-w-0 items-center gap-1">
            {visible.map((item) => (
                <Fragment key={item.key}>{item.node}</Fragment>
            ))}
            {overflow.length > 0 && (
                <Popover>
                    <PopoverBadgeTrigger>
                        +{overflow.length} {moreLabel}
                    </PopoverBadgeTrigger>
                    <PopoverContent align="start" className="w-auto min-w-40 max-w-sm">
                        <div className="flex max-h-72 flex-wrap items-center gap-1.5 overflow-y-auto overflow-x-hidden">
                            {overflow.map((item) => (
                                <Fragment key={item.key}>{item.node}</Fragment>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            )}
        </div>
    );
}

/**
 * A truncating badge. `title` carries the untruncated value, which costs nothing
 * per row — a `Tooltip` would mount a provider in every cell of every page.
 *
 * With `href` the badge *is* the anchor (`asChild`) rather than sitting inside one:
 * the `outline` variant's hover rule is `[a]:hover:…`, so a badge nested in a Link
 * never lit up on hover.
 */
export function TextBadge({
    label,
    href,
    variant = "outline",
    className,
    children,
}: {
    label: string;
    href?: string | null;
    variant?: "outline" | "secondary";
    className?: string;
    children?: ReactNode;
}) {
    const content = (
        <>
            {children}
            <span className="min-w-0 truncate">{label}</span>
        </>
    );
    if (!href) {
        return (
            <Badge variant={variant} className={cn(BADGE_MAX_WIDTH, "font-normal", className)} title={label}>
                {content}
            </Badge>
        );
    }
    return (
        <Badge asChild variant={variant} className={cn(BADGE_MAX_WIDTH, "cursor-pointer font-normal", className)}>
            <Link to={href} title={label} onClick={(e) => e.stopPropagation()}>
                {content}
            </Link>
        </Badge>
    );
}

/**
 * `dateStyle: "long"` ("September 16, 2026 at 14:23:05") eats a third of a laptop
 * screen per cell. The cell shows the medium form; `title` keeps the full one.
 */
export function DateCell({date, timeZone, withTime}: {date: Date; timeZone: string; withTime: boolean}) {
    const short = formatDate(date, {
        timeZone,
        format: withTime ? {dateStyle: "medium", timeStyle: "short"} : {dateStyle: "medium"},
    });
    const full = formatDate(date, {
        timeZone,
        format: withTime ? {dateStyle: "full", timeStyle: "medium"} : {dateStyle: "full"},
    });
    return (
        <span className="whitespace-nowrap tabular-nums" title={full}>
            {short}
        </span>
    );
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const URL_PATTERN = /^https?:\/\/\S+$/i;

/** Text cells holding a mail address or a URL become links; everything else truncates with a hover peek. */
export function TextCell({value}: {value: string}) {
    const trimmed = value.trim();
    const href = EMAIL_PATTERN.test(trimmed) ? `mailto:${trimmed}` : URL_PATTERN.test(trimmed) ? trimmed : null;
    if (!href) {
        return <LongText className="max-w-48">{value}</LongText>;
    }
    const external = href.startsWith("http");
    return (
        <LongText className="max-w-48">
            <a
                href={href}
                className="text-primary hover:underline"
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                onClick={(e) => e.stopPropagation()}
            >
                {value}
            </a>
        </LongText>
    );
}
