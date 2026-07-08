import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {ShieldMinus} from "lucide-react";
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

    return (
        <DropdownMenuItem onClick={() => {onAction("deactivateCompany");}}>
            <ShieldMinus className="text-destructive" size={16} />
            {resolveLanguageKey("title")}
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/companies/center/actions/deactivate.tsx"),
    withDebug(true, true)
)(DeactivateCompany);
