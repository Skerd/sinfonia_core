import {compose} from "redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {BasicCompanyInfoFormResponseType} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";
import {Avatar, AvatarFallback, AvatarImage} from "@coreModule/components/ui/avatar.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";

type SmallCompanyProps = { company: BasicCompanyInfoFormResponseType, index: number}

function SmallCompany({company, index}: SmallCompanyProps){

    const {read} = useAccess("companies");

    return(
        <DropdownMenuItem
            key={"generated_company_content_" + company._id + "_" + index}
            className='gap-2 p-2'
        >
            <pre>
                {JSON.stringify(read, null, 2)}
            </pre>
            asdasd
            <div className='flex items-center justify-centerr'>
                <HiddenElement>
                    {
                        read.logo &&
                        <Avatar>
                            <AvatarImage src={`/api/auxiliary/media/${company.logo}`} alt={company.name + "photo"} />
                            <AvatarFallback className="text-black dark:text-white font-semibold">{company?.name.substring(0, 2)?.toUpperCase() ?? ""}</AvatarFallback>
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

export default compose(
    withDebug(true, true)
)(SmallCompany);