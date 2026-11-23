import {IconPhotoOff, IconRosetteDiscountCheckFilled, IconStarFilled} from "@tabler/icons-react";
import {compose} from "redux";
import {Link} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {formatCurrency} from "@coreModule/helpers/general/numbers.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import type {PortalCatalogItem} from "armonia/src/modules/core/api/portal/public/portal/portal.dto.ts";
import PortalKindName from "../shared/portalKindName.tsx";
import {usePortalSite} from "../shared/portalSiteContext.tsx";
import {useCompanyLink} from "../shared/sectionBase.tsx";
import {revealImage} from "../shared/portalImageMotion.ts";

/** Cards of one grid arrive one after another, this far apart, the first eight of them. */
const STAGGER_MS = 40;
const STAGGERED = 8;

/** Where an item opens: its section's page on this host, or the company's page of the section. */
export function useCatalogItemHref(): (item: PortalCatalogItem) => string | null {
    const {sections} = usePortalSite();
    const companyLink = useCompanyLink();
    return (item) => {
        const section = sections.find((contribution) => contribution.section === item.section);
        if (!section) return null;
        return section.SectionSite ? `/${section.path}${item.path}` : companyLink(section.path, item.company.slug, item.path);
    };
}

/**
 * A card's price: whole units when the amount has none (a €250,000 home), otherwise the currency's own decimals
 * (a €12.50 product, a €45.50 day rate): `formatCurrency` alone rounds to whole units.
 */
export function formatCatalogPrice(amount: number, currency: string): string {
    return Number.isInteger(amount)
        ? formatCurrency(amount, currency)
        : formatCurrency(amount, currency, {maximumFractionDigits: undefined});
}

/** A card's price as words: "€60 / day", "from €60", "up to €200" (a task's budget), or the amount alone. */
export function catalogPriceLabel(price: PortalCatalogItem["price"], resolveLanguageKey: (key: string) => string): string | null {
    const amount = price ? formatCatalogPrice(price.amount, price.currency) : null;
    if (!price || !amount) return null;
    if (price.per === "day") return resolveLanguageKey("pricePerDay").replace("{price}", amount);
    if (price.from) return resolveLanguageKey("priceFrom").replace("{price}", amount);
    if (price.upTo) return resolveLanguageKey("priceUpTo").replace("{price}", amount);
    return amount;
}

/** `index` is the card's place in its grid: a new card fades up in turn. */
function CatalogCard({item, index = 0, resolveLanguageKey}: WithLanguageType & {item: PortalCatalogItem; index?: number}) {
    const href = useCatalogItemHref()(item);
    if (!href) return null;
    const price = catalogPriceLabel(item.price, (key) => String(resolveLanguageKey(key)));

    return (
        <Link
            to={href}
            className="group flex flex-col gap-3 rounded-2xl outline-none transition-[opacity,translate] duration-500 ease-out focus-visible:ring-3 focus-visible:ring-ring/50 starting:translate-y-3 starting:opacity-0"
            style={{transitionDelay: `${Math.min(index, STAGGERED) * STAGGER_MS}ms`}}
        >
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted transition-transform duration-150 group-active:scale-[0.98]">
                {item.image ? (
                    <img ref={revealImage} data-reveal src={item.image} alt="" loading="lazy" className="size-full object-cover transition-[scale,opacity] duration-500 group-hover:scale-[1.03]" />
                ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground"><IconPhotoOff className="size-6" aria-hidden /></div>
                )}
                <Badge variant="secondary" className="absolute top-3 left-3 bg-background/90 backdrop-blur">
                    <PortalKindName kind={item.kind} part="item" />
                </Badge>
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
                <p className="line-clamp-2 font-medium leading-snug">{item.title}</p>
                {/* What sets the item apart, from its provider (a car's seats and gearbox, a project's place). */}
                {item.subtitle ? <p className="truncate text-sm">{item.subtitle}</p> : null}
                <p className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
                    <span className="truncate">{[item.company.name, item.city].filter(Boolean).join(" · ")}</span>
                    {/* The platform checked the company's NIPT/VAT (D178). */}
                    {item.company.verified ? (
                        <IconRosetteDiscountCheckFilled className="h-4 w-4 shrink-0 text-sky-600" role="img" aria-label={resolveLanguageKey("verified")}>
                            <title>{resolveLanguageKey("verified")}</title>
                        </IconRosetteDiscountCheckFilled>
                    ) : null}
                </p>
                {/* Reviews from completed bookings or purchases (D178). */}
                {item.rating ? (
                    <p
                        className="flex items-center gap-1 text-sm tabular-nums"
                        aria-label={resolveLanguageKey(item.rating.count === 1 ? "ratingLabelOne" : "ratingLabel").replace("{average}", String(item.rating.average)).replace("{count}", String(item.rating.count))}
                    >
                        <IconStarFilled className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                        <span aria-hidden className="font-medium">{item.rating.average.toFixed(1)}</span>
                        <span aria-hidden className="text-muted-foreground">({item.rating.count})</span>
                    </p>
                ) : null}
                {price ? <p className="mt-1 font-display font-semibold tabular-nums">{price}</p> : null}
            </div>
        </Link>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/home/catalogCard.tsx"))(CatalogCard);
