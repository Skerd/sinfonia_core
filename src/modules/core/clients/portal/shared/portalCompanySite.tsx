import {useEffect} from "react";
import {Link, useParams} from "react-router-dom";
import {setSiteCompany} from "@coreModule/helpers/apiClient/siteCompany.ts";
import {getPortalContributionByPath} from "@coreModule/helpers/moduleContributions/loadPortalContributions.ts";
import {cn} from "@coreModule/components/lib/utils.ts";
import PortalNotFound from "@coreModule/clients/portal/notFound/index.tsx";
import PortalSectionName from "./portalSectionName.tsx";
import SectionRouter from "./sectionRouter.tsx";
import {PORTAL_CONTAINER, PORTAL_LINK} from "./portalStyles.ts";

/**
 * One company's site within a section (`/<section>/<company>/*`). Every request it makes
 * names the company in `x-site-company`; the API answers only while the company is listed.
 */
export default function PortalCompanySite() {
    const {sectionPath, company} = useParams();
    const contribution = getPortalContributionByPath(sectionPath);
    const CompanySite = contribution?.CompanySite;

    // Set during render, so the site's very first requests already carry it.
    setSiteCompany(CompanySite && company ? company : null);
    useEffect(() => () => setSiteCompany(null), []);

    if (!contribution || !CompanySite || !company) return <PortalNotFound />;

    return (
        <>
            <div className="border-b border-portal-border bg-portal-surface">
                <div className={cn(PORTAL_CONTAINER, "py-2 text-sm")}>
                    <Link to={`/${contribution.path}`} className={PORTAL_LINK}>
                        ← <PortalSectionName section={contribution.section} />
                    </Link>
                </div>
            </div>
            <SectionRouter basename={`/${contribution.path}/${company}`}>
                <CompanySite />
            </SectionRouter>
        </>
    );
}
