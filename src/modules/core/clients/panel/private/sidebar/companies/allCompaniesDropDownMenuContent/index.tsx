import {compose} from "redux";
import {useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {DropdownMenuContent} from "@coreModule/components/ui/dropdown-menu.tsx";
import CreateCompanyDropMenuItem from "@coreModule/clients/panel/private/sidebar/companies/allCompaniesDropDownMenuContent/createCompanyDropMenuItem.tsx";
import {useSidebar} from "@coreModule/components/ui/sidebar.tsx";
import CompanyDropDownItems from "@coreModule/clients/panel/private/sidebar/companies/allCompaniesDropDownMenuContent/companyDropDownItems.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useOnCompanyUpdated} from "@coreModule/clients/panel/private/sidebar/companies/companyUpdatedEvent.ts";

type AllCompaniesDropDownMenuContentProps = WithLanguageType & {
    menuOpen: boolean;
}

function AllCompaniesDropDownMenuContent({
    resolveLanguageKey,
    menuOpen,
}: AllCompaniesDropDownMenuContentProps) {

    // Bumped when the create-company dialog finishes or a company is saved, so the list reloads from the first page.
    const [listReloadKey, setListReloadKey] = useState(0);
    useOnCompanyUpdated(() => setListReloadKey((key) => key + 1));

    const { isMobile } = useSidebar();

    return (
        <DropdownMenuContent
            className='flex max-h-128 w-(--radix-dropdown-menu-trigger-width) min-w-72 flex-col overflow-hidden rounded-lg'
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
            forceMount
        >
            <CompanyDropDownItems
                key={listReloadKey}
                forceReload={listReloadKey}
                menuOpen={menuOpen}
                title={resolveLanguageKey("title")}
            />
            <div className="shrink-0">
                <CreateCompanyDropMenuItem onFinished={() => setListReloadKey((key) => key + 1)} />
            </div>
        </DropdownMenuContent>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/sidebar/companies/allCompaniesDropDownMenuContent/index.tsx"),
    withDebug(true, true, "companies")
)(AllCompaniesDropDownMenuContent);