import {compose} from "redux";
import {useEffect, useState} from "react";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import CompanyCard, {companyEditPath} from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/cardView/companyCard.tsx";
import {Link} from "react-router-dom";
import {IconEdit} from "@tabler/icons-react";
import {Button} from "@coreModule/components/ui/button.tsx";
import CompanyModulesList from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/myCompany/companyModulesList.tsx";
import ErasePersonSection from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/myCompany/erasePersonSection.tsx";
import {useSelector} from "react-redux";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
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

    const {read, write} = useAccess("companies");
    // Only for this company's admins, and only when one of its modules can erase a person (D57); the server checks too.
    const canErasePeople = useSelector((state: RootState) => state.authentication.user.canErasePeople);

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
            >
                {/* Edit in plain sight, not only behind the card's hover menu (TD-F127). */}
                {write ? (
                    <Button asChild variant="outline" size="sm">
                        <Link to={companyEditPath(data)}><IconEdit className="size-4" aria-hidden />{resolveLanguageKey("edit")}</Link>
                    </Button>
                ) : null}
            </Header>
            <div className="flex w-full flex-col items-center justify-center gap-4 pt-1">
                <CompanyCard single={true} company={data} overrideCompanyId={data._id} />
                {data.modules ? <CompanyModulesList modules={data.modules} /> : null}
                {canErasePeople ? <ErasePersonSection modules={data.modules ?? []} /> : null}
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