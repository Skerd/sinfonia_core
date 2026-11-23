import {useCallback} from "react";
import {useDynamicLanguage} from "@coreModule/helpers/hooks/useDynamicLanguage.ts";
import type {PortalSection} from "@coreModule/helpers/types/portalContribution.types.ts";
import {portalCitySlug} from "armonia/src/modules/core/helpers/slug.ts";
import {usePortalSite} from "./portalSiteContext.tsx";

/** The sections' names, from the one dictionary every page that shows sections reads. */
const SECTION_NAMES = "src/modules/core/clients/portal/shared/portalSectionName.tsx";
const TEXTS = "src/modules/core/clients/portal/shared/portalLandings.ts";

/** A city landing page's address on the apex (D181): `/car-rental/in/tirana`. */
export function landingHref(section: Pick<PortalSection, "path">, city: string): string {
    return `/${section.path}/in/${portalCitySlug(city)}`;
}

/** A landing page's name in the visitor's language, "Car rental in Tirana"; empty until its texts have loaded. */
export function useLandingName(): (section: string, city: string) => string {
    const names = useDynamicLanguage(SECTION_NAMES);
    const texts = useDynamicLanguage(TEXTS);
    return useCallback((section, city) => {
        if (names.currentLanguage === null) return "";
        return texts.resolveLanguageKey("name")
            .replace("{section}", names.resolveLanguageKey(`${section}.title`, true) ?? section)
            .replace("{city}", city);
    }, [names, texts]);
}

/** The city landing pages this host lists, by section in the sections' order; none on a company's own site. */
export function usePortalLandings(): {section: PortalSection; links: {href: string; label: string}[]}[] {
    const {site, sections} = usePortalSite();
    const landingName = useLandingName();
    const landings = site ? site.landings : [];
    return sections.flatMap((section) => {
        const links = landings
            .filter((landing) => landing.section === section.section)
            .map(({city}) => ({href: landingHref(section, city), label: landingName(section.section, city)}));
        return links.length > 0 ? [{section, links}] : [];
    });
}
