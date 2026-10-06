/**
 * The shared chrome every server-driven table cell is built from.
 *
 * Split out of `columnConfigToColumnDef` so the mapper stays a registry of cell
 * types: the pieces here decide how a value looks (empty, truncated, collapsed
 * behind a counter), the mapper only decides which value goes in.
 */

import {Fragment, useLayoutEffect, useRef, useState, type ReactNode} from "react";
import {Link} from "react-router-dom";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Popover, PopoverContent, PopoverTrigger} from "@coreModule/components/ui/popover.tsx";
import TruncatedValue from "@coreModule/components/viewEngine/widgets/display/truncatedValue.tsx";
import {formatDate} from "@coreModule/helpers/general/dateTime.ts";
import {cn} from "@coreModule/components/lib/utils.ts";

/**
 * Caps a long pill so a neighbour (or the "+N" counter) can still sit beside it.
 * `100%` wins in a narrower leftover slot; `8rem` wins in a wide column.
 */
const BADGE_MAX_WIDTH = "max-w-[min(100%,8rem)]";

/** Same 1px slack as `TruncatedValue` — subpixel rounding is not overflow. */
const FIT_SLACK_PX = 1;

/** Distinguishes "the server sent nothing" from "the cell failed to render". */
export function EmptyCell() {
    return <span className="text-muted-foreground/50 select-none">—</span>;
}

export type InlineItem = {key: string; node: ReactNode};

/**
 * How many of `itemCount` entries actually fit in `containerWidth`, never more than
 * `max`. Width-folded entries join the ones `max` already hid, so the counter
 * becomes "+2" rather than clipping a trailing "+1".
 *
 * `containerWidth <= 0` is jsdom / not-yet-laid-out: keep `max`, same as before.
 */
export function visibleInlineCount({
    itemCount,
    itemWidths,
    max,
    containerWidth,
    gap,
    overflowWidthFor,
}: {
    itemCount: number;
    itemWidths: number[];
    max: number;
    containerWidth: number;
    gap: number;
    overflowWidthFor: (hiddenCount: number) => number;
}): number {
    const cap = Math.min(max, itemCount);
    if (containerWidth <= 0) return cap;
    for (let n = cap; n >= 0; n--) {
        const hidden = itemCount - n;
        let width = 0;
        for (let i = 0; i < n; i++) {
            if (i > 0) width += gap;
            width += itemWidths[i] ?? 0;
        }
        if (hidden > 0) {
            if (n > 0) width += gap;
            width += overflowWidthFor(hidden);
        }
        if (width <= containerWidth + FIT_SLACK_PX) return n;
    }
    return 0;
}

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

type FitState = {signature: string; count: number};

function inlineSignature(items: InlineItem[], max: number): string {
    return `${max}\0${items.length}\0${items.map((item) => item.key).join("\0")}`;
}

/**
 * Renders the first `max` entries inline and collapses the rest behind one
 * "+N more" popover — then, if that row is still wider than the cell, folds
 * trailing pills into the same counter so the "+N" itself is never clipped.
 */
export function InlineItems({items, max, moreLabel}: {items: InlineItem[]; max: number; moreLabel: string}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const probeRef = useRef<HTMLButtonElement>(null);
    const widthsRef = useRef<number[]>([]);
    const signature = inlineSignature(items, max);
    const [fit, setFit] = useState<FitState>({signature, count: Math.min(max, items.length)});
    if (fit.signature !== signature) {
        widthsRef.current = [];
        setFit({signature, count: Math.min(max, items.length)});
    }
    const visibleCount = fit.signature === signature ? fit.count : Math.min(max, items.length);

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const gap = Number.parseFloat(getComputedStyle(container).columnGap);
        const gapPx = Number.isFinite(gap) ? gap : 4;

        const apply = () => {
            const available = container.clientWidth;
            if (available <= 0) return;

            const itemEls = [...container.querySelectorAll<HTMLElement>(":scope > [data-inline-item]")];
            itemEls.forEach((el, i) => {
                if (!el.hidden) widthsRef.current[i] = el.offsetWidth;
            });

            const count = visibleInlineCount({
                itemCount: items.length,
                itemWidths: widthsRef.current,
                max,
                containerWidth: available,
                gap: gapPx,
                overflowWidthFor: (hiddenCount) => {
                    const probe = probeRef.current;
                    if (!probe || hiddenCount <= 0) return 0;
                    probe.textContent = `+${hiddenCount} ${moreLabel}`;
                    return probe.offsetWidth;
                },
            });
            setFit((prev) =>
                prev.signature === signature && prev.count === count ? prev : {signature, count},
            );
        };

        apply();
        const ro = new ResizeObserver(apply);
        ro.observe(container);
        return () => ro.disconnect();
    }, [signature, max, moreLabel, items.length]);

    if (items.length === 0) return <EmptyCell />;

    const visible = items.slice(0, visibleCount);
    const overflow = items.slice(visibleCount);

    return (
        <div className="relative w-0 min-w-full max-w-full">
            <div ref={containerRef} className="flex min-w-0 w-full items-center gap-1 overflow-hidden">
                {visible.map((item, i) => (
                    <span
                        key={item.key}
                        data-inline-item=""
                        className={cn(
                            "inline-flex min-w-0 max-w-full",
                            i === visible.length - 1 ? "shrink" : "shrink-0",
                        )}
                    >
                        {item.node}
                    </span>
                ))}
                {overflow.length > 0 && (
                    <span data-inline-overflow="" className="shrink-0">
                        <Popover>
                            <PopoverBadgeTrigger>
                                +{overflow.length} {moreLabel}
                            </PopoverBadgeTrigger>
                            <PopoverContent align="start" className="w-auto min-w-40 max-w-sm">
                                <div className="flex max-h-72 flex-col items-start gap-1.5 overflow-y-auto overflow-x-hidden">
                                    {overflow.map((item) => (
                                        <Fragment key={item.key}>{item.node}</Fragment>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </span>
                )}
            </div>
            <span className="pointer-events-none invisible absolute left-0 top-0" aria-hidden>
                <Badge asChild variant="secondary" className="font-normal">
                    <button ref={probeRef} type="button" tabIndex={-1} />
                </Badge>
            </span>
        </div>
    );
}

/**
 * A truncating badge. The label is `TruncatedValue`, so the full text appears in a
 * hover tooltip only once the pill actually clips it.
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
            <TruncatedValue as="span" text={label} className="min-w-0 max-w-full">
                {label}
            </TruncatedValue>
        </>
    );
    if (!href) {
        return (
            <Badge variant={variant} className={cn(BADGE_MAX_WIDTH, "min-w-0 font-normal", className)}>
                {content}
            </Badge>
        );
    }
    return (
        <Badge asChild variant={variant} className={cn(BADGE_MAX_WIDTH, "min-w-0 cursor-pointer font-normal", className)}>
            <Link to={href} onClick={(e) => e.stopPropagation()}>
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
        timeZone: withTime ? timeZone : "UTC",
        format: withTime ? {dateStyle: "medium", timeStyle: "short"} : {dateStyle: "medium"},
    });
    const full = formatDate(date, {
        timeZone: withTime ? timeZone : "UTC",
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
        return <TruncatedValue preview="popover" className="max-w-48">{value}</TruncatedValue>;
    }
    const external = href.startsWith("http");
    return (
        <TruncatedValue preview="popover" className="max-w-48">
            <a
                href={href}
                className="text-primary hover:underline"
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                onClick={(e) => e.stopPropagation()}
            >
                {value}
            </a>
        </TruncatedValue>
    );
}
