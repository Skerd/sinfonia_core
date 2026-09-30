import {compose} from "redux";
import {useEffect, useState} from "react";
import {useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {ReloginProvider} from "@coreModule/helpers/context/reloginContext.tsx";
import {SidebarMenu, SidebarMenuButton, SidebarMenuItem} from "@coreModule/components/ui/sidebar.tsx";
import {ChevronsUpDown} from "lucide-react";
import {DropdownMenu, DropdownMenuTrigger} from "@coreModule/components/ui/dropdown-menu.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import AllCompaniesDropDownMenuContent from "@coreModule/clients/panel/private/sidebar/companies/allCompaniesDropDownMenuContent";
import {BasicCompanyInfoFormResponseType} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import SimpleError from "@coreModule/components/custom/errors/errorViewWrapper.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@coreModule/components/ui/avatar.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";

type CompaniesSwitcherProps = WithLanguageType & WithAxiosType<BasicCompanyInfoFormResponseType> & {};

function CompaniesSwitcher({
    data,
    loading,
    error,
    onFilterChange,
    resolveLanguageKey
}: CompaniesSwitcherProps) {

    const {read} = useAccess("companies");
    const newCompanyCreated = useSelector((state: RootState) => state.ui.newCompanyCreated);
    const [forceReload, setForceReload] = useState<number>(0);

    useEffect(() => {
        if( !!read && Object.keys(read).length ){
            onFilterChange({});
        }
    }, [newCompanyCreated, forceReload, read]);

    if( !read ){
        return <HiddenElement />
    }
    if( loading ){
        return <Loader />
    }
    if( error ){
        return (
            <SimpleError
                title={resolveLanguageKey("failTitle")}
                description={resolveLanguageKey("failTitleTooltip")}
                onClick={() => setForceReload(Date.now())}
            />
        )
    }
    if( !data ){
        return <></>
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <ReloginProvider>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild >
                        <SidebarMenuButton
                            size='lg'
                            className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:cursor-pointer'
                        >
                            <div className='text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center'>
                                <HiddenElement>
                                    {
                                        read.logo &&
                                        <Avatar>
                                            <AvatarImage src={`/api/auxiliary/media/${data.logo}`} alt={data.name + "photo"} />
                                            <AvatarFallback className="text-foreground font-semibold">{data?.name.substring(0, 2)?.toUpperCase() ?? ""}</AvatarFallback>
                                        </Avatar>
                                    }
                                </HiddenElement>
                            </div>
                            <div className='grid flex-1 text-start text-sm leading-tight'>
                                <HiddenElement>
                                    {
                                        read.name &&
                                        <span className='truncate font-semibold'>
                                          {data.name}
                                        </span>
                                    }
                                </HiddenElement>
                                <HiddenElement>
                                    {
                                        read.description &&
                                        <span className='truncate text-xs'>
                                          {data.description}
                                        </span>
                                    }
                                </HiddenElement>
                            </div>
                            <div className="ms-auto">
                                <ChevronsUpDown className="size-4" />
                            </div>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <AllCompaniesDropDownMenuContent listReloadKey={newCompanyCreated} />
                </DropdownMenu>
                </ReloginProvider>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/sidebar/companies/index.tsx"),
    withAxios(
        {
            method: "get",
            url: `/api/company/basicInfo`,
            data: {}
        },
        true
    ),
    withDebug(true, true, "companies")
)(CompaniesSwitcher);


