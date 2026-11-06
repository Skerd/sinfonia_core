import {IconEye, IconEyeOff} from "@tabler/icons-react";
import {compose} from "redux";
import {useSelector} from "react-redux";
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
            {company.hiddenFromPortal ? <IconEye size={16} /> : <IconEyeOff size={16} />}
            {resolveLanguageKey(company.hiddenFromPortal ? "show" : "hide")}
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/companies/center/actions/setPortalVisibility.tsx"),
    withDebug(true, true, "companies")
)(SetPortalVisibility);
