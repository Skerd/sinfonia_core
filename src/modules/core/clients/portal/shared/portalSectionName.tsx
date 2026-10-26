import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";

type PortalSectionNameProps = WithLanguageType & {
    section: string;
    /** `title` (default) or `description`. */
    part?: "title" | "description";
};

/** A section's name or blurb, in one dictionary for every page that shows sections. */
function PortalSectionName({section, part = "title", resolveLanguageKey}: PortalSectionNameProps) {
    return <>{resolveLanguageKey(`${section}.${part}`, true) ?? section}</>;
}

export default compose(withLanguage("src/modules/core/clients/portal/shared/portalSectionName.tsx"))(PortalSectionName);
