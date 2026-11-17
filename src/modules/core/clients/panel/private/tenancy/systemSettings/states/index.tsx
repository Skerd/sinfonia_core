import {useMemo} from "react";
import {useSearchParams} from "react-router-dom";
import {pendingScopeFilterId, quickOrScopeLabel, quickOrScopeParam, type ScopeQuickFilter} from "@coreModule/helpers/filter/filterUrl.ts";
import {usePromoteScopeToQuickFilters} from "@coreModule/helpers/filter/usePromoteScopeToQuickFilters.ts";
import {COLUMN_TYPE} from "armonia/src/modules/core/database/filter/typeOperators";
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {State} from "armonia/src/modules/core/api/auxiliary/private/state/state.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import {IconMapPlus} from "@tabler/icons-react";
import {buildPageTitle} from "@coreModule/helpers/general/pageTitle.ts";
import StateCard from "@coreModule/clients/panel/private/tenancy/systemSettings/states/center/cardView/stateCard.tsx";
import ViewCities from "@coreModule/clients/panel/private/tenancy/systemSettings/states/center/actions/viewCities.tsx";
import StateSheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/states/center/sheetView/stateSheetView.tsx";
import EntityListPage, {EntityListCreateButton, EntityListHeader, type QuickFilterDef} from "@coreModule/components/entityPage/pages/entityListPage.tsx";

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
    /** Read from the URL below; kept for the route that passes them. */
    countryId?: string;
    countryName?: string;
};

/** "View states" on a country scopes this list; the scope becomes a quick filter: named, shown and clearable (TD-F109). */
const STATE_LIST_SCOPES: readonly ScopeQuickFilter[] = [{field: "country", idParam: "countryId", nameParam: "countryName"}];

function AllStates({resolveLanguageKey}: AllStatesProps) {
    const [searchParams] = useSearchParams();
    usePromoteScopeToQuickFilters(STATE_LIST_SCOPES);
    const countryId = quickOrScopeParam(searchParams, "country", "countryId") || undefined;
    const countryName = quickOrScopeLabel(searchParams, "country", "countryName") || undefined;
    const pendingCountryId = pendingScopeFilterId(searchParams, "country", "countryId");
    const quickFilters = useMemo<QuickFilterDef[]>(() => [
        {field: "country", label: resolveLanguageKey("country"), type: COLUMN_TYPE.OBJECT_ID, apiUrl: "/api/auxiliary/country/select"},
    ], [resolveLanguageKey]);

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
            header={(ctx) => (
                <EntityListHeader ctx={ctx} title={buildPageTitle(resolveLanguageKey("title"), [countryName])}>
                    <EntityListCreateButton
                        ctx={ctx}
                        path={buildStatesCreatePath(countryId, countryName)}
                        icon={<IconMapPlus />}
                        labelKey="createState"
                    />
                </EntityListHeader>
            )}
            buildEditPath={(state) => stateEditPath(countryId, countryName, state)}
            resolveLanguageKey={resolveLanguageKey}
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
            extraFilters={pendingCountryId ? {country: pendingCountryId} : undefined}
            quickFilters={quickFilters}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/states/index.tsx"),
    withDebug(true, true, "states")
)(AllStates);
