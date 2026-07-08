import {compose} from "redux";
import {useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {State} from "armonia/src/modules/core/api/auxiliary/private/state/state.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import ViewCities from "@coreModule/clients/panel/private/tenancy/systemSettings/states/center/actions/viewCities.tsx";
import {stateEditPath} from "@coreModule/clients/panel/private/tenancy/systemSettings/states";

export type StateSheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Full row or bootstrap from `#SmallInfoCard` while `/single` loads. */
    state?: State;
    countryId?: string;
    countryName?: string;
    hideActions?: boolean;
    onDelete?: (response?: DeletedData) => void;
    onRestore?: () => void;
    fetchId?: string;
};

function StateSheetView({
    open,
    onOpenChange,
    state: stateProp,
    countryId,
    countryName,
    resolveLanguageKey,
    hideActions = false,
    onDelete = () => {},
    onRestore = () => {},
    fetchId,
}: StateSheetViewOwnProps & WithLanguageType) {
    const access = useAccess("states");
    const {read: readCity} = useAccess("cities");
    const viewConfig = useViewConfig("states", "sheet");
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(stateProp || {_id: fetchId});

    useEffect(() => {
        if (!stateProp) return;
        setSheetData(stateProp);
    }, [stateProp]);

    const entityId = stateProp?._id ?? fetchId;
    const asState = sheetData as State;
    const cid = countryId ?? asState.country?._id;
    const cname = countryName ?? asState.country?.name;

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
            url="/api/auxiliary/state/single"
            fetchId={fetchId}
            onDataFetched={(data) => setSheetData(data)}
            open={open}
            onOpenChange={onOpenChange}
            resolveLanguageKey={resolveLanguageKey}
            access={access}
            hideActions={hideActions}
            onDelete={onDelete}
            onRestore={onRestore}
            editPath={stateEditPath(cid, cname, asState)}
            actionMenuChildren={
                readCity && cid && cname && asState.name ? (
                    <ViewCities countryId={cid} countryName={cname} stateId={asState._id} stateName={asState.name} />
                ) : null
            }
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/states/center/sheetView/stateSheetView.tsx"),
    withDebug(true, true)
)(StateSheetView);
