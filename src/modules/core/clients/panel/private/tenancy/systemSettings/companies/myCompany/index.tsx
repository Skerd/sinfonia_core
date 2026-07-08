import {compose} from "redux";
import {useEffect, useState} from "react";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import CompanyCard from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/cardView/companyCard.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Loader from "@coreModule/components/custom/loader.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {Company} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";

type MyCompanyProps = WithLanguageType & WithAxiosType<Company> & {
    companyId?: string
}
function MyCompany({
    data,
    loading,
    error,
    onFilterChange,
    resolveLanguageKey
}: MyCompanyProps){

    const {read} = useAccess("companies");

    const [forceReload, setForceReload] = useState<number>(1);
    useEffect(() => {
        if( !read ) return;
        onFilterChange({});
    }, [forceReload, read]);

    if( !read ){
        return <HiddenElement />
    }
    if( loading ){
        return (
            <Loader />
        )
    }
    if( error || !data ){
        return (
            <SimpleError
                title={resolveLanguageKey("failTitle")}
                description={resolveLanguageKey("failTitleTooltip")}
                onClick={() => setForceReload(Date.now())}
            />
        )
    }

    return (
        <div className="flex justify-center items-center w-full">
            <CompanyCard single={true} company={data} overrideCompanyId={data._id} />
        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/companies/myCompany/index.tsx"),
    withAxios(
        {
            url: "/api/company",
            method: "get",
            data: {},
            addToHeader: [{
                whatToGet: "companyId",
                whereToPut: "x-company-id"
            }]
        },
        true
    ),
    withDebug(true, true)
)(MyCompany);