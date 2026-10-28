import {createContext, useCallback, useContext, type ReactNode} from "react";
import type {PortalContribution} from "@coreModule/helpers/types/portalContribution.types.ts";
import {usePortalSite} from "./portalSiteContext.tsx";
import {companySiteOrigin} from "./portalZone.ts";

const SectionBaseContext = createContext("");

/** Where a section opens: the home catalog on its first kind (its items straight away), else its own pages. */
export function sectionHref({path, catalogs}: Pick<PortalContribution, "path" | "catalogs">): string {
    const kind = catalogs?.[0]?.kind;
    return kind ? `/?${new URLSearchParams({kind})}` : `/${path}`;
}

/** Where the section's pages start on this host: `/shop`, `/dentists/<clinic>` on the apex, `/dentists` on the clinic's own site. */
export function SectionBaseProvider({base, children}: {base: string; children: ReactNode}) {
    return <SectionBaseContext.Provider value={base}>{children}</SectionBaseContext.Provider>;
}

/** The prefix every link inside a section's pages starts with: `` `${useSectionBase()}/book` ``. */
export function useSectionBase(): string {
    return useContext(SectionBaseContext);
}

/**
 * A link to one company's page in a section, from anywhere on this host: in the apex its
 * `/<section>/<company>` pages; on the company's own site its `/<section>` pages; from
 * another company's site an address on that company's host (the session spans the zone).
 */
export function useCompanyLink(): (sectionPath: string, companySlug: string, path: string) => string {
    const {site} = usePortalSite();
    return useCallback((sectionPath, companySlug, path) => {
        if (site?.scope !== "company") return `/${sectionPath}/${companySlug}${path}`;
        const sectionPage = `/${sectionPath}${path}`;
        return site.company.slug === companySlug ? sectionPage : `${companySiteOrigin(companySlug) ?? ""}${sectionPage}`;
    }, [site]);
}
