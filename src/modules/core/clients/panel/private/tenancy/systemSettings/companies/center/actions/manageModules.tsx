import {compose} from "redux";
import {useSelector} from "react-redux";
import {Blocks} from "lucide-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {Company} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";

type ManageModulesProps = WithLanguageType & {
    company: Partial<Company> & {_id: string};
    onAction: (action: string) => void;
};

/** Only admins of the platform-owner company grant modules; the server enforces the same rule. */
function ManageModules({resolveLanguageKey, onAction}: ManageModulesProps) {
    const isPlatformAdmin = useSelector((state: RootState) => state.authentication.user.isPlatformAdmin);

    if (!isPlatformAdmin) return <></>;

    return (
        <DropdownMenuItem onClick={() => {onAction("manageModules");}}>
            <Blocks size={16} />
            {resolveLanguageKey("title")}
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/companies/center/actions/manageModules.tsx"),
    withDebug(true, true, "companies")
)(ManageModules);
