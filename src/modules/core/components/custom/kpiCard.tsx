import {IconChevronRight} from "@tabler/icons-react";
import {useId, type ComponentType} from "react";
import {Link} from "react-router-dom";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {TooltipDisplayer} from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {
    Card,
    CardAction,
    CardContent,
    CardHeader,
    CardTitle,
} from "@coreModule/components/ui/card.tsx";

/** Lucide, Tabler, or any icon that accepts `size` — matches entity card rows. */
export type KpiIcon = ComponentType<{size?: number | string; className?: string}>;

export type KpiCardProps = {
    title: string;
    value: string | number;
    /**
     * The exact figure when `value` is a shortened one ("€ 1,842,361.76" for "€ 1.8M"). Hovering or focusing the
     * card shows it, and screen readers read it instead of the short form.
     */
    fullValue?: string;
    subtitle?: string;
    icon: KpiIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    variant?: "default" | "primary" | "success" | "warning" | "danger";
    compact?: boolean;
    /** When set, the card navigates to the underlying list/detail. */
    href?: string;
    /** Accessible label for the drill-down control (e.g. "View entries"). */
    linkLabel?: string;
};

/** @deprecated Use `KpiCardProps`. */
export type KPICardProps = KpiCardProps;

/**
 * Overrides `Card`'s neutral `ring-foreground/10` with the variant accent. The tint is mixed into `--card`, not laid
 * over nothing: a plain `bg-primary/5` replaced `bg-card` and left the card see-through, so on a gray dashboard panel
 * (or the dark page) a tinted card took the colour of what was behind it while its plain neighbours stayed solid.
 */
const variantStyles: Record<NonNullable<KpiCardProps["variant"]>, string> = {
    default: "",
    primary: "ring-primary/30 bg-[color-mix(in_oklab,var(--color-primary)_5%,var(--color-card))]",
    success: "ring-success/30 bg-[color-mix(in_oklab,var(--color-success)_5%,var(--color-card))]",
    warning: "ring-warning/30 bg-[color-mix(in_oklab,var(--color-warning)_5%,var(--color-card))]",
    danger: "ring-destructive/30 bg-[color-mix(in_oklab,var(--color-destructive)_5%,var(--color-card))]",
};

/**
 * A compact tile keeps the plain card surface and shows its variant on the icon alone. Tiles sit many to a row, and a
 * pastel fill plus a coloured ring on each read as decoration, not as information.
 */
const compactIconStyles: Record<NonNullable<KpiCardProps["variant"]>, string> = {
    default: "text-muted-foreground",
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
};

const iconVariantStyles: Record<NonNullable<KpiCardProps["variant"]>, string> = {
    default: "bg-accent text-foreground",
    primary: "bg-primary/20 text-primary",
    success: "bg-success/20 text-success",
    warning: "bg-warning/20 text-warning",
    danger: "bg-destructive/20 text-destructive",
};

function TrendBadge({trend}: {trend: NonNullable<KpiCardProps["trend"]>}) {
    return (
        <Badge
            variant={trend.isPositive ? "secondary" : "destructive"}
            className={cn("shrink-0", trend.isPositive && "bg-success/10 text-success")}
        >
            {trend.isPositive ? "+" : ""}
            {trend.value}%
        </Badge>
    );
}

/**
 * Chevron only in the compact card: the label that used to sit beside it was
 * competing with the KPI title for the same line, and the title lost — every
 * compact card on the overview read `Activ…` or `Cos…`. The label survives as
 * the overlay link's accessible name, so nothing is lost to assistive tech.
 */
function DrillDownIndicator({
    linkLabel,
    showLabel = true,
}: {
    linkLabel?: string;
    showLabel?: boolean;
}) {
    return (
        <span
            className="inline-flex shrink-0 items-center gap-0.5 text-3xs font-medium text-muted-foreground"
            aria-hidden
        >
            {showLabel && linkLabel ? (
                <span className="hidden max-w-[5rem] truncate sm:inline">{linkLabel}</span>
            ) : null}
            <IconChevronRight size={14} className="shrink-0" />
        </span>
    );
}

/**
 * Stretched overlay instead of wrapping the card in an anchor: keeps `Card` as the
 * layout root (so the `data-size` group selectors still drive header/content padding)
 * while still giving one focusable, keyboard-reachable link per card.
 */
function DrillDownOverlayLink({
    href,
    title,
    linkLabel,
}: {
    href: string;
    title: string;
    linkLabel?: string;
}) {
    return (
        <Link
            to={href}
            className="absolute inset-0 z-10 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <span className="sr-only">{linkLabel ? `${linkLabel}: ${title}` : title}</span>
        </Link>
    );
}

/** The shown figure, with the exact one in its place for screen readers so the card is not read in two forms. */
function Figure({value, exact}: {value: string | number; exact?: string}) {
    if (exact == null) return <>{value}</>;
    return (
        <>
            <span aria-hidden>{value}</span>
            <span className="sr-only">{exact}</span>
        </>
    );
}

export function KpiCard({
    title,
    value,
    fullValue,
    subtitle,
    icon: Icon,
    trend,
    variant = "default",
    compact = false,
    href,
    linkLabel,
}: KpiCardProps) {
    const titleId = useId();
    const drillHref = href != null && href !== "" ? href : undefined;
    const interactive = drillHref != null;
    const exact = fullValue != null && fullValue !== "" && fullValue !== String(value) ? fullValue : undefined;
    const shellClass = cn(
        "relative overflow-visible",
        interactive && "cursor-pointer transition-shadow hover:ring-2 hover:ring-primary/30",
    );

    // The whole card is the hover target: the drill-down link covers it, so the figure itself never gets the pointer.
    const card = compact ? (
        <Card size="sm" role="region" aria-labelledby={titleId} className={cn(shellClass, "gap-1 py-2.5")}>
            {drillHref != null ? (
                <DrillDownOverlayLink href={drillHref} title={title} linkLabel={linkLabel} />
            ) : null}
            {/*
              Label above value rather than beside it. The previous single row put
              icon, title, value, trend and chevron in one flex line with the title
              as the only shrinkable element, so at five columns the title was the
              first thing to truncate — the card kept the number and threw away
              what the number meant.
            */}
            <CardHeader className="flex items-start gap-1.5">
                <span className={cn("mt-px shrink-0", compactIconStyles[variant])} aria-hidden>
                    <Icon size={14} />
                </span>
                <CardTitle
                    id={titleId}
                    className="min-w-0 flex-1 text-balance text-xs font-medium leading-tight text-muted-foreground"
                >
                    {title}
                </CardTitle>
                {interactive ? (
                    <CardAction className="self-start">
                        <DrillDownIndicator linkLabel={linkLabel} showLabel={false} />
                    </CardAction>
                ) : null}
            </CardHeader>
            {/*
              `mt-auto` anchors the figure to the bottom: when a row stretches its tiles, or one title wraps to two
              lines, the values of a row still line up.
            */}
            <CardContent className="mt-auto flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                <span className="font-display text-lg font-semibold leading-tight tracking-tight tabular-nums text-foreground">
                    <Figure value={value} exact={exact} />
                </span>
                {trend != null ? <TrendBadge trend={trend} /> : null}
                {subtitle ? (
                    <p className="basis-full text-2xs leading-tight text-muted-foreground">{subtitle}</p>
                ) : null}
            </CardContent>
        </Card>
    ) : (
        <Card role="region" aria-labelledby={titleId} className={cn(shellClass, variantStyles[variant], "py-6")}>
            {drillHref != null ? (
                <DrillDownOverlayLink href={drillHref} title={title} linkLabel={linkLabel} />
            ) : null}
            <CardHeader className="px-6">
                <div className={cn("w-fit rounded-xl p-3", iconVariantStyles[variant])} aria-hidden>
                    <Icon size={24} />
                </div>
                {trend != null || interactive ? (
                    <CardAction className="flex items-center gap-2">
                        {trend != null ? <TrendBadge trend={trend} /> : null}
                        {interactive ? <DrillDownIndicator linkLabel={linkLabel} /> : null}
                    </CardAction>
                ) : null}
            </CardHeader>
            <CardContent className="px-6">
                <CardTitle id={titleId} className="text-sm font-medium leading-tight text-muted-foreground">
                    {title}
                </CardTitle>
                <p className="font-display text-3xl font-bold leading-tight tabular-nums text-foreground">
                    <Figure value={value} exact={exact} />
                </p>
                {subtitle ? <p className="mt-1 text-sm leading-tight text-muted-foreground">{subtitle}</p> : null}
            </CardContent>
        </Card>
    );

    return exact != null ? <TooltipDisplayer tooltip={exact}>{card}</TooltipDisplayer> : card;
}
