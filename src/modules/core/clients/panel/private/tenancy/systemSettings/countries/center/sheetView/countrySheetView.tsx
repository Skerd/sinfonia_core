import {compose} from "redux";
import {useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {Country} from "armonia/src/modules/core/api/auxiliary/private/country/country.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import ViewStates from "@coreModule/clients/panel/private/tenancy/systemSettings/countries/center/actions/viewStates.tsx";
import ViewCities from "@coreModule/clients/panel/private/tenancy/systemSettings/countries/center/actions/viewCities.tsx";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";

export type CountrySheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Full row or bootstrap from `#SmallInfoCard` while `/single` loads. */
    country?: Country;
    hideActions?: boolean;
    onDelete?: (response?: DeletedData) => void;
    onRestore?: () => void;
    isRestored?: boolean;
    fetchId?: string;
};

function countryEditPath(country: Country) {
    const params = new URLSearchParams();
    params.set("countryId", country._id);
    if (country.name) params.set("countryName", country.name);
    return `/tenancy/systemSettings/countries/edit?${params.toString()}`;
}

function CountrySheetView({
    open,
    onOpenChange,
    country: countryProp,
    resolveLanguageKey,
    hideActions = false,
    onDelete = () => {},
    onRestore = () => {},
    fetchId,
}: CountrySheetViewOwnProps & WithLanguageType) {
    const access = useAccess("countries");
    const {read: readState} = useAccess("states");
    const {read: readCity} = useAccess("cities");
    const viewConfig = useViewConfig("countries", "sheet");
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(countryProp || {_id: fetchId});

    useEffect(() => {
        if (!countryProp) return;
        setSheetData(countryProp);
    }, [countryProp]);

    const entityId = countryProp?._id ?? fetchId;
    const asCountry = sheetData as Country;

    if (!viewConfig) {
        return null;
    }
    if (!entityId) {
        return null;
    }

    return (
        <SheetViewRenderer
            config={viewConfig}
            data={sheetData}
            url="/api/auxiliary/country/single"
            fetchId={fetchId}
            onDataFetched={(data) => setSheetData(data)}
            open={open}
            onOpenChange={onOpenChange}
            resolveLanguageKey={resolveLanguageKey}
            access={access}
            hideActions={hideActions}
            onDelete={onDelete}
            onRestore={onRestore}
            editPath={countryEditPath(asCountry)}
            actionMenuChildren={
                <>
                    {readState && <ViewStates countryId={asCountry._id} countryName={asCountry.name} />}
                    {readCity && <ViewCities countryId={asCountry._id} countryName={asCountry.name} />}
                </>
            }
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/countries/center/sheetView/countrySheetView.tsx"),
    withDebug(true, true)
)(CountrySheetView);
