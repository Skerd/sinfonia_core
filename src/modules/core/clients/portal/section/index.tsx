import {compose} from "redux";
import {useEffect, useState} from "react";
import {Link, useParams, useSearchParams} from "react-router-dom";
import {MapPin} from "lucide-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {getPortalContributionByPath} from "@coreModule/helpers/moduleContributions/loadPortalContributions.ts";
import type {PortalCompaniesResponse} from "armonia/src/modules/core/api/portal/public/portal/portal.dto.ts";
import PortalNotFound from "../notFound/index.tsx";
import PortalSectionName from "../shared/portalSectionName.tsx";
import {PORTAL_CARD, PORTAL_CONTAINER, PORTAL_HEADING, PORTAL_INPUT} from "../shared/portalStyles.ts";

const PAGE = 24;

/** A section's companies, optionally in one city, with the section's own search on top. */
function PortalSectionPage({resolveLanguageKey}: WithLanguageType) {
    const {sectionPath} = useParams();
    const contribution = getPortalContributionByPath(sectionPath);
    const [params, setParams] = useSearchParams();
    const city = params.get("city") ?? "";
    const [cityDraft, setCityDraft] = useState(city);
    const [companies, setCompanies] = useState<PortalCompaniesResponse | null>(null);

    useEffect(() => {
        if (!contribution) return;
        let cancelled = false;
        setCompanies(null);
        apiClient.post<PortalCompaniesResponse>("/api/portal/companies", {section: contribution.section, city: city || undefined, limit: PAGE})
            .then((res) => { if (!cancelled) setCompanies(res.data); })
            .catch(() => { if (!cancelled) setCompanies({data: [], total: 0}); });
        return () => { cancelled = true; };
    }, [contribution, city]);

    if (!contribution) return <PortalNotFound />;
    const SectionSearch = contribution.SectionSearch;

    return (
        <div className={cn(PORTAL_CONTAINER, "flex flex-col gap-8 py-10")}>
            <div className="max-w-2xl">
                <h1 className={cn(PORTAL_HEADING, "text-3xl sm:text-4xl")}><PortalSectionName section={contribution.section} /></h1>
                <p className="mt-3 text-lg text-portal-ink-muted"><PortalSectionName section={contribution.section} part="description" /></p>
            </div>

            <form
                className="flex max-w-md items-center gap-2"
                onSubmit={(event) => {
                    event.preventDefault();
                    const next = new URLSearchParams(params);
                    if (cityDraft.trim()) next.set("city", cityDraft.trim()); else next.delete("city");
                    setParams(next);
                }}
            >
                <MapPin size={18} className="shrink-0 text-portal-ink-faded" aria-hidden />
                <label className="sr-only" htmlFor="portal-section-city">{resolveLanguageKey("city")}</label>
                <input id="portal-section-city" className={PORTAL_INPUT} value={cityDraft} onChange={(e) => setCityDraft(e.target.value)} placeholder={resolveLanguageKey("cityPlaceholder")} />
            </form>

            {SectionSearch ? <div className={PORTAL_CARD}><SectionSearch city={city} /></div> : null}

            <section className="flex flex-col gap-4">
                <h2 className={cn(PORTAL_HEADING, "text-xl")}>
                    {resolveLanguageKey("companiesTitle")}{companies ? ` (${companies.total})` : ""}
                </h2>
                {companies === null ? (
                    <Loader />
                ) : companies.data.length === 0 ? (
                    <p className="text-portal-ink-muted">{resolveLanguageKey("noCompanies")}</p>
                ) : (
                    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {companies.data.map((company) => (
                            <li key={company._id}>
                                <Link
                                    to={contribution.SectionSite ? `/${contribution.path}/products?seller=${company._id}` : `/${contribution.path}/${company.slug}`}
                                    className={cn(PORTAL_CARD, "flex h-full flex-col gap-3 transition hover:border-portal-accent")}
                                >
                                    <div className="flex items-center gap-3">
                                        {company.logo ? (
                                            <img src={company.logo} alt="" className="h-12 w-12 rounded-xl object-cover" loading="lazy" />
                                        ) : (
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-portal-accent-soft font-semibold text-portal-accent" aria-hidden>
                                                {company.name.slice(0, 2)}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold">{company.name}</p>
                                            {company.cities.length ? <p className="truncate text-sm text-portal-ink-muted">{company.cities.join(", ")}</p> : null}
                                        </div>
                                    </div>
                                    {company.description ? <p className="line-clamp-3 text-sm text-portal-ink-muted">{company.description}</p> : null}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/section/index.tsx"))(PortalSectionPage);
