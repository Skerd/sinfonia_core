import type {PortalContribution} from "@coreModule/helpers/types/portalContribution.types.ts";
import SectionRouter from "./sectionRouter.tsx";

/** A section that is one site across every company (the shop), under `/<section>/*`. */
export default function PortalSectionSite({contribution}: {contribution: PortalContribution}) {
    const SectionSite = contribution.SectionSite;
    if (!SectionSite) return null;
    return (
        <SectionRouter basename={`/${contribution.path}`}>
            <SectionSite />
        </SectionRouter>
    );
}
