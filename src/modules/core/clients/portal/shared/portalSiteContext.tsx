import {createContext, useContext, useEffect, useMemo, useState, type ReactNode} from "react";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import {getPortalContributions} from "@coreModule/helpers/moduleContributions/loadPortalContributions.ts";
import type {PortalContribution} from "@coreModule/helpers/types/portalContribution.types.ts";
import type {PortalSite, PortalSiteResponse} from "armonia/src/modules/core/api/portal/public/portal/portal.dto.ts";

type PortalSiteState = {
    /** What this host is; `undefined` while loading, `null` when it could not be loaded. */
    site: PortalSite | null | undefined;
    /** Sections this host offers that this build can show. */
    sections: PortalContribution[];
};

const PortalSiteContext = createContext<PortalSiteState>({site: undefined, sections: []});

/** Loads what this host is (the apex or one company's site) once. */
export function PortalSiteProvider({children}: {children: ReactNode}) {
    const [site, setSite] = useState<PortalSite | null | undefined>(undefined);

    useEffect(() => {
        let cancelled = false;
        apiClient.post<PortalSiteResponse>("/api/portal/site", {})
            .then((res) => { if (!cancelled) setSite(res.data.data); })
            .catch(() => { if (!cancelled) setSite(null); });
        return () => { cancelled = true; };
    }, []);

    const value = useMemo(() => ({
        site,
        sections: getPortalContributions().filter((contribution) => site?.sections.includes(contribution.section)),
    }), [site]);

    return <PortalSiteContext.Provider value={value}>{children}</PortalSiteContext.Provider>;
}

export function usePortalSite() {
    return useContext(PortalSiteContext);
}
