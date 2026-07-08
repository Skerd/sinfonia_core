import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {State} from "armonia/src/modules/core/api/auxiliary/private/state/state.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import {IconMapPlus} from "@tabler/icons-react";
import {buildTitleBreadcrumb} from "@coreModule/helpers/general";
import StateCard from "@coreModule/clients/panel/private/tenancy/systemSettings/states/center/cardView/stateCard.tsx";
import ViewCities from "@coreModule/clients/panel/private/tenancy/systemSettings/states/center/actions/viewCities.tsx";
import StateSheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/states/center/sheetView/stateSheetView.tsx";
import EntityListPage from "@coreModule/components/entityPage/EntityListPage.tsx";

export function stateEditPath(countryId: string | undefined, countryName: string | undefined, state: State) {
    const params = new URLSearchParams();
    if (countryId) params.set("countryId", countryId);
    if (countryName) params.set("countryName", countryName);
    params.set("stateId", state._id);
    if (state.name) params.set("stateName", state.name);
    return `/tenancy/systemSettings/states/edit?${params.toString()}`;
}

function buildStatesCreatePath(countryId?: string, countryName?: string): string {
    const params = new URLSearchParams();
    if (countryId) params.set("countryId", countryId);
    if (countryName) params.set("countryName", countryName);
    const qs = params.toString();
    return `/tenancy/systemSettings/states/create${qs ? `?${qs}` : ""}`;
}

type AllStatesProps = WithLanguageType & {
    countryId?: string;
    countryName?: string;
};

function AllStates({resolveLanguageKey, countryId, countryName}: AllStatesProps) {

    const actionMenuChildren = (state: State) => {
        return (
            <ViewCities
                countryId={countryId ?? state.country?._id}
                countryName={countryName ?? state.country?.name}
                stateId={state._id}
                stateName={state.name}
            />
        );
    };

    return (
        <EntityListPage<State>
            apiUrl="/api/auxiliary/state"
            collectionName="states"
            accessModel="states"
            tableConfigKey="states"
            createPath={buildStatesCreatePath(countryId, countryName)}
            createIcon={<IconMapPlus />}
            createLanguageKey="createState"
            buildEditPath={(state) => stateEditPath(countryId, countryName, state)}
            resolveLanguageKey={resolveLanguageKey}
            headerTitle={buildTitleBreadcrumb(resolveLanguageKey("title"), [countryName])}
            cardViewClassName="grid grid-cols-1 gap-2 lg:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            renderCard={(state, onDelete, onRestore) => (
                <StateCard
                    countryId={countryId}
                    countryName={countryName}
                    state={state}
                    onDelete={(row: State | undefined, response?: DeletedData) => onDelete(row, response)}
                    onRestore={() => onRestore(state)}
                />
            )}
            renderActionMenuChildren={actionMenuChildren}
            renderSheet={({entity, open, onOpenChange, onDelete, onRestore}) => (
                <StateSheetView
                    open={open}
                    onOpenChange={(opened: boolean) => { if (!opened) onOpenChange(); }}
                    state={entity}
                    countryId={countryId ?? entity.country?._id}
                    countryName={countryName ?? entity.country?.name}
                    onDelete={onDelete}
                    onRestore={onRestore}
                />
            )}
            extraParams={countryId ? {country: countryId} : undefined}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/states/index.tsx"),
    withDebug(true, true)
)(AllStates);
