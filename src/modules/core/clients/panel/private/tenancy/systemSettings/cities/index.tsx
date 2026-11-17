import {useMemo} from "react";
import {useSearchParams} from "react-router-dom";
import {pendingScopeFilterId, quickOrScopeLabel, quickOrScopeParam, type ScopeQuickFilter} from "@coreModule/helpers/filter/filterUrl.ts";
import {usePromoteScopeToQuickFilters} from "@coreModule/helpers/filter/usePromoteScopeToQuickFilters.ts";
import {COLUMN_TYPE} from "armonia/src/modules/core/database/filter/typeOperators";
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {City} from "armonia/src/modules/core/api/auxiliary/private/city/city.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import {IconBuildingPlus} from "@tabler/icons-react";
import {buildPageTitle} from "@coreModule/helpers/general/pageTitle.ts";
import CityCard from "@coreModule/clients/panel/private/tenancy/systemSettings/cities/center/cardView/cityCard.tsx";
import CitySheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/cities/center/sheetView/citySheetView.tsx";
import EntityListPage, {EntityListCreateButton, EntityListHeader, type QuickFilterDef} from "@coreModule/components/entityPage/pages/entityListPage.tsx";

export function cityEditPath(countryId: string | undefined, countryName: string | undefined, stateId: string | undefined, stateName: string | undefined, city: City) {
    const params = new URLSearchParams();
    if (countryId) params.set("countryId", countryId);
    if (countryName) params.set("countryName", countryName);
    if (stateId) params.set("stateId", stateId);
    if (stateName) params.set("stateName", stateName);
    params.set("cityId", city._id);
    if (city.name) params.set("cityName", city.name);
    return `/tenancy/systemSettings/cities/edit?${params.toString()}`;
}

export function buildCitiesCreatePath(countryId?: string, countryName?: string, stateId?: string, stateName?: string): string {
    const params = new URLSearchParams();
    if (countryId) params.set("countryId", countryId);
    if (countryName) params.set("countryName", countryName);
    if (stateId) params.set("stateId", stateId);
    if (stateName) params.set("stateName", stateName);
    const qs = params.toString();
    return `/tenancy/systemSettings/cities/create${qs ? `?${qs}` : ""}`;
}

type AllCitiesProps = WithLanguageType & {
    /** Read from the URL below; kept for the route that passes them. */
    countryId?: string;
    countryName?: string;
    stateId?: string;
    stateName?: string;
};

/** "View cities" on a country or state scopes this list; each scope becomes a quick filter: named, shown and clearable (TD-F109). */
const CITY_LIST_SCOPES: readonly ScopeQuickFilter[] = [
    {field: "country", idParam: "countryId", nameParam: "countryName"},
    {field: "state", idParam: "stateId", nameParam: "stateName"},
];

function AllCities({resolveLanguageKey}: AllCitiesProps) {
    const [searchParams] = useSearchParams();
    usePromoteScopeToQuickFilters(CITY_LIST_SCOPES);
    const countryId = quickOrScopeParam(searchParams, "country", "countryId") || undefined;
    const countryName = quickOrScopeLabel(searchParams, "country", "countryName") || undefined;
    const stateId = quickOrScopeParam(searchParams, "state", "stateId") || undefined;
    const stateName = quickOrScopeLabel(searchParams, "state", "stateName") || undefined;
    const pendingCountryId = pendingScopeFilterId(searchParams, "country", "countryId");
    const pendingStateId = pendingScopeFilterId(searchParams, "state", "stateId");
    const quickFilters = useMemo<QuickFilterDef[]>(() => [
        {field: "country", label: resolveLanguageKey("country"), type: COLUMN_TYPE.OBJECT_ID, apiUrl: "/api/auxiliary/country/select"},
        {field: "state", label: resolveLanguageKey("state"), type: COLUMN_TYPE.OBJECT_ID, apiUrl: "/api/auxiliary/state/select", dependsOn: "country"},
    ], [resolveLanguageKey]);

    const headerTitle = buildPageTitle(resolveLanguageKey("title"), [countryName, stateName]);

    const extraFilters = useMemo(() => {
        if (!pendingCountryId && !pendingStateId) return undefined;
        return {
            ...(pendingCountryId ? {country: pendingCountryId} : {}),
            ...(pendingStateId ? {state: pendingStateId} : {}),
        };
    }, [pendingCountryId, pendingStateId]);

    return (
        <EntityListPage<City>
            apiUrl="/api/auxiliary/city"
            collectionName="cities"
            accessModel="cities"
            tableConfigKey="cities"
            header={(ctx) => (
                <EntityListHeader ctx={ctx} title={headerTitle}>
                    <EntityListCreateButton
                        ctx={ctx}
                        path={buildCitiesCreatePath(countryId, countryName, stateId, stateName)}
                        icon={<IconBuildingPlus />}
                        labelKey="createCity"
                    />
                </EntityListHeader>
            )}
            buildEditPath={(city) => cityEditPath(countryId, countryName, stateId, stateName, city)}
            resolveLanguageKey={resolveLanguageKey}
            cardViewClassName="grid grid-cols-1 gap-2 lg:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            configurations={{limit: 20}}
            extraFilters={extraFilters}
            quickFilters={quickFilters}
            renderCard={(city, onDelete, onRestore) => (
                <CityCard
                    countryId={countryId}
                    countryName={countryName}
                    stateId={stateId}
                    stateName={stateName}
                    city={city}
                    onDelete={(row: City | undefined, response?: DeletedData) => onDelete(row, response)}
                    onRestore={() => onRestore(city)}
                />
            )}
            renderSheet={({entity, open, onOpenChange, onDelete, onRestore}) => (
                <CitySheetView
                    open={open}
                    onOpenChange={(opened: boolean) => { if (!opened) onOpenChange(); }}
                    city={entity}
                    countryId={countryId ?? entity.country?._id}
                    countryName={countryName ?? entity.country?.name}
                    stateId={stateId ?? entity.state?._id}
                    stateName={stateName ?? entity.state?.name}
                    onDelete={onDelete}
                    onRestore={onRestore}
                />
            )}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/cities/index.tsx"),
    withDebug(true, true, "cities")
)(AllCities);
