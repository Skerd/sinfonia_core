import {createContext, useContext, useMemo, type ReactNode} from "react";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {getPortalContributions} from "@coreModule/helpers/moduleContributions/loadPortalContributions.ts";
import type {PortalContribution} from "@coreModule/helpers/types/portalContribution.types.ts";
import type {PortalSite, PortalSiteResponse} from "armonia/src/modules/core/api/portal/public/portal/portal.dto.ts";

type PortalSiteState = {
    /** What this host is; `undefined` while loading, `null` when it could not be loaded. */
    site: PortalSite | null | undefined;
    /** Sections this host offers that this build can show. */
    sections: PortalContribution[];
};

const SITE_REQUEST = {method: "post" as const, url: "/api/portal/site", data: {}};

const PortalSiteContext = createContext<PortalSiteState>({site: undefined, sections: []});

/** Loads what this host is (the apex or one company's site) once. */
export function PortalSiteProvider({children}: {children: ReactNode}) {
    // Silent (no translator): a host that cannot be loaded renders as `null`.
    const {data, error} = useHttpRequest<PortalSiteResponse>(SITE_REQUEST, {}, 1);
    const site: PortalSite | null | undefined = error ? null : data ? data.data : undefined;

    const value = useMemo(() => ({
        site,
        sections: getPortalContributions().filter((contribution) => site?.sections.includes(contribution.section)),
    }), [site]);

    return <PortalSiteContext.Provider value={value}>{children}</PortalSiteContext.Provider>;
}

export function usePortalSite() {
    return useContext(PortalSiteContext);
}
