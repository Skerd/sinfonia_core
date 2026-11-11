import {IconPhotoOff} from "@tabler/icons-react";
import {compose} from "redux";
import {Link} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {formatCurrency} from "@coreModule/helpers/general/numbers.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import type {PortalCatalogItem} from "armonia/src/modules/core/api/portal/public/portal/portal.dto.ts";
import PortalKindName from "../shared/portalKindName.tsx";
import {usePortalSite} from "../shared/portalSiteContext.tsx";
import {useCompanyLink} from "../shared/sectionBase.tsx";

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

function CatalogCard({item, resolveLanguageKey}: WithLanguageType & {item: PortalCatalogItem}) {
    const href = useCatalogItemHref()(item);
    if (!href) return null;
    const amount = item.price ? formatCatalogPrice(item.price.amount, item.price.currency) : null;
    const price = !item.price || !amount ? null
        : item.price.per === "day" ? resolveLanguageKey("pricePerDay").replace("{price}", amount)
        : item.price.from ? resolveLanguageKey("priceFrom").replace("{price}", amount)
        : amount;

    return (
        <Link to={href} className="group flex flex-col gap-3 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
                {item.image ? (
                    <img src={item.image} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
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
                <p className="truncate text-sm text-muted-foreground">{[item.company.name, item.city].filter(Boolean).join(" · ")}</p>
                {price ? <p className="mt-1 font-display font-semibold tabular-nums">{price}</p> : null}
            </div>
        </Link>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/home/catalogCard.tsx"))(CatalogCard);
