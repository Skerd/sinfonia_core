import {IconSearch} from "@tabler/icons-react";
import {compose} from "redux";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import SmallCompanyWithReLogin from "@coreModule/clients/panel/private/sidebar/companies/allCompaniesDropDownMenuContent/smallCompany/smallCompanyWithRelogin.tsx";
import {BasicCompanyInfoFormResponseType} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";
import {TableResponse} from "armonia/src/modules/core/types/shared.types.ts";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import SimpleError from "@coreModule/components/custom/errors/errorViewWrapper.tsx";
import NoData from "@coreModule/components/custom/noData.tsx";
import InfiniteList, {type InfiniteListFilter} from "@coreModule/components/custom/infiniteList";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {Input} from "@coreModule/components/ui/input.tsx";
import {DropdownMenuLabel} from "@coreModule/components/ui/dropdown-menu.tsx";

const PAGE_SIZE = 200;
const SEARCH_DEBOUNCE_MS = 300;

const COMPANIES_REQUEST = {
    method: "post" as const,
    url: "/api/companies/basicInfo",
    data: {},
};

type CompanyDropDownItemsProps = WithLanguageType & {
    forceReload: number;
    menuOpen: boolean;
    title: string;
}

function CompanyDropDownItems({
    forceReload,
    menuOpen,
    title,
    resolveLanguageKey
}: CompanyDropDownItemsProps) {

    const searchInputRef = useRef<HTMLInputElement>(null);
    const [searchText, setSearchText] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");
    const [request, setRequest] = useState({body: {} as Record<string, unknown>, count: 0});
    const onFilterChange = useCallback((filter: InfiniteListFilter) => {
        setRequest((prev) => ({body: filter, count: prev.count + 1}));
    }, []);

    useEffect(() => {
        if (!menuOpen) {
            setSearchText("");
            setAppliedSearch("");
            return;
        }
        searchInputRef.current?.focus();
    }, [menuOpen]);

    useEffect(() => {
        const handle = setTimeout(() => setAppliedSearch(searchText.trim()), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(handle);
    }, [searchText]);

    const extraParams = useMemo(
        () => (appliedSearch ? {name: appliedSearch} : {}),
        [appliedSearch],
    );

    const {data, loading, error} = useHttpRequest<TableResponse<BasicCompanyInfoFormResponseType>>(
        COMPANIES_REQUEST,
        request.body,
        request.count,
        true,
        {},
        {resolveLanguageKey},
    );


    const searchPlaceholder = resolveLanguageKey("searchPlaceholder");

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div role="presentation" className="shrink-0 -mx-1 -mt-1 border-b px-3 pt-2.5 pb-2.5" onKeyDown={(event) => event.stopPropagation()}>
                <DropdownMenuLabel className="px-0.5 py-0 pb-2.5">
                    {title}
                </DropdownMenuLabel>
                <div className="relative">
                    <IconSearch className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        ref={searchInputRef}
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                        placeholder={searchPlaceholder}
                        aria-label={searchPlaceholder}
                        autoComplete="off"
                        className="h-8 bg-background ps-8"
                    />
                </div>
            </div>
            <InfiniteList<BasicCompanyInfoFormResponseType>
                data={data}
                loading={loading || request.count === 0}
                error={error}
                onFilterChange={onFilterChange}
                extraParams={extraParams}
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
        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/sidebar/companies/allCompaniesDropDownMenuContent/companyDropDownItems.tsx"),
    withDebug(true, true, "companies")
)(CompanyDropDownItems);
