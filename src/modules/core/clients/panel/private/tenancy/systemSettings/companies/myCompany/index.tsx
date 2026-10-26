import {compose} from "redux";
import {useEffect, useState} from "react";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import CompanyCard from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/cardView/companyCard.tsx";
import CompanyModulesList from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/myCompany/companyModulesList.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import SimpleError from "@coreModule/components/custom/errors/errorViewWrapper.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import Header from "@coreModule/components/custom/header.tsx";
import {readPageHelp} from "@coreModule/components/custom/pageHelp.tsx";
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
        <div className="flex min-w-0 flex-col gap-4">
            <Header
                title={resolveLanguageKey("title")}
                description={resolveLanguageKey("description")}
                help={readPageHelp(resolveLanguageKey)}
            />
            <div className="flex w-full flex-col items-center justify-center gap-4 pt-1">
                <CompanyCard single={true} company={data} overrideCompanyId={data._id} />
                {data.modules ? <CompanyModulesList modules={data.modules} /> : null}
            </div>
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
    withDebug(true, true, "companies")
)(MyCompany);