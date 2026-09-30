import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {BasicCompanyInfoFormResponseType} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";
import {Avatar, AvatarFallback, AvatarImage} from "@coreModule/components/ui/avatar.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import {useRelogin} from "@coreModule/helpers/hooks/useRelogin.ts";

type SmallCompanyWithReLoginProps = {
    company: BasicCompanyInfoFormResponseType,
}

function SmallCompanyWithReLogin({company}: SmallCompanyWithReLoginProps){
    const {read} = useAccess("companies");
    const {triggerRelogin} = useRelogin();

    function reLoginWithDifferentCompany(){
        triggerRelogin(company._id);
    }

    return(
        <DropdownMenuItem
            key={"generated_company_content_" + company._id}
            onClick={(e) => {e.preventDefault(); e.stopPropagation(); reLoginWithDifferentCompany();}}
            className='gap-2 p-2'
        >
            <div className='flex items-center justify-center'>
                <HiddenElement>
                    {
                        read.logo &&
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
                        read.name &&
                        <p className='truncate font-semibold'>
                          {company.name}
                        </p>
                    }
                </HiddenElement>
                <HiddenElement>
                    {
                        read.description &&
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