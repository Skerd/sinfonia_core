import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@baseModule/helpers/hocs/withDebug.tsx";
import {Country} from "armonia/src/modules/core/api/auxiliary/private/country/country.dto.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import TooltipDisplayer from "@baseModule/components/custom/tooltipDisplayer.tsx";
import {Phone, Tag} from "lucide-react";
import EntityCardRow from "@baseModule/components/entityPage/list/card/entityCardRow.tsx";
import DisplayValue from "@baseModule/components/viewEngine/widgets/display/displayValue.tsx";
import CountrySheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/countries/center/sheetView/countrySheetView.tsx";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import ViewStates from "@coreModule/clients/panel/private/tenancy/systemSettings/countries/center/actions/viewStates.tsx";
import ViewCities from "@coreModule/clients/panel/private/tenancy/systemSettings/countries/center/actions/viewCities.tsx";
import EntityCard from "@baseModule/components/entityPage/list/card/entityCard.tsx";
import type {WithAxiosLifecycleRef} from "@baseModule/helpers/hocs/withAxios.tsx";
import type {ReactNode, RefObject} from "react";

function countryEditPath(country: Country) {
    const params = new URLSearchParams();
    params.set("countryId", country._id);
    if (country.name) params.set("countryName", country.name);
    return `/tenancy/systemSettings/countries/edit?${params.toString()}`;
}

type CountryCardProps = WithLanguageType & {
    country: Country;
    fetchId?: string;
    hideActions?: boolean;
    onDelete?: (deletedCountry?: Country, response?: DeletedData) => void;
    onRestore?: () => void;
    sheetOnly?: boolean;
    innerRef?: RefObject<WithAxiosLifecycleRef<Country> | null>;
};

function CountryCard({
    country,
    resolveLanguageKey,
    fetchId,
    hideActions,
    onDelete,
    onRestore,
    sheetOnly = false,
    innerRef,
}: CountryCardProps) {
    return (
        <EntityCard
            resource="countries"
            entity={country}
            fetchId={fetchId}
            singleUrl="/api/auxiliary/country/single"
            onDelete={onDelete}
            onRestore={onRestore}
            hideActions={hideActions}
            sheetOnly={sheetOnly}
            editPath={countryEditPath}
            Sheet={CountrySheetView}
            sheetEntityProp="country"
            deleteUrl="/api/auxiliary/country"
            restoreUrl="/api/auxiliary/country/restore"
            failedTitle={String(resolveLanguageKey("failedTitle"))}
            failedDescription={String(resolveLanguageKey("failedDescription"))}
            titlePath="name"
            innerRef={innerRef}
        >
            {({entity}) => (
                <>
                    <EntityCard.Header
                        titlePath="name"
                        title={entity.name}
                        icon={
                            <DisplayValue path="code" type="flag" value={entity.code}>
                                {(formatted: ReactNode) => (
                                    <TooltipDisplayer tooltip={resolveLanguageKey("flag")}>
                                        {formatted}
                                    </TooltipDisplayer>
                                )}
                            </DisplayValue>
                        }
                    >
                        <ViewStates countryId={entity._id} countryName={entity.name} />
                        <ViewCities countryId={entity._id} countryName={entity.name} />
                    </EntityCard.Header>
                    <EntityCard.Body>
                        <EntityCardRow
                            icon={Tag}
                            label={resolveLanguageKey("code")}
                            tooltip={resolveLanguageKey("code")}
                            path="code"
                            value={entity.code}
                        >
                            {(formatted) => (<Badge variant="secondary">{formatted}</Badge>)}
                        </EntityCardRow>
                        <EntityCardRow
                            icon={Phone}
                            label={resolveLanguageKey("phoneCode")}
                            tooltip={resolveLanguageKey("phoneCode")}
                            path="phoneCode"
                            type="phoneCode"
                            value={entity.phoneCode}
                        />
                    </EntityCard.Body>
                </>
            )}
        </EntityCard>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/countries/center/cardView/countryCard.tsx"),
    withDebug(true, true, "countries")
)(CountryCard);
