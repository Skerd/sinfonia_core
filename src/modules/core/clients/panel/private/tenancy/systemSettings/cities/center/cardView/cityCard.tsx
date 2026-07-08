import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Loader from "@coreModule/components/custom/loader.tsx";
import {ErrorView} from "@coreModule/components/custom/errorView.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {useEffect, useImperativeHandle, useState, memo} from "react";
import {Card} from "@coreModule/components/ui/card.tsx";
import {City} from "armonia/src/modules/core/api/auxiliary/private/city/city.dto.ts";
import {cn} from "@coreModule/components/lib/utils.ts";
import DeletedInfo from "@coreModule/components/custom/deletedInfo";
import CountryFlag from "@coreModule/components/custom/countryFlag.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import CitySheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/cities/center/sheetView/citySheetView.tsx";
import DeleteAction from "@coreModule/components/custom/actions/deleteAction.tsx";
import type {DeletedData, SingleForm} from "armonia/src/modules/core/types/shared.types.ts";
import RestoreAction from "@coreModule/components/custom/actions/restoreAction.tsx";
import ActionMenu from "@coreModule/components/custom/actions/menu/actionMenu.tsx";
import InfoRow from "@coreModule/components/custom/infoRow.tsx";
import {IconFlag, IconGridDots} from "@tabler/icons-react";

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
    const [action, setAction] = useState("");
    const [city, setCity] = useState<City>(cityProp);
    const [hideAfterDeletion, setHideAfterDeletion] = useState(false);
    const [forceReload, setForceReload] = useState(1);

    const {read, restore} = useAccess("cities");

    const cid = countryId ?? city.country?._id;
    const cname = countryName ?? city.country?.name;
    const sid = stateId ?? city.state?._id;
    const sname = stateName ?? city.state?.name;

    const onDelete = (data: DeletedData) => {
        if (!data.deletedBy && !data.deletedAt) {
            setHideAfterDeletion(true);
        } else if (onDeleteProp) {
            onDeleteProp(city, data);
        } else {
            setCity({...city, ...data});
        }
    };

    const onRestore = () => {
        if (onRestoreProp) {
            onRestoreProp();
        } else {
            setCity({
                ...city,
                deletedAt: undefined,
                deletedBy: undefined,
            });
        }
    };

    useEffect(() => {
        if (!fetchId) {
            setCity(cityProp);
        }
    }, [fetchId, cityProp]);

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

    if (fetchId && loading) {
        return <Loader />;
    }
    if (fetchId && error) {
        return (
            <ErrorView
                title={resolveLanguageKey("failedTitle")}
                description={resolveLanguageKey("failedDescription")}
                onClick={() => setForceReload((n) => n + 1)}
            />
        );
    }

    return (
        <>
            {!sheetOnly && (
                <Card
                    className={cn("group p-0 h-full relative transition-all duration-300 hover:shadow-md hover:cursor-pointer")}
                    onClick={() => setAction("view")}
                >
                    <div className="flex w-full items-stretch">
                        {(read.deletedBy || read.deletedAt) && (
                            <DeletedInfo deletedAt={city.deletedAt} deletedBy={city.deletedBy} />
                        )}
                        <div className="w-full min-w-0 py-3">
                            <div className="flex justify-between items-center ps-4 pe-2 pb-2 gap-2">
                                <div className="min-w-0 flex-1">
                                    <HiddenElement showLock randomLength={0}>
                                        {read?.name && (
                                            <>
                                                {city.name ? (
                                                    <TooltipDisplayer tooltip={resolveLanguageKey("name")}>
                                                        <div className="font-semibold text-base leading-tight">{city.name}</div>
                                                    </TooltipDisplayer>
                                                ) : (
                                                    <ValueNotSet />
                                                )}
                                            </>
                                        )}
                                    </HiddenElement>
                                </div>
                                {!hideActions && (
                                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <ActionMenu
                                            accessModel="cities"
                                            deletedData={city}
                                            onAction={(a: string) => setAction(a)}
                                            editPath={cityEditPath(cid, cname, sid, sname, city)}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2 text-sm px-4 pt-0">
                                <div className="flex flex-col space-y-1">
                                    <InfoRow
                                        label={resolveLanguageKey("state")}
                                        icon={IconGridDots}
                                        show={read?.state}
                                        value={city.state?.name}
                                    />
                                    <InfoRow
                                        label={resolveLanguageKey("country")}
                                        icon={IconFlag}
                                        show={read?.country}
                                        value={
                                            city.country ?
                                            <div className="flex items-center space-x-1.5">
                                                <p>{city.country.name}</p>
                                                <CountryFlag code={city.country.code} />
                                            </div>
                                            :
                                            undefined
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
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
