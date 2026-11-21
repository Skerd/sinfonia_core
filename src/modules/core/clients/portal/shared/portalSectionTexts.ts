import {useEffect} from "react";
import {warmComponentLanguage} from "@coreModule/helpers/hooks/useSelectedLanguage.ts";
import {languagePathOf} from "@coreModule/helpers/hocs/languagePath.ts";
import type {PortalSection} from "@coreModule/helpers/types/portalContribution.types.ts";

/** Out of the way of the first paint. */
const AFTER_FIRST_PAINT_MS = 400;

/**
 * Loads the text of the parts the host's sections show only later (a catalog kind's filters and intro once its tab
 * is opened, a section's block on the account page), once the host is known, so they show it on their first render
 * instead of a frame after (TD-F145). The home blocks and navbar parts render at once and load their own.
 */
export function usePortalSectionTexts(sections: readonly PortalSection[], languageCode: string | undefined): void {
    useEffect(() => {
        if (sections.length === 0) return;
        const timer = setTimeout(() => {
            for (const section of sections) {
                const later = [section.AccountSection, ...(section.catalogs ?? []).flatMap((catalog) => [catalog.Filters, catalog.Intro])];
                for (const part of later) {
                    const path = languagePathOf(part);
                    if (path) warmComponentLanguage(path, languageCode);
                }
            }
        }, AFTER_FIRST_PAINT_MS);
        return () => clearTimeout(timer);
    }, [sections, languageCode]);
}
