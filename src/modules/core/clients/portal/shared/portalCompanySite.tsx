import {IconArrowLeft, IconArrowUpRight} from "@tabler/icons-react";
import {compose} from "redux";
import {useLayoutEffect, useMemo, useState, type ReactNode} from "react";
import {Link, useLocation, useParams} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {setSiteCompany} from "@coreModule/helpers/apiClient/siteCompany.ts";
import type {PortalSection} from "@coreModule/helpers/types/portalContribution.types.ts";
import {Avatar, AvatarFallback, AvatarImage} from "@coreModule/components/ui/avatar.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import type {PortalCompaniesResponse, PortalCompanyCard} from "armonia/src/modules/core/api/portal/public/portal/portal.dto.ts";
import PortalNotFound from "../notFound/index.tsx";
import PortalSectionName from "./portalSectionName.tsx";
import {PortalListedCompanyProvider} from "./portalListedCompany.tsx";
import {SectionBaseProvider, sectionHref} from "./sectionBase.tsx";
import {companySiteOrigin} from "./portalZone.ts";
import {BlogSection} from "../blog/index.tsx";
import {COMPANIES_REQUEST, companyLookupBody} from "./portalCompanies.ts";

type PortalCompanySiteProps = WithLanguageType & {
    contribution: PortalSection;
    children: ReactNode;
};

/**
 * One company's pages of a section on the apex (`/<path>/<company>/*`), under a strip naming
 * the company. Every request they make names it in `x-site-company`.
 *
 * The pages render at once, in the same navigation as the strip, rather than after the company lookup: they only need
 * the header, and a page whose code is still loading then keeps the previous page on screen instead of blanking it.
 */
function PortalCompanySite({contribution, children, resolveLanguageKey}: PortalCompanySiteProps) {
    const {company: slug = ""} = useParams();
    const {pathname} = useLocation();

    // Before the pages' own effects run, so their first requests already carry it.
    useLayoutEffect(() => {
        setSiteCompany(slug);
        return () => setSiteCompany(null);
    }, [slug]);

    // Silent; runs after the layout effect above, so it already names the company.
    const body = useMemo(() => companyLookupBody(contribution.section, slug), [contribution.section, slug]);
    const [lookup, setLookup] = useState({body, count: 1});
    if (lookup.body !== body) setLookup({body, count: lookup.count + 1});
    const {data, loading, error} = useHttpRequest<PortalCompaniesResponse>(COMPANIES_REQUEST, body, lookup.count);
    const card: PortalCompanyCard | null | undefined = loading ? undefined : error ? null : data ? data.data[0] ?? null : undefined;

    if (card === null) return <PortalNotFound />;
    const companySlug = card?.slug ?? slug;
    const siteOrigin = companySiteOrigin(companySlug);

    const visitHref = siteOrigin ? `${siteOrigin}/${contribution.path}` : undefined;
    const companyBase = `/${contribution.path}/${companySlug}`;
    const onCompanyIndex = pathname === companyBase || pathname === `${companyBase}/`;

    return (
        <PortalListedCompanyProvider company={card ? {name: card.name, slug: card.slug, logo: card.logo, visitHref} : null}>
            <div className="border-b bg-muted/40">
                <div className="site-container flex items-center gap-3 py-3">
                    <Button asChild variant="ghost" size="icon" aria-label={resolveLanguageKey("back")}>
                        <Link to={sectionHref(contribution)}><IconArrowLeft /></Link>
                    </Button>
                    {/* Same height while the company is being looked up, so nothing below moves when it arrives. */}
                    {card ? <CompanyStrip card={card} section={contribution.section} visitHref={visitHref} visitLabel={resolveLanguageKey("visitSite")} /> : (
                        <div className="h-9 flex-1" aria-busy="true" aria-label={resolveLanguageKey("loading")} />
                    )}
                </div>
            </div>
            {onCompanyIndex ? <BlogSection companySlug={companySlug} contained /> : null}
            <SectionBaseProvider base={companyBase}>{children}</SectionBaseProvider>
        </PortalListedCompanyProvider>
    );
}

/** The company's logo, name, section and cities, and a link to its own site. */
function CompanyStrip({card, section, visitHref, visitLabel}: {card: PortalCompanyCard; section: string; visitHref?: string; visitLabel: string}) {
    return (
        <>
            <Avatar className="size-9">
                {card.logo ? <AvatarImage src={card.logo} alt="" className="object-contain" /> : null}
                <AvatarFallback>{card.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{card.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                    <PortalSectionName section={section} />
                    {card.cities.length ? ` · ${card.cities.join(", ")}` : ""}
                </p>
            </div>
            {visitHref ? (
                <Button asChild variant="outline" className="hidden sm:inline-flex">
                    <a href={visitHref}>
                        {visitLabel}
                        <IconArrowUpRight aria-hidden />
                    </a>
                </Button>
            ) : null}
        </>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/shared/portalCompanySite.tsx"))(PortalCompanySite);
