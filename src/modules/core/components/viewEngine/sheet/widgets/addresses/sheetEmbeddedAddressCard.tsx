import { compose } from "redux";
import withLanguage, { WithLanguageType } from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import SheetCompanyAddressesSection from "./sheetCompanyAddressesSection.tsx";

/** Also mounted as a `#ReferencesRender` card, which passes (and this ignores) the card props. */
type SheetEmbeddedAddressCardProps = WithLanguageType & {
    address?: unknown;
};

function SheetEmbeddedAddressCard({
    address,
    resolveLanguageKey,
}: SheetEmbeddedAddressCardProps) {
    return (
        <SheetCompanyAddressesSection
            addresses={address != null ? [address] : []}
            resolveLanguageKey={resolveLanguageKey}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/addresses/formAddressWithMap.tsx"),
    withDebug(true, true),
)(SheetEmbeddedAddressCard);