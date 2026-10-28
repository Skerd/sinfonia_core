import {createContext, useContext, type ReactNode} from "react";
import {usePortalSite} from "./portalSiteContext.tsx";

export type PortalListedCompany = {
    name: string;
    slug: string;
    logo?: string;
    /** The company's own site for this section; omitted on that site, and when the zone has none. */
    visitHref?: string;
};

const PortalListedCompanyContext = createContext<PortalListedCompany | null>(null);

/** The company whose pages `PortalCompanySite` is showing on the apex. */
export function PortalListedCompanyProvider({company, children}: {company: PortalListedCompany; children: ReactNode}) {
    return <PortalListedCompanyContext.Provider value={company}>{children}</PortalListedCompanyContext.Provider>;
}

export function usePortalListedCompany(): PortalListedCompany | null {
    const listed = useContext(PortalListedCompanyContext);
    const {site} = usePortalSite();
    if (listed) return listed;
    if (site?.scope === "company") {
        return {name: site.company.name, slug: site.company.slug, logo: site.company.logo};
    }
    return null;
}
