import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {Country} from "armonia/src/modules/core/api/auxiliary/private/country/country.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import {IconFlagPlus} from "@tabler/icons-react";
import CountryCard from "@coreModule/clients/panel/private/tenancy/systemSettings/countries/center/cardView/countryCard.tsx";
import ViewStates from "@coreModule/clients/panel/private/tenancy/systemSettings/countries/center/actions/viewStates.tsx";
import ViewCities from "@coreModule/clients/panel/private/tenancy/systemSettings/countries/center/actions/viewCities.tsx";
import EntityListPage from "@coreModule/components/entityPage/EntityListPage.tsx";

function countryEditPath(country: Country) {
    const params = new URLSearchParams();
    params.set("countryId", country._id);
    if (country.name) params.set("countryName", country.name);
    return `/tenancy/systemSettings/countries/edit?${params.toString()}`;
}

function AllCountries({resolveLanguageKey}: WithLanguageType) {

    const actionMenuChildren = (country: Country) => (
        <>
            <ViewStates countryId={country._id} countryName={country.name} />
            <ViewCities countryId={country._id} countryName={country.name} />
        </>
    );

    return (
        <EntityListPage<Country>
            apiUrl="/api/auxiliary/country"
            collectionName="countries"
            accessModel="countries"
            tableConfigKey="countries"
            createPath="/tenancy/systemSettings/countries/create"
            createIcon={<IconFlagPlus />}
            buildEditPath={countryEditPath}
            resolveLanguageKey={resolveLanguageKey}
            sheetLanguagePath="src/modules/core/clients/panel/private/tenancy/systemSettings/countries/center/sheetView/countrySheetView.tsx"
            cardViewClassName="grid grid-cols-1 gap-2 lg:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            renderCard={(country, onDelete, onRestore) => (
                <CountryCard
                    country={country}
                    onDelete={(row: Country | undefined, response?: DeletedData) => onDelete(row, response)}
                    onRestore={() => onRestore(country)}
                />
            )}
            renderActionMenuChildren={actionMenuChildren}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/countries/index.tsx"),
    withDebug(true, true)
)(AllCountries);
