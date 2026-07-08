import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {DropdownMenuContent, DropdownMenuLabel} from "@coreModule/components/ui/dropdown-menu.tsx";
import CreateCompanyDropMenuItem from "@coreModule/clients/panel/private/sidebar/companies/allCompaniesDropDownMenuContent/createCompanyDropMenuItem.tsx";
import {useSidebar} from "@coreModule/components/ui/sidebar.tsx";
import CompanyDropDownItems from "@coreModule/clients/panel/private/sidebar/companies/allCompaniesDropDownMenuContent/companyDropDownItems.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {BasicCompanyInfoFormResponseType} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";
import {HttpError} from "@coreModule/helpers/hooks/useHttpRequest.ts";

type AllCompaniesDropDownMenuContentProps = WithLanguageType & {
    companiesList: BasicCompanyInfoFormResponseType[] | null;
    companiesListLoading: boolean;
    companiesListError: HttpError | null;
    onCompaniesListRetry: () => void;
}

function AllCompaniesDropDownMenuContent({
    resolveLanguageKey,
    companiesList,
    companiesListLoading,
    companiesListError,
    onCompaniesListRetry
}: AllCompaniesDropDownMenuContentProps) {

    const { isMobile } = useSidebar();

    return (
        <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-72 rounded-lg'
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
            forceMount
        >
            <DropdownMenuLabel className='text-muted-foreground text-xs'>
                {resolveLanguageKey("title")}
            </DropdownMenuLabel>
            <CompanyDropDownItems
                data={companiesList}
                loading={companiesListLoading}
                error={companiesListError}
                onRetry={onCompaniesListRetry}
            />
            <CreateCompanyDropMenuItem />
        </DropdownMenuContent>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/sidebar/companies/allCompaniesDropDownMenuContent/index.tsx"),
    withDebug(true, true)
)(AllCompaniesDropDownMenuContent);