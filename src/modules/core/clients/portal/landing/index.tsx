import {useMemo} from "react";
import {useParams} from "react-router-dom";
import type {PortalSection} from "@coreModule/helpers/types/portalContribution.types.ts";
import {portalCitySlug} from "armonia/src/modules/core/helpers/slug.ts";
import Catalog from "../home/catalog.tsx";
import PortalNotFound from "../notFound/index.tsx";
import PortalSectionName from "../shared/portalSectionName.tsx";
import {useLandingName} from "../shared/portalLandings.ts";
import {usePortalSite} from "../shared/portalSiteContext.tsx";
import {usePortalTitle} from "../shared/portalTitle.ts";

/**
 * A section's offers in one city (D181), at `/<path>/in/<city>` on the apex: the home catalog of the section's kinds in
 * that city. Only the cities the site lists as landing pages have one; any other address is not found.
 */
export default function PortalLandingPage({section}: {section: PortalSection}) {
    const {site} = usePortalSite();
    const {city: slug} = useParams();
    const landingName = useLandingName();
    const landing = site?.landings.find((candidate) => candidate.section === section.section && portalCitySlug(candidate.city) === slug);
    const name = landing ? landingName(section.section, landing.city) : undefined;
    usePortalTitle(name);
    const scope = useMemo(() => landing ? {section, city: landing.city} : undefined, [section, landing]);

    if (!scope) return <PortalNotFound />;

    return (
        <div className="site-container flex flex-col gap-12 py-8 sm:gap-16 sm:py-12">
            <section className="flex flex-col gap-4 pt-6 sm:pt-12">
                <h1 className="max-w-3xl font-display text-4xl leading-[1.05] font-bold tracking-tight sm:text-6xl">{name}</h1>
                <p className="max-w-xl text-lg leading-relaxed text-muted-foreground"><PortalSectionName section={section.section} part="description" /></p>
            </section>
            <Catalog landing={scope} />
        </div>
    );
}
