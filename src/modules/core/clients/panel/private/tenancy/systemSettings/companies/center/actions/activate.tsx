import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {ShieldCheck} from "lucide-react";
import {Company} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";

type ActivateCompanyProps = WithLanguageType & {
    company: Partial<Company> & {_id: string};
    onAction: (action: string) => void;
};

function ActivateCompany({company, resolveLanguageKey, onAction}: ActivateCompanyProps) {
    const {write} = useAccess("companies");

    if (!write?.isActive) return <></>;
    if (!company.parentCompany) return <></>;
    if (company.isActive) return <></>;

    return (
        <DropdownMenuItem onClick={() => {onAction("activateCompany");}}>
            <ShieldCheck className="text-green-600" size={16} />
            {resolveLanguageKey("title")}
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/companies/center/actions/activate.tsx"),
    withDebug(true, true)
)(ActivateCompany);
