import {compose} from "redux";
import {useCallback, useState} from "react";
import SmallCompanyWithReLogin from "@coreModule/clients/panel/private/sidebar/companies/allCompaniesDropDownMenuContent/smallCompany/smallCompanyWithRelogin.tsx";
import {BasicCompanyInfoFormResponseType} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";
import {TableResponse} from "armonia/src/modules/core/types/shared.types.ts";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import SimpleError from "@coreModule/components/custom/errors/errorViewWrapper.tsx";
import NoData from "@coreModule/components/custom/noData.tsx";
import InfiniteList, {type InfiniteListFilter} from "@coreModule/components/custom/infiniteList";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

const PAGE_SIZE = 200;

const COMPANIES_REQUEST = {
    method: "post" as const,
    url: "/api/companies/basicInfo",
    data: {},
};

type CompanyDropDownItemsProps = WithLanguageType & {
    forceReload: number;
}

function CompanyDropDownItems({
    forceReload,
    resolveLanguageKey
}: CompanyDropDownItemsProps) {

    const {read} = useAccess("companies");
    const [request, setRequest] = useState({body: {} as Record<string, unknown>, count: 0});
    const onFilterChange = useCallback((filter: InfiniteListFilter) => {
        setRequest((prev) => ({body: filter, count: prev.count + 1}));
    }, []);

    const {data, loading, error} = useHttpRequest<TableResponse<BasicCompanyInfoFormResponseType>>(
        COMPANIES_REQUEST,
        request.body,
        request.count,
        true,
        {},
        {resolveLanguageKey},
    );

    if( !read ){
        return <HiddenElement />
    }

    return (
        <InfiniteList<BasicCompanyInfoFormResponseType>
            data={data}
            loading={loading || request.count === 0}
            error={error}
            onFilterChange={onFilterChange}
            limit={PAGE_SIZE}
            forceReload={forceReload}
            scrollRootClassName="min-h-0 flex-1 overflow-y-auto"
            renderItem={(company) => (
                <SmallCompanyWithReLogin company={company} />
            )}
            renderError={({onRetry}) => (
                <SimpleError
                    title={resolveLanguageKey("failTitle")}
                    description={resolveLanguageKey("failTitleTooltip")}
                    onClick={onRetry}
                />
            )}
            renderNoData={() => <NoData title={resolveLanguageKey("noData")} />}
        />
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/sidebar/companies/allCompaniesDropDownMenuContent/companyDropDownItems.tsx"),
    withDebug(true, true, "companies")
)(CompanyDropDownItems);
