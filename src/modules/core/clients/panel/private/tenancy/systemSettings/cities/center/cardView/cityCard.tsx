import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {memo, type RefObject} from "react";
import {City} from "armonia/src/modules/core/api/auxiliary/private/city/city.dto.ts";
import DisplayRow from "@coreModule/components/custom/displayValue/displayRow.tsx";
import DisplayValue from "@coreModule/components/custom/displayValue/displayValue.tsx";
import CitySheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/cities/center/sheetView/citySheetView.tsx";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import {IconFlag, IconGridDots} from "@tabler/icons-react";
import EntityCard from "@coreModule/components/custom/systemCards/entityCard.tsx";
import type {WithAxiosLifecycleRef} from "@coreModule/helpers/hocs/withAxios.tsx";

function cityEditPath(
    countryId: string | undefined,
    countryName: string | undefined,
    stateId: string | undefined,
    stateName: string | undefined,
    city: City
) {
    const params = new URLSearchParams();
    if (countryId) params.set("countryId", countryId);
    if (countryName) params.set("countryName", countryName);
    if (stateId) params.set("stateId", stateId);
    if (stateName) params.set("stateName", stateName);
    params.set("cityId", city._id);
    if (city.name) params.set("cityName", city.name);
    return `/tenancy/systemSettings/cities/edit?${params.toString()}`;
}

type CityCardProps = WithLanguageType & {
    countryId?: string;
    countryName?: string;
    stateId?: string;
    stateName?: string;
    city: City;
    fetchId?: string;
    hideActions?: boolean;
    onDelete?: (deleted?: City, response?: DeletedData) => void;
    onRestore?: () => void;
    sheetOnly?: boolean;
    innerRef?: RefObject<WithAxiosLifecycleRef<City> | null>;
};

const CityCard = memo(function CityCard({
    countryId,
    countryName,
    stateName,
    stateId,
    city,
    resolveLanguageKey,
    fetchId,
    hideActions,
    onDelete,
    onRestore,
    sheetOnly = false,
    innerRef,
}: CityCardProps) {
    return (
        <EntityCard
            resource="cities"
            entity={city}
            fetchId={fetchId}
            singleUrl="/api/auxiliary/city/single"
            onDelete={onDelete}
            onRestore={onRestore}
            hideActions={hideActions}
            sheetOnly={sheetOnly}
            editPath={(row) =>
                cityEditPath(
                    countryId ?? row.country?._id,
                    countryName ?? row.country?.name,
                    stateId ?? row.state?._id,
                    stateName ?? row.state?.name,
                    row,
                )
            }
            Sheet={CitySheetView}
            sheetEntityProp="city"
            deleteUrl="/api/auxiliary/city"
            restoreUrl="/api/auxiliary/city/restore"
            failedTitle={String(resolveLanguageKey("failedTitle"))}
            failedDescription={String(resolveLanguageKey("failedDescription"))}
            titlePath="name"
            innerRef={innerRef}
            sheetProps={({entity}) => ({
                countryId: countryId ?? entity.country?._id,
                countryName: countryName ?? entity.country?.name,
                stateId: stateId ?? entity.state?._id,
                stateName: stateName ?? entity.state?.name,
            })}
        >
            {({entity}) => (
                <>
                    <EntityCard.Header titlePath="name" title={entity.name} />
                    <EntityCard.Body>
                        <DisplayRow
                            icon={IconGridDots}
                            label={resolveLanguageKey("state")}
                            path="state"
                            value={entity.state?.name}
                        />
                        <DisplayRow
                            icon={IconFlag}
                            label={resolveLanguageKey("country")}
                            path="country"
                            value={
                                entity.country ? (
                                    <span className="flex items-center gap-x-1.5">
                                        <DisplayValue path="country.code" type="flag" value={entity.country.code} />
                                        <DisplayValue path="country.name" value={entity.country.name} />
                                    </span>
                                ) : null
                            }
                        />
                    </EntityCard.Body>
                </>
            )}
        </EntityCard>
    );
});

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/cities/center/cardView/cityCard.tsx"),
    withDebug(true, true, "cities")
)(CityCard);
