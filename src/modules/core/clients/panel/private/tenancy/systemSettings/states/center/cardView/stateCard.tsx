import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {useEffect, useImperativeHandle, useState, memo} from "react";
import {State} from "armonia/src/modules/core/api/auxiliary/private/state/state.dto.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import DeletedInfo from "@coreModule/components/custom/deletedInfo";
import CountryFlag from "@coreModule/components/custom/countryFlag.tsx";
import {Tag} from "lucide-react";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import InfoRow from "@coreModule/components/custom/infoRow.tsx";
import {InfoRowGroup} from "@coreModule/components/custom/infoRowGroup.tsx";
import StateSheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/states/center/sheetView/stateSheetView.tsx";
import DeleteAction from "@coreModule/components/custom/actions/deleteAction.tsx";
import type {DeletedData, SingleForm} from "armonia/src/modules/core/types/shared.types.ts";
import RestoreAction from "@coreModule/components/custom/actions/restoreAction.tsx";
import ActionMenu from "@coreModule/components/custom/actions/menu/actionMenu.tsx";
import ViewCities from "@coreModule/clients/panel/private/tenancy/systemSettings/states/center/actions/viewCities.tsx";
import {IconFlag} from "@tabler/icons-react";
import {stateEditPath} from "@coreModule/clients/panel/private/tenancy/systemSettings/states";
import {useEntityCard} from "@coreModule/helpers/hooks/useEntityCard.ts";
import {EntityCardShell} from "@coreModule/components/custom/cards/EntityCardShell.tsx";
import {EntityTextCardHeader} from "@coreModule/components/custom/cards/EntityTextCardHeader.tsx";
import {EntityCardFetchGuard} from "@coreModule/components/custom/cards/EntityCardFetchGuard.tsx";
import {CARD_BODY_CLASS} from "@coreModule/components/custom/cards/entityCard.constants.ts";

type StateCardProps = WithLanguageType &
    WithAxiosType<State, SingleForm> & {
        countryId?: string;
        countryName?: string;
        state: State;
        fetchId?: string;
        hideActions?: boolean;
        onDelete?: (deleted?: State, response?: DeletedData) => void;
        onRestore?: () => void;
        sheetOnly?: boolean;
        small?: boolean;
    };

const StateCard = memo(function StateCard({
    countryId,
    countryName,
    state: stateProp,
    resolveLanguageKey,
    fetchId,
    onFilterChange,
    loading,
    error,
    innerRef,
    hideActions,
    onDelete: onDeleteProp,
    onRestore: onRestoreProp,
    sheetOnly = false,
}: StateCardProps) {
    const {
        action,
        setAction,
        entity: state,
        setEntity: setState,
        hideAfterDeletion,
        onDelete,
        onRestore,
    } = useEntityCard({
        entityProp: stateProp,
        onDeleteProp,
        onRestoreProp,
        syncPropOnChange: !fetchId,
    });
    const [forceReload, setForceReload] = useState(1);

    const {read, restore} = useAccess("states");
    const {read: readCity} = useAccess("cities");

    const cid = countryId ?? state.country?._id;
    const cname = countryName ?? state.country?.name;

    useEffect(() => {
        if (fetchId) {
            onFilterChange({_id: fetchId});
        }
    }, [fetchId, forceReload]);

    useImperativeHandle(innerRef, () => ({
        success: (data) => {
            setState(data);
        },
    }));

    if (hideAfterDeletion || !restore) {
        return <></>;
    }
    if (!read || !Object.keys(read).length) {
        return <HiddenElement />;
    }

    return (
        <EntityCardFetchGuard
            fetchId={fetchId}
            loading={loading}
            error={error}
            failedTitle={resolveLanguageKey("failedTitle")}
            failedDescription={resolveLanguageKey("failedDescription")}
            onRetry={() => setForceReload((n) => n + 1)}
        >
            <>
                {!sheetOnly && (
                    <EntityCardShell onClick={() => setAction("view")}>
                        <div className="flex w-full items-stretch">
                            {(read.deletedBy || read.deletedAt) && (
                                <DeletedInfo deletedAt={state.deletedAt} deletedBy={state.deletedBy} />
                            )}
                            <div className="w-full min-w-0">
                                <EntityTextCardHeader
                                    title={state.name ? state.name : <ValueNotSet />}
                                    showTitle={!!read?.name}
                                    hideActions={hideActions}
                                    actionMenu={
                                        <ActionMenu
                                            accessModel="states"
                                            deletedData={state}
                                            onAction={(a: string) => setAction(a)}
                                            editPath={stateEditPath(cid, cname, state)}
                                        >
                                            {readCity && cid && cname && state.name && (
                                                <ViewCities
                                                    countryId={cid}
                                                    countryName={cname}
                                                    stateId={state._id}
                                                    stateName={state.name}
                                                />
                                            )}
                                        </ActionMenu>
                                    }
                                />
                                <div className={CARD_BODY_CLASS}>
                                    <InfoRowGroup>
                                        <InfoRow
                                            icon={Tag}
                                            label={resolveLanguageKey("code")}
                                            tooltip={resolveLanguageKey("code")}
                                            show={!!read?.code}
                                            value={
                                                state.code != null && state.code !== "" ? (
                                                    <Badge variant="secondary" className="text-xs font-normal">
                                                        {state.code}
                                                    </Badge>
                                                ) : null
                                            }
                                        />
                                        <InfoRow
                                            label={resolveLanguageKey("country")}
                                            icon={IconFlag}
                                            show={!!read?.country}
                                            value={
                                                state.country ? (
                                                    <div className="flex items-center gap-x-1.5">
                                                        {read?.country?.keys?.code ? (
                                                            <CountryFlag code={state.country.code} />
                                                        ) : null}
                                                        {read?.country?.keys?.name ? (
                                                            <p>{state.country.name}</p>
                                                        ) : null}
                                                    </div>
                                                ) : undefined
                                            }
                                        />
                                    </InfoRowGroup>
                                </div>
                            </div>
                        </div>
                    </EntityCardShell>
                )}

                {!!action && (
                    <>
                        {action === "view" && (
                            <StateSheetView
                                open={action === "view"}
                                onOpenChange={() => setAction("")}
                                state={state}
                                countryId={cid}
                                countryName={cname}
                                onDelete={onDelete}
                                onRestore={onRestore}
                            />
                        )}
                        {action === "delete" && (
                            <DeleteAction
                                accessModel="states"
                                deleteId={state._id}
                                openAlert={action === "delete"}
                                name={read?.name && state.name}
                                confirmName={read?.name && state.name}
                                onSuccess={onDelete}
                                onCancel={() => setAction("")}
                                url="/api/auxiliary/state"
                            />
                        )}
                        {action === "restore" && (
                            <RestoreAction
                                accessModel="states"
                                deleteId={state._id}
                                openAlert={action === "restore"}
                                name={read?.name && state.name}
                                confirmName={read?.name && state.name}
                                onSuccess={onRestore}
                                onCancel={() => setAction("")}
                                url="/api/auxiliary/state/restore"
                            />
                        )}
                    </>
                )}
            </>
        </EntityCardFetchGuard>
    );
});

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/states/center/cardView/stateCard.tsx"),
    withAxios<State, SingleForm>(
        {
            url: "/api/auxiliary/state/single",
            method: "POST",
            data: {},
        },
        true
    ),
    withDebug(true, true)
)(StateCard);
