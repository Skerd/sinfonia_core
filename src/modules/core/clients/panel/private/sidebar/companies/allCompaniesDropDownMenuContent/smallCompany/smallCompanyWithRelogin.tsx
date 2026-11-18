import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {BasicCompanyInfoFormResponseType} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";
import {Avatar, AvatarFallback, AvatarImage} from "@coreModule/components/ui/avatar.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useRelogin} from "@coreModule/helpers/hooks/useRelogin.ts";
import {useSelector} from "react-redux";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";

type SmallCompanyWithReLoginProps = {
    company: BasicCompanyInfoFormResponseType,
}

function SmallCompanyWithReLogin({company}: SmallCompanyWithReLoginProps){
    // Basic info of the caller's own companies, as /api/companies/basicInfo returns it to any member.
    const {triggerRelogin} = useRelogin();
    const currentCompanyId = useSelector((state: RootState) => state.authentication.user?.company?._id);

    function reLoginWithDifferentCompany(){
        triggerRelogin(company._id);
    }

    return(
        <DropdownMenuItem
            key={"generated_company_content_" + company._id}
            onClick={(e) => {
                // The current company has nothing to switch to, so the menu closes: the user's only sign the click landed.
                if (company._id === currentCompanyId) return;
                e.preventDefault(); e.stopPropagation(); reLoginWithDifferentCompany();
            }}
            className='gap-2 p-2'
        >
            <div className='flex items-center justify-center'>
                <HiddenElement>
                    {
                        company.logo &&
                        <Avatar>
                            <AvatarImage src={`/api/auxiliary/media/${company.logo}`} alt={company.name + "photo"} />
                            <AvatarFallback className="text-foreground font-semibold">{company?.name.substring(0, 2)?.toUpperCase() ?? ""}</AvatarFallback>
                        </Avatar>
                    }
                </HiddenElement>
            </div>
            <div className='grid flex-1 text-start text-sm leading-tight'>
                <HiddenElement>
                    {
                        company.name &&
                        <p className='truncate font-semibold'>
                          {company.name}
                        </p>
                    }
                </HiddenElement>
                <HiddenElement>
                    {
                        company.description &&
                        <p className='truncate text-xs'>
                            {company.description}
                        </p>
                    }
                </HiddenElement>
            </div>
        </DropdownMenuItem>
    )
}

export default SmallCompanyWithReLogin;