import {compose} from "redux";
import {useEffect, useLayoutEffect, useState, type ReactNode} from "react";
import {Link, useLocation, useParams} from "react-router-dom";
import {ArrowLeft, ArrowUpRight} from "lucide-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import {setSiteCompany} from "@coreModule/helpers/apiClient/siteCompany.ts";
import type {PortalContribution} from "@coreModule/helpers/types/portalContribution.types.ts";
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

type PortalCompanySiteProps = WithLanguageType & {
    contribution: PortalContribution;
    children: ReactNode;
};

/**
 * One company's pages of a section on the apex (`/<path>/<company>/*`), under a strip naming
 * the company. Every request they make names it in `x-site-company`.
 */
function PortalCompanySite({contribution, children, resolveLanguageKey}: PortalCompanySiteProps) {
    const {company: slug = ""} = useParams();
    const {pathname} = useLocation();
    const [card, setCard] = useState<PortalCompanyCard | null | undefined>(undefined);

    // Before the pages' own effects run, so their first requests already carry it.
    useLayoutEffect(() => {
        setSiteCompany(slug);
        return () => setSiteCompany(null);
    }, [slug]);

    useEffect(() => {
        let cancelled = false;
        setCard(undefined);
        apiClient.post<PortalCompaniesResponse>("/api/portal/companies", {section: contribution.section, slug})
            .then((res) => { if (!cancelled) setCard(res.data.data[0] ?? null); })
            .catch(() => { if (!cancelled) setCard(null); });
        return () => { cancelled = true; };
    }, [contribution.section, slug]);

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
                        <Link to={sectionHref(contribution)}><ArrowLeft /></Link>
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
                                <ArrowUpRight aria-hidden />
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
