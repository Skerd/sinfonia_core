import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {DropdownMenuContent, DropdownMenuLabel} from "@coreModule/components/ui/dropdown-menu.tsx";
import CreateCompanyDropMenuItem from "@coreModule/clients/panel/private/sidebar/companies/allCompaniesDropDownMenuContent/createCompanyDropMenuItem.tsx";
import {useSidebar} from "@coreModule/components/ui/sidebar.tsx";
import CompanyDropDownItems from "@coreModule/clients/panel/private/sidebar/companies/allCompaniesDropDownMenuContent/companyDropDownItems.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";

type AllCompaniesDropDownMenuContentProps = WithLanguageType & {
    /** Bumped when a company is created, so the list reloads from the first page. */
    listReloadKey: number;
}

function AllCompaniesDropDownMenuContent({
    resolveLanguageKey,
    listReloadKey,
}: AllCompaniesDropDownMenuContentProps) {

    const { isMobile } = useSidebar();

    return (
        <DropdownMenuContent
            className='flex max-h-128 w-(--radix-dropdown-menu-trigger-width) min-w-72 flex-col overflow-hidden rounded-lg'
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
            forceMount
        >
            <DropdownMenuLabel className='shrink-0 py-0 text-muted-foreground text-xs'>
                {resolveLanguageKey("title")}
            </DropdownMenuLabel>
            <CompanyDropDownItems
                key={listReloadKey}
                forceReload={listReloadKey}
            />
            <div className="shrink-0">
                <CreateCompanyDropMenuItem />
            </div>
        </DropdownMenuContent>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/sidebar/companies/allCompaniesDropDownMenuContent/index.tsx"),
    withDebug(true, true, "companies")
)(AllCompaniesDropDownMenuContent);