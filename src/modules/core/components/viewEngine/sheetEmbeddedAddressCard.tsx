import { compose } from "redux";
import withLanguage, { WithLanguageType } from "@baseModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@baseModule/helpers/hocs/withDebug.tsx";
import SheetCompanyAddressesSection from "./sheetCompanyAddressesSection.tsx";

type SheetEmbeddedAddressCardProps = WithLanguageType & {
    address?: unknown;
    badgeAccessModel?: string;
    unitId?: string;
    unitName?: string;
    hideActions?: boolean;
    small?: boolean;
    fetchId?: string;
};

function SheetEmbeddedAddressCard({
    address,
    resolveLanguageKey,
    badgeAccessModel,
}: SheetEmbeddedAddressCardProps) {
    return (
        <SheetCompanyAddressesSection
            addresses={address != null ? [address] : []}
            resolveLanguageKey={resolveLanguageKey}
            badgeAccessModel={badgeAccessModel}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/addresses/formAddressWithMap.tsx"),
    withDebug(true, true),
)(SheetEmbeddedAddressCard);