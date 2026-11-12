import {IconShieldMinus} from "@tabler/icons-react";
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {Company} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";

type DeactivateCompanyProps = WithLanguageType & {
    company: Partial<Company> & {_id: string; name: string};
    onAction: (action: string) => void;
};

function DeactivateCompany({company, resolveLanguageKey, onAction}: DeactivateCompanyProps) {
    const {write} = useAccess("companies");

    if (!write?.isActive) return <></>;
    if (!company.parentCompany) return <></>;
    if (!company.isActive) return <></>;
    if (company.isProtected) return <></>;

    return (
        <DropdownMenuItem onClick={() => {onAction("deactivateCompany");}}>
            <IconShieldMinus className="text-destructive" size={16} />
            {resolveLanguageKey("title")}
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/companies/center/actions/deactivate.tsx"),
    withDebug(true, true, "companies")
)(DeactivateCompany);
