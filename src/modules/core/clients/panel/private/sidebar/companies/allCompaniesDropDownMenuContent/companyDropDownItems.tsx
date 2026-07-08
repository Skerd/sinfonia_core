import {compose} from "redux";
import SmallCompanyWithReLogin from "@coreModule/clients/panel/private/sidebar/companies/allCompaniesDropDownMenuContent/smallCompany/smallCompanyWithRelogin.tsx";
import {BasicCompanyInfoFormResponseType} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Loader from "@coreModule/components/custom/loader.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import NoData from "@coreModule/components/custom/noData.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {HttpError} from "@coreModule/helpers/hooks/useHttpRequest.ts";

type CompanyDropDownItemsProps = WithLanguageType & {
    data: BasicCompanyInfoFormResponseType[] | null;
    loading: boolean;
    error: HttpError | null;
    onRetry: () => void;
}

function CompanyDropDownItems({
    loading,
    error,
    data,
    onRetry,
    resolveLanguageKey
}: CompanyDropDownItemsProps) {

    const {read} = useAccess("companies");

    if( !read ){
        return <HiddenElement />
    }
    if( loading ){
        return (
            <Loader />
        )
    }
    if( error ){
        return (
            <SimpleError
                title={resolveLanguageKey("failTitle")}
                description={resolveLanguageKey("failTitleTooltip")}
                onClick={onRetry}
            />
        )
    }
    if(!data ){
        return (
            <NoData title={resolveLanguageKey("noData")} />
        )
    }

    return (
        <>
            {
                data.map( (company, index) => {
                    return (
                        <SmallCompanyWithReLogin key={company._id} index={index} company={company}/>
                    )
                })
            }
        </>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/sidebar/companies/allCompaniesDropDownMenuContent/companyDropDownItems.tsx"),
    withDebug(true, true)
)(CompanyDropDownItems);
