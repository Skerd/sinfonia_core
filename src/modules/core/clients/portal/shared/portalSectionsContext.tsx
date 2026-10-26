import {createContext, useContext, useEffect, useMemo, useState, type ReactNode} from "react";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import {getPortalContributions} from "@coreModule/helpers/moduleContributions/loadPortalContributions.ts";
import type {PortalContribution} from "@coreModule/helpers/types/portalContribution.types.ts";
import type {PortalSectionsResponse} from "armonia/src/modules/core/api/portal/public/portal/portal.dto.ts";

/** A section this build can show, with how many companies the portal lists in it. */
export type PortalSectionEntry = PortalContribution & {companies: number};

const PortalSectionsContext = createContext<{sections: PortalSectionEntry[]; loading: boolean}>({sections: [], loading: true});

/** Loads which sections have companies once; sections without a page in this build are left out. */
export function PortalSectionsProvider({children}: {children: ReactNode}) {
    const [counts, setCounts] = useState<Record<string, number> | null>(null);

    useEffect(() => {
        let cancelled = false;
        apiClient.post<PortalSectionsResponse>("/api/portal/sections", {})
            .then((res) => { if (!cancelled) setCounts(Object.fromEntries(res.data.data.map((s) => [s.key, s.companies]))); })
            .catch(() => { if (!cancelled) setCounts({}); });
        return () => { cancelled = true; };
    }, []);

    const value = useMemo(() => ({
        loading: counts === null,
        sections: getPortalContributions()
            .filter((contribution) => (counts?.[contribution.section] ?? 0) > 0)
            .map((contribution) => ({...contribution, companies: counts?.[contribution.section] ?? 0})),
    }), [counts]);

    return <PortalSectionsContext.Provider value={value}>{children}</PortalSectionsContext.Provider>;
}

export function usePortalSections() {
    return useContext(PortalSectionsContext);
}
