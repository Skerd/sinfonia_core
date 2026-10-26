import {compose} from "redux";
import {useSelector} from "react-redux";
import {Eye, EyeOff} from "lucide-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {Company} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";

type SetPortalVisibilityProps = WithLanguageType & {
    company: Partial<Company> & {_id: string};
    onAction: (action: string) => void;
};

/** Platform admins hide a company from the portal and shop apex, or show it again. */
function SetPortalVisibility({company, resolveLanguageKey, onAction}: SetPortalVisibilityProps) {
    const isPlatformAdmin = useSelector((state: RootState) => state.authentication.user.isPlatformAdmin);

    if (!isPlatformAdmin) return <></>;

    return (
        <DropdownMenuItem onClick={() => {onAction("setPortalVisibility");}}>
            {company.hiddenFromPortal ? <Eye size={16} /> : <EyeOff size={16} />}
            {resolveLanguageKey(company.hiddenFromPortal ? "show" : "hide")}
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/companies/center/actions/setPortalVisibility.tsx"),
    withDebug(true, true, "companies")
)(SetPortalVisibility);
