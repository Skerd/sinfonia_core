import {IconArrowLeft, IconArrowUpRight} from "@tabler/icons-react";
import {compose} from "redux";
import {useLayoutEffect, useMemo, useState, type ReactNode} from "react";
import {Link, useLocation, useParams} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {setSiteCompany} from "@coreModule/helpers/apiClient/siteCompany.ts";
import type {PortalSection} from "@coreModule/helpers/types/portalContribution.types.ts";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@coreModule/components/ui/avatar.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import type {PortalCompaniesResponse, PortalCompanyCard} from "armonia/src/modules/core/api/portal/public/portal/portal.dto.ts";
import PortalNotFound from "../notFound/index.tsx";
import PortalSectionName from "./portalSectionName.tsx";
import {PortalListedCompanyProvider} from "./portalListedCompany.tsx";
import {SectionBaseProvider, sectionHref} from "./sectionBase.tsx";
import {companySiteOrigin} from "./portalZone.ts";
import {BlogSection} from "../blog/index.tsx";

const COMPANIES_REQUEST = {method: "post" as const, url: "/api/portal/companies", data: {}};

type PortalCompanySiteProps = WithLanguageType & {
    contribution: PortalSection;
    children: ReactNode;
};

/**
 * One company's pages of a section on the apex (`/<path>/<company>/*`), under a strip naming
 * the company. Every request they make names it in `x-site-company`.
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
    const body = useMemo(() => ({section: contribution.section, slug}), [contribution.section, slug]);
    const [lookup, setLookup] = useState({body, count: 1});
    if (lookup.body !== body) setLookup({body, count: lookup.count + 1});
    const {data, loading, error} = useHttpRequest<PortalCompaniesResponse>(COMPANIES_REQUEST, body, lookup.count);
    const card: PortalCompanyCard | null | undefined = loading ? undefined : error ? null : data ? data.data[0] ?? null : undefined;

    if (card === undefined) return <Loader />;
    if (!card) return <PortalNotFound />;
    const siteOrigin = companySiteOrigin(card.slug);

    const visitHref = siteOrigin ? `${siteOrigin}/${contribution.path}` : undefined;
    const companyBase = `/${contribution.path}/${card.slug}`;
    const onCompanyIndex = pathname === companyBase || pathname === `${companyBase}/`;

    return (
        <PortalListedCompanyProvider company={{name: card.name, slug: card.slug, logo: card.logo, visitHref}}>
            <div className="border-b bg-muted/40">
                <div className="site-container flex items-center gap-3 py-3">
                    <Button asChild variant="ghost" size="icon" aria-label={resolveLanguageKey("back")}>
                        <Link to={sectionHref(contribution)}><IconArrowLeft /></Link>
                    </Button>
                    <Avatar className="size-9">
                        {card.logo ? <AvatarImage src={card.logo} alt="" className="object-contain" /> : null}
                        <AvatarFallback>{card.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{card.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                            <PortalSectionName section={contribution.section} />
                            {card.cities.length ? ` · ${card.cities.join(", ")}` : ""}
                        </p>
                    </div>
                    {visitHref ? (
                        <Button asChild variant="outline" className="hidden sm:inline-flex">
                            <a href={visitHref}>
                                {resolveLanguageKey("visitSite")}
                                <IconArrowUpRight aria-hidden />
                            </a>
                        </Button>
                    ) : null}
                </div>
            </div>
            {onCompanyIndex ? <BlogSection companySlug={card.slug} contained /> : null}
            <SectionBaseProvider base={`/${contribution.path}/${card.slug}`}>{children}</SectionBaseProvider>
        </PortalListedCompanyProvider>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/shared/portalCompanySite.tsx"))(PortalCompanySite);
