import {compose} from "redux";
import {Fragment, type ComponentType, type ReactNode} from "react";
import {Link} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@coreModule/components/ui/breadcrumb.tsx";
import PortalKindName from "./portalKindName.tsx";
import {usePortalTitle} from "./portalTitle.ts";
import {PortalKeepButton, type PortalKeepItem} from "./portalSaved.tsx";

/*
 * The page a catalog card opens, the same frame for every kind: where the item sits, its
 * media, and beside it a column that stays in view: what it is, what it costs, how to get it.
 * Each kind fills the column with its own story from the pieces below.
 */

type DetailPageProps = WithLanguageType & {
    /** The item's catalog kind; its crumb opens that tab of the home catalog. */
    kind: string;
    /** The item's name; it also names the page in the browser tab. */
    title: string;
    /** Crumbs between the kind and the item: a product's category, a unit's development. */
    crumbs?: readonly {label: string; to: string}[];
    media?: ReactNode;
    /** The item's story under the media: description, facts — fills the left column so the page does not look finished after the photos. */
    story?: ReactNode;
    /** The column beside the media. */
    children: ReactNode;
    /** Full-width sections under the item: reviews, units, more of the kind. */
    below?: ReactNode;
    /** The item as the catalog lists it, for the card's heart beside the breadcrumb (TD-F148); none on a page no card opens. */
    keep?: PortalKeepItem;
};

function DetailPage({kind, title, crumbs = [], media, story, children, below, keep, resolveLanguageKey}: DetailPageProps) {
    usePortalTitle(title);
    return (
        // Fades in as it takes over from the page's loading placeholder.
        <div className="flex flex-col gap-16 transition-opacity duration-300 ease-out starting:opacity-0 sm:gap-20">
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-4">
                    <Breadcrumb aria-label={resolveLanguageKey("breadcrumb")}>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild><Link to="/">{resolveLanguageKey("home")}</Link></BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild><Link to={`/?${new URLSearchParams({kind})}`}><PortalKindName kind={kind} /></Link></BreadcrumbLink>
                            </BreadcrumbItem>
                            {crumbs.map((crumb) => (
                                <Fragment key={crumb.to}>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbLink asChild><Link to={crumb.to}>{crumb.label}</Link></BreadcrumbLink>
                                    </BreadcrumbItem>
                                </Fragment>
                            ))}
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage className="max-w-64 truncate">{title}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    {keep ? <PortalKeepButton item={keep} /> : null}
                </div>

                {media ? (
                    <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
                        <div className="flex min-w-0 flex-col gap-10">
                            {media}
                            {story}
                        </div>
                        <div className="flex min-w-0 flex-col gap-7 lg:sticky lg:top-28 lg:self-start">{children}</div>
                    </div>
                ) : (
                    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)] lg:gap-14">
                        <div className="flex min-w-0 flex-col gap-7">{children}</div>
                        {story ? <div className="min-w-0">{story}</div> : null}
                    </div>
                )}
            </div>
            {below}
        </div>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/shared/detailPage.tsx"))(DetailPage);

/** The column's head: a small line above the name, the name, then what follows it (price, rating, seller). */
export function DetailHeading({eyebrow, title, children}: {eyebrow?: ReactNode; title: string; children?: ReactNode}) {
    return (
        <div className="flex flex-col gap-3">
            {eyebrow ? <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">{eyebrow}</p> : null}
            <h1 className="font-display text-3xl leading-tight font-bold tracking-tight sm:text-4xl">{title}</h1>
            {children}
        </div>
    );
}

/** The headline price, with what it covers beside it ("per day", "for 3 days"). */
export function DetailPrice({amount, note}: {amount: string; note?: string}) {
    return (
        <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-display text-3xl font-semibold tabular-nums">{amount}</span>
            {note ? <span className="text-sm text-muted-foreground">{note}</span> : null}
        </p>
    );
}

const STATUS_TONES = {
    success: {text: "text-success", dot: "bg-success"},
    warning: {text: "text-warning", dot: "bg-warning"},
    destructive: {text: "text-destructive", dot: "bg-destructive"},
} as const;

/** Whether the item can be had, as a coloured dot and a line: in stock, free for the dates, sold. */
export function DetailStatus({tone, children}: {tone: keyof typeof STATUS_TONES; children: ReactNode}) {
    return (
        <p className={cn("flex items-center gap-2 text-sm font-medium", STATUS_TONES[tone].text)}>
            <span className={cn("size-2 shrink-0 rounded-full", STATUS_TONES[tone].dot)} aria-hidden />
            {children}
        </p>
    );
}

/** The few numbers that describe the item at a glance, as tiles: "5 seats", "84 m²". */
/** Any icon component that takes a class (module pages may still pass lucide icons). */
type DetailFactIcon = ComponentType<{className?: string}>;

export function DetailFacts({facts}: {facts: readonly {icon: DetailFactIcon; label: string; value: string}[]}) {
    return (
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {/* Keyed by position too: labels are translated and all read "" until the caller's dictionary loads. */}
            {facts.map(({icon: Icon, label, value}, index) => (
                <div key={`${index}-${label}`} className="flex items-center gap-3 rounded-2xl bg-muted px-4 py-3">
                    <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0">
                        <dt className="text-xs text-muted-foreground">{label}</dt>
                        <dd className="truncate font-medium tabular-nums">{value}</dd>
                    </div>
                </div>
            ))}
        </dl>
    );
}

/** A titled block of the column, set off by a rule. */
export function DetailSection({title, children}: {title: string; children: ReactNode}) {
    return (
        <section className="flex flex-col gap-3 border-t border-border pt-6">
            <h2 className="text-sm font-semibold">{title}</h2>
            {children}
        </section>
    );
}

/** Free text the business wrote, line breaks kept. */
export function DetailText({children}: {children: string}) {
    return <p className="text-[15px] leading-relaxed whitespace-pre-line text-muted-foreground">{children}</p>;
}

/** Label and value rows: "Deposit · €300". */
export function DetailSpecs({rows}: {rows: readonly {label: string; value: ReactNode}[]}) {
    return (
        <dl className="divide-y divide-border text-sm">
            {rows.map((row, index) => (
                <div key={`${index}-${row.label}`} className="flex justify-between gap-6 py-2.5">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="text-right font-medium">{row.value}</dd>
                </div>
            ))}
        </dl>
    );
}

/** A full-width block under the item, with a display heading. */
export function DetailBelow({title, id, children}: {title: string; id?: string; children: ReactNode}) {
    return (
        <section id={id} className="flex scroll-mt-28 flex-col gap-6">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
            {children}
        </section>
    );
}
