import type {ComponentType, KeyboardEvent, MouseEvent, ReactNode} from "react";
import {compose} from "redux";
import {IconBuildingStore} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import type {PortalSeller} from "armonia/src/modules/core/api/portal/public/portal/portal.dto.ts";
import type {PublicBlogSeller} from "armonia/src/modules/core/api/auxiliary/public/blog/blog.form.response.type.ts";
import {companySiteOrigin} from "@coreModule/clients/portal/shared/portalZone.ts";
import {usePortalSite} from "./portalSiteContext.tsx";
import {resolvePublicMediaUrl} from "./portalMedia.ts";
import {Button} from "@coreModule/components/ui/button.tsx";

const LANGUAGE_PATH = "src/modules/core/clients/portal/shared/portalSellerCard.tsx";

type SellerRef = PortalSeller | PublicBlogSeller;

/**
 * The seller's own site at one section, the same way car rental and dental open "Visit site":
 * `{slug}.{portal zone}/{sectionPath}`. A stored host covers a build with no portal zone.
 */
export function sellerSiteHref(seller: Pick<SellerRef, "siteHost" | "siteSlug">, sectionPath: string): string | undefined {
    const slug = seller.siteSlug?.trim();
    if (slug) {
        const origin = companySiteOrigin(slug);
        if (origin) return `${origin}/${sectionPath}`;
    }
    const host = seller.siteHost?.trim();
    if (!host) return undefined;
    const {protocol, port} = window.location;
    const portSuffix = port ? `:${port}` : "";
    return `${protocol}//${host}${portSuffix}/${sectionPath}`;
}

function initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function SellerMark({seller, size}: {seller: SellerRef; size: "sm" | "md"}) {
    const logoUrl = resolvePublicMediaUrl(seller.logo);
    if (logoUrl) {
        return (
            <span
                className={cn(
                    "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-card ring-1 ring-border",
                    size === "sm" && "h-7 w-7",
                    size === "md" && "h-11 w-11",
                )}
            >
                <img src={logoUrl} alt="" className="h-full w-full object-contain p-0.5" />
            </span>
        );
    }
    return (
        <span
            aria-hidden
            className={cn(
                "inline-flex shrink-0 items-center justify-center rounded-full bg-foreground font-display font-semibold text-background",
                size === "sm" && "h-7 w-7 text-[11px]",
                size === "md" && "h-11 w-11 text-sm",
            )}
        >
            {initials(seller.name) || "·"}
        </span>
    );
}

type PortalSellerCardProps = WithLanguageType & {
    seller?: SellerRef;
    /** The section the seller's own site opens at (`shop`, `services`). */
    sectionPath: string;
    /** Product / service listing / blog post / the board a task is posted on / a company that quoted on a task (D172). */
    kind?: "product" | "service" | "blog" | "task" | "quote";
    /** Compact line for catalog cards; card for detail pages. */
    size?: "compact" | "card";
    /**
     * When true, company click uses a button + stopPropagation so it works inside a parent `<Link>`
     * (product/blog cards) without nested anchors.
     */
    nestedInLink?: boolean;
    className?: string;
};

const KIND_LABEL: Record<NonNullable<PortalSellerCardProps["kind"]>, string> = {
    product: "soldBy",
    service: "offeredBy",
    blog: "publishedBy",
    task: "postedOn",
    quote: "sentQuote",
};

function openSellerSite(event: MouseEvent | KeyboardEvent, href: string) {
    event.preventDefault();
    event.stopPropagation();
    window.location.assign(href);
}

function SellerSiteControl({
    href,
    nestedInLink,
    className,
    ariaLabel,
    children,
}: {
    href: string;
    nestedInLink: boolean;
    className?: string;
    ariaLabel: string;
    children: ReactNode;
}) {
    if (nestedInLink) {
        return (
            <Button
                type="button"
                variant="bare"
                aria-label={ariaLabel}
                className={cn("cursor-pointer text-left", className)}
                onClick={(event) => openSellerSite(event, href)}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") openSellerSite(event, href);
                }}
            >
                {children}
            </Button>
        );
    }

    return (
        <a href={href} aria-label={ariaLabel} className={className}>
            {children}
        </a>
    );
}

/**
 * Portal apex only: shows which company owns the item, with a link to that company's own site.
 * Hidden on a company's own site (everything there is already that company).
 */
function PortalSellerCardInner({
    resolveLanguageKey,
    seller,
    sectionPath,
    kind = "product",
    size = "compact",
    nestedInLink = false,
    className,
}: PortalSellerCardProps) {
    const {site} = usePortalSite();
    if (site?.scope !== "platform" || !seller?.name) return null;

    const label = resolveLanguageKey(KIND_LABEL[kind]);
    const siteHref = sellerSiteHref(seller, sectionPath);
    const visitLabel = resolveLanguageKey("visitSiteNamed").replace("{name}", seller.name);

    if (size === "compact") {
        const body = (
            <>
                <SellerMark seller={seller} size="sm" />
                <span className="min-w-0 truncate">
                    <span className="text-muted-foreground">{label} </span>
                    <span className={cn("font-medium text-foreground", siteHref && "underline-offset-2 group-hover/seller:underline")}>
                        {seller.name}
                    </span>
                </span>
            </>
        );

        if (!siteHref) {
            return (
                <span className={cn("inline-flex max-w-full items-center gap-2 text-xs text-muted-foreground", className)}>
                    {body}
                </span>
            );
        }

        return (
            <SellerSiteControl
                href={siteHref}
                nestedInLink={nestedInLink}
                ariaLabel={visitLabel}
                className={cn(
                    "group/seller inline-flex max-w-full items-center gap-2 text-xs text-muted-foreground hover:text-foreground",
                    className,
                )}
            >
                {body}
            </SellerSiteControl>
        );
    }

    const identity = (
        <>
            <SellerMark seller={seller} size="md" />
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                <p className={cn(
                    "truncate font-display text-base font-semibold tracking-tight",
                    siteHref && "underline-offset-2 group-hover/seller:underline",
                )}>
                    {seller.name}
                </p>
            </div>
        </>
    );

    return (
        <div className={cn("flex items-center gap-3 rounded-2xl border border-border bg-muted/60 px-4 py-3", className)}>
            {siteHref ? (
                <SellerSiteControl
                    href={siteHref}
                    nestedInLink={nestedInLink}
                    ariaLabel={visitLabel}
                    className="group/seller flex min-w-0 flex-1 items-center gap-3"
                >
                    {identity}
                </SellerSiteControl>
            ) : (
                <div className="flex min-w-0 flex-1 items-center gap-3">{identity}</div>
            )}
            {siteHref ? (
                <a
                    href={siteHref}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-foreground"
                >
                    <IconBuildingStore className="h-3.5 w-3.5" aria-hidden />
                    {resolveLanguageKey("visitSite")}
                </a>
            ) : null}
        </div>
    );
}

export default compose(withLanguage(LANGUAGE_PATH), withDebug(true, true))(PortalSellerCardInner) as ComponentType<Omit<PortalSellerCardProps, keyof WithLanguageType>>;
