import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {useEffect, useImperativeHandle, useState, memo} from "react";
import {City} from "armonia/src/modules/core/api/auxiliary/private/city/city.dto.ts";
import DeletedInfo from "@coreModule/components/custom/deletedInfo";
import CountryFlag from "@coreModule/components/custom/countryFlag.tsx";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import CitySheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/cities/center/sheetView/citySheetView.tsx";
import DeleteAction from "@coreModule/components/custom/actions/deleteAction.tsx";
import type {DeletedData, SingleForm} from "armonia/src/modules/core/types/shared.types.ts";
import RestoreAction from "@coreModule/components/custom/actions/restoreAction.tsx";
import ActionMenu from "@coreModule/components/custom/actions/menu/actionMenu.tsx";
import InfoRow from "@coreModule/components/custom/infoRow.tsx";
import {InfoRowGroup} from "@coreModule/components/custom/infoRowGroup.tsx";
import {IconFlag, IconGridDots} from "@tabler/icons-react";
import {useEntityCard} from "@coreModule/helpers/hooks/useEntityCard.ts";
import {EntityCardShell} from "@coreModule/components/custom/cards/EntityCardShell.tsx";
import {EntityTextCardHeader} from "@coreModule/components/custom/cards/EntityTextCardHeader.tsx";
import {EntityCardFetchGuard} from "@coreModule/components/custom/cards/EntityCardFetchGuard.tsx";
import {CARD_BODY_CLASS} from "@coreModule/components/custom/cards/entityCard.constants.ts";

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

type CityCardProps = WithLanguageType &
    WithAxiosType<City, SingleForm> & {
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
    };

const CityCard = memo(function CityCard({
    countryId,
    countryName,
    stateName,
    stateId,
    city: cityProp,
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
}: CityCardProps) {
    const {
        action,
        setAction,
        entity: city,
        setEntity: setCity,
        hideAfterDeletion,
        onDelete,
        onRestore,
    } = useEntityCard({
        entityProp: cityProp,
        onDeleteProp,
        onRestoreProp,
        syncPropOnChange: !fetchId,
    });
    const [forceReload, setForceReload] = useState(1);

    const {read, restore} = useAccess("cities");

    const cid = countryId ?? city.country?._id;
    const cname = countryName ?? city.country?.name;
    const sid = stateId ?? city.state?._id;
    const sname = stateName ?? city.state?.name;

    useEffect(() => {
        if (fetchId) {
            onFilterChange({_id: fetchId});
        }
    }, [fetchId, forceReload, onFilterChange]);

    useImperativeHandle(innerRef, () => ({
        success: (data: unknown) => {
            setCity(data as City);
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
                                <DeletedInfo deletedAt={city.deletedAt} deletedBy={city.deletedBy} />
                            )}
                            <div className="w-full min-w-0">
                                <EntityTextCardHeader
                                    title={city.name ? city.name : <ValueNotSet />}
                                    showTitle={!!read?.name}
                                    hideActions={hideActions}
                                    actionMenu={
                                        <ActionMenu
                                            accessModel="cities"
                                            deletedData={city}
                                            onAction={(a: string) => setAction(a)}
                                            editPath={cityEditPath(cid, cname, sid, sname, city)}
                                        />
                                    }
                                />
                                <div className={CARD_BODY_CLASS}>
                                    <InfoRowGroup>
                                        <InfoRow
                                            label={resolveLanguageKey("state")}
                                            icon={IconGridDots}
                                            show={!!read?.state}
                                            value={
                                                city.state ? (
                                                    read?.state?.keys?.name ? city.state.name : null
                                                ) : undefined
                                            }
                                        />
                                        <InfoRow
                                            label={resolveLanguageKey("country")}
                                            icon={IconFlag}
                                            show={!!read?.country}
                                            value={
                                                city.country ? (
                                                    <div className="flex items-center gap-x-1.5">
                                                        {read?.country?.keys?.code ? (
                                                            <CountryFlag code={city.country.code} />
                                                        ) : null}
                                                        {read?.country?.keys?.name ? (
                                                            <p>{city.country.name}</p>
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
                            <CitySheetView
                                open={action === "view"}
                                onOpenChange={() => setAction("")}
                                city={city}
                                countryId={cid}
                                countryName={cname}
                                stateId={sid}
                                stateName={sname}
                                onDelete={onDelete}
                                onRestore={onRestore}
                            />
                        )}
                        {action === "delete" && (
                            <DeleteAction
                                accessModel="cities"
                                deleteId={city._id}
                                openAlert={action === "delete"}
                                name={read?.name && city.name}
                                confirmName={read?.name && city.name}
                                onSuccess={onDelete}
                                onCancel={() => setAction("")}
                                url="/api/auxiliary/city"
                            />
                        )}
                        {action === "restore" && (
                            <RestoreAction
                                accessModel="cities"
                                deleteId={city._id}
                                openAlert={action === "restore"}
                                name={read?.name && city.name}
                                confirmName={read?.name && city.name}
                                onSuccess={onRestore}
                                onCancel={() => setAction("")}
                                url="/api/auxiliary/city/restore"
                            />
                        )}
                    </>
                )}
            </>
        </EntityCardFetchGuard>
    );
});

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/cities/center/cardView/cityCard.tsx"),
    withAxios<City, SingleForm>(
        {
            url: "/api/auxiliary/city/single",
            method: "POST",
            data: {},
        },
        true
    ),
    withDebug(true, true)
)(CityCard);
