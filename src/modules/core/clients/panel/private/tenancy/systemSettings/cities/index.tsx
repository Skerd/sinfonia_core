import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {City} from "armonia/src/modules/core/api/auxiliary/private/city/city.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import {IconBuildingPlus} from "@tabler/icons-react";
import {buildTitleBreadcrumb} from "@coreModule/helpers/general";
import CityCard from "@coreModule/clients/panel/private/tenancy/systemSettings/cities/center/cardView/cityCard.tsx";
import CitySheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/cities/center/sheetView/citySheetView.tsx";
import EntityListPage from "@coreModule/components/entityPage/EntityListPage.tsx";

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
    countryId?: string;
    countryName?: string;
    stateId?: string;
    stateName?: string;
};

function AllCities({
    resolveLanguageKey,
    stateId,
    stateName,
    countryId,
    countryName,
}: AllCitiesProps) {

    const headerTitle = buildTitleBreadcrumb(resolveLanguageKey("title") as string, [countryName, stateName]);

    const extraParams = {
        country: countryId ?? undefined,
        state: stateId ?? undefined,
    };

    return (
        <EntityListPage<City>
            apiUrl="/api/auxiliary/city"
            collectionName="cities"
            accessModel="cities"
            tableConfigKey="cities"
            createPath={buildCitiesCreatePath(countryId, countryName, stateId, stateName)}
            createIcon={<IconBuildingPlus />}
            createLanguageKey="createCity"
            buildEditPath={(city) => cityEditPath(countryId, countryName, stateId, stateName, city)}
            resolveLanguageKey={resolveLanguageKey}
            headerTitle={headerTitle}
            cardViewClassName="grid grid-cols-1 gap-2 lg:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            configurations={{limit: 200}}
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
            extraParams={extraParams}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/cities/index.tsx"),
    withDebug(true, true)
)(AllCities);
