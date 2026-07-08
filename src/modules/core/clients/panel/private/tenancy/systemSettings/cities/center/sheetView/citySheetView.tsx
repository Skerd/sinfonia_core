import {compose} from "redux";
import {useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {City} from "armonia/src/modules/core/api/auxiliary/private/city/city.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";

export type CitySheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Full row or bootstrap from `#SmallInfoCard` while `/single` loads. */
    city?: City;
    countryId?: string;
    countryName?: string;
    stateId?: string;
    stateName?: string;
    hideActions?: boolean;
    onDelete?: (response?: DeletedData) => void;
    onRestore?: () => void;
    fetchId?: string;
};

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

function CitySheetView({
    open,
    onOpenChange,
    city: cityProp,
    countryId,
    countryName,
    stateId,
    stateName,
    resolveLanguageKey,
    hideActions = false,
    onDelete = () => {},
    onRestore = () => {},
    fetchId,
}: CitySheetViewOwnProps & WithLanguageType) {
    const access = useAccess("cities");
    const viewConfig = useViewConfig("cities", "sheet");
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(cityProp || {_id: fetchId});

    useEffect(() => {
        if (!cityProp) return;
        setSheetData(cityProp);
    }, [cityProp]);

    const entityId = cityProp?._id ?? fetchId;
    const city = sheetData as City;

    const cid = countryId ?? city.country?._id;
    const cname = countryName ?? city.country?.name;
    const sid = stateId ?? city.state?._id;
    const sname = stateName ?? city.state?.name;

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
            url="/api/auxiliary/city/single"
            fetchId={fetchId}
            onDataFetched={(data) => setSheetData(data)}
            open={open}
            onOpenChange={onOpenChange}
            resolveLanguageKey={resolveLanguageKey}
            access={access}
            hideActions={hideActions}
            onDelete={onDelete}
            onRestore={onRestore}
            editPath={cityEditPath(cid, cname, sid, sname, city)}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/cities/center/sheetView/citySheetView.tsx"),
    withDebug(true, true)
)(CitySheetView);
