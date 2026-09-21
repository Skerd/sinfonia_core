import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@baseModule/helpers/hocs/withDebug.tsx";
import {memo, type RefObject} from "react";
import {State} from "armonia/src/modules/core/api/auxiliary/private/state/state.dto.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Tag} from "lucide-react";
import EntityCardRow from "@baseModule/components/entityPage/list/card/entityCardRow.tsx";
import DisplayValue from "@baseModule/components/viewEngine/widgets/display/displayValue.tsx";
import StateSheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/states/center/sheetView/stateSheetView.tsx";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import ViewCities from "@coreModule/clients/panel/private/tenancy/systemSettings/states/center/actions/viewCities.tsx";
import {IconFlag} from "@tabler/icons-react";
import {stateEditPath} from "@coreModule/clients/panel/private/tenancy/systemSettings/states";
import EntityCard from "@baseModule/components/entityPage/list/card/entityCard.tsx";
import type {WithAxiosLifecycleRef} from "@baseModule/helpers/hocs/withAxios.tsx";

type StateCardProps = WithLanguageType & {
    countryId?: string;
    countryName?: string;
    state: State;
    fetchId?: string;
    hideActions?: boolean;
    onDelete?: (deleted?: State, response?: DeletedData) => void;
    onRestore?: () => void;
    sheetOnly?: boolean;
    innerRef?: RefObject<WithAxiosLifecycleRef<State> | null>;
};

const StateCard = memo(function StateCard({
    countryId,
    countryName,
    state,
    resolveLanguageKey,
    fetchId,
    hideActions,
    onDelete,
    onRestore,
    sheetOnly = false,
    innerRef,
}: StateCardProps) {
    return (
        <EntityCard
            resource="states"
            entity={state}
            fetchId={fetchId}
            singleUrl="/api/auxiliary/state/single"
            onDelete={onDelete}
            onRestore={onRestore}
            hideActions={hideActions}
            sheetOnly={sheetOnly}
            editPath={(row) =>
                stateEditPath(countryId ?? row.country?._id, countryName ?? row.country?.name, row)
            }
            Sheet={StateSheetView}
            sheetEntityProp="state"
            deleteUrl="/api/auxiliary/state"
            restoreUrl="/api/auxiliary/state/restore"
            failedTitle={String(resolveLanguageKey("failedTitle"))}
            failedDescription={String(resolveLanguageKey("failedDescription"))}
            titlePath="name"
            innerRef={innerRef}
            sheetProps={({entity}) => ({
                countryId: countryId ?? entity.country?._id,
                countryName: countryName ?? entity.country?.name,
            })}
        >
            {({entity}) => {
                return (
                    <>
                        <EntityCard.Header titlePath="name" title={entity.name}>
                            <ViewCities
                                countryId={countryId ?? entity.country?._id}
                                countryName={countryName ?? entity.country?.name}
                                stateId={entity._id}
                                stateName={entity.name}
                            />
                        </EntityCard.Header>
                        <EntityCard.Body>
                            <EntityCardRow
                                icon={Tag}
                                label={resolveLanguageKey("code")}
                                tooltip={resolveLanguageKey("code")}
                                path="code"
                                value={entity.code}
                            >
                                {(formatted) => (
                                    <Badge variant="secondary" className="text-xs font-normal">
                                        {formatted}
                                    </Badge>
                                )}
                            </EntityCardRow>
                            <EntityCardRow
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
                );
            }}
        </EntityCard>
    );
});

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/states/center/cardView/stateCard.tsx"),
    withDebug(true, true, "states")
)(StateCard);
