import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";

type PortalKindNameProps = WithLanguageType & {
    kind: string;
    /** `tab` (default, plural: "Cars") or `item` (one: "Car"). */
    part?: "tab" | "item";
};

/** The name of a kind of catalog item, in one dictionary for every page that lists them. */
function PortalKindName({kind, part = "tab", resolveLanguageKey}: PortalKindNameProps) {
    return <>{resolveLanguageKey(`${kind}.${part}`, true) ?? kind}</>;
}

export default compose(withLanguage("src/modules/core/clients/portal/shared/portalKindName.tsx"))(PortalKindName);
