import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Loader from "@coreModule/components/custom/loader.tsx";
import {ErrorView} from "@coreModule/components/custom/errorView.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {useEffect, useImperativeHandle, useState} from "react";
import {Card} from "@coreModule/components/ui/card.tsx";
import {Country} from "armonia/src/modules/core/api/auxiliary/private/country/country.dto.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import DeletedInfo from "@coreModule/components/custom/deletedInfo";
import CountryFlag from "@coreModule/components/custom/countryFlag.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {Phone, Tag} from "lucide-react";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import InfoRow from "@coreModule/components/custom/infoRow.tsx";
import CountrySheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/countries/center/sheetView/countrySheetView.tsx";
import DeleteAction from "@coreModule/components/custom/actions/deleteAction.tsx";
import type {DeletedData, SingleForm} from "armonia/src/modules/core/types/shared.types.ts";
import RestoreAction from "@coreModule/components/custom/actions/restoreAction.tsx";
import ActionMenu from "@coreModule/components/custom/actions/menu/actionMenu.tsx";
import ViewStates from "@coreModule/clients/panel/private/tenancy/systemSettings/countries/center/actions/viewStates.tsx";
import ViewCities from "@coreModule/clients/panel/private/tenancy/systemSettings/countries/center/actions/viewCities.tsx";

function countryEditPath(country: Country) {
    const params = new URLSearchParams();
    params.set("countryId", country._id);
    if (country.name) params.set("countryName", country.name);
    return `/tenancy/systemSettings/countries/edit?${params.toString()}`;
}

type CountryCardProps = WithLanguageType &
    WithAxiosType<Country, SingleForm> & {
        country: Country;
        /** When set, loads full country via `POST /api/auxiliary/country/single` (sheet DTOs may omit fields). */
        fetchId?: string;
        hideActions?: boolean;
        onDelete?: (deletedCountry?: Country, response?: DeletedData) => void;
        onRestore?: () => void;
        sheetOnly?: boolean;
        /** Compact layout for sheet embeds (e.g. server-driven UI alongside `#SheetGroup` + muted frame). */
        small?: boolean;
    };

function CountryCard({
    country: countryProp,
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
    small = false,
}: CountryCardProps) {
    const [action, setAction] = useState("");
    const [country, setCountry] = useState<Country>(countryProp);
    const [hideAfterDeletion, setHideAfterDeletion] = useState(false);
    const [forceReload, setForceReload] = useState(1);

    const {read, restore} = useAccess("countries");
    const {read: readState} = useAccess("states");
    const {read: readCity} = useAccess("cities");

    const phoneDisplay =
        country.phoneCode != null && country.phoneCode !== ""
            ? country.phoneCode.includes("+")
                ? country.phoneCode
                : `+${country.phoneCode}`
            : null;

    const onDelete = (data: DeletedData) => {
        if (!data.deletedBy && !data.deletedAt) {
            setHideAfterDeletion(true);
        } else if (onDeleteProp) {
            onDeleteProp(country, data);
        } else {
            setCountry({...country, ...data});
        }
    };

    const onRestore = () => {
        if (onRestoreProp) {
            onRestoreProp();
        } else {
            setCountry({
                ...country,
                deletedAt: undefined,
                deletedBy: undefined,
            });
        }
    };

    useEffect(() => {
        if (!fetchId) {
            setCountry(countryProp);
        }
    }, [fetchId, countryProp]);

    useEffect(() => {
        if (fetchId) {
            onFilterChange({_id: fetchId});
        }
    }, [fetchId, forceReload]);

    useImperativeHandle(innerRef, () => ({
        success: (data) => {
            setCountry(data);
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
                    className={cn(
                        "group p-0 h-full relative transition-all duration-300 hover:shadow-md hover:cursor-pointer",
                        small && "hover:shadow-sm"
                    )}
                    onClick={() => setAction("view")}
                >
                    <div className="flex w-full items-stretch">
                        {(read.deletedBy || read.deletedAt) && (
                            <DeletedInfo deletedAt={country.deletedAt} deletedBy={country.deletedBy} />
                        )}
                        <div
                            className={cn("w-full min-w-0", small ? "py-2" : "py-3")}
                        >
                            <div
                                className={cn(
                                    "flex justify-between items-center",
                                    small ? "ps-3 pe-1.5 pb-1.5" : "ps-4 pe-2 pb-2"
                                )}
                            >
                                <div className="flex items-center gap-2 flex-wrap min-w-0">
                                    {!!read?.code && (
                                        <TooltipDisplayer tooltip={String(resolveLanguageKey("flag"))}>
                                            {country.code ? (
                                                <CountryFlag code={country.code} />
                                            ) : (
                                                <ValueNotSet />
                                            )}
                                        </TooltipDisplayer>
                                    )}
                                    {!!read?.name && (
                                        <TooltipDisplayer tooltip={String(resolveLanguageKey("name"))}>
                                            {country.name ? (
                                                <div
                                                    className={cn(
                                                        "font-semibold leading-tight",
                                                        small ? "text-sm" : "text-base"
                                                    )}
                                                >
                                                    {country.name}
                                                </div>
                                            ) : (
                                                <ValueNotSet />
                                            )}
                                        </TooltipDisplayer>
                                    )}
                                </div>
                                {!hideActions && (
                                    <div
                                        role="presentation"
                                        onClick={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => e.stopPropagation()}
                                    >
                                        <ActionMenu
                                            accessModel="countries"
                                            deletedData={country}
                                            onAction={(a: string) => setAction(a)}
                                            editPath={countryEditPath(country)}
                                        >
                                            {readState && (
                                                <ViewStates countryId={country._id} countryName={country.name} />
                                            )}
                                            {readCity && (
                                                <ViewCities countryId={country._id} countryName={country.name} />
                                            )}
                                        </ActionMenu>
                                    </div>
                                )}
                            </div>
                            <div className={cn("space-y-2 text-sm pt-0", small ? "px-3" : "px-4")}>
                                <div className={cn("flex gap-1.5", small ? "flex" : "flex-col")}>
                                    <InfoRow
                                        icon={Tag}
                                        label={resolveLanguageKey("code")}
                                        tooltip={String(resolveLanguageKey("code"))}
                                        className="w-fit"
                                        show={!!read?.code}
                                        value={
                                            country.code ? (
                                                <Badge variant="secondary" className="text-xs font-normal">
                                                    {country.code}
                                                </Badge>
                                            ) : null
                                        }
                                    />
                                    <InfoRow
                                        icon={Phone}
                                        label={resolveLanguageKey("phoneCode")}
                                        tooltip={String(resolveLanguageKey("phoneCode"))}
                                        show={!!read?.phoneCode}
                                        className="w-fit"
                                        value={
                                            phoneDisplay != null ? (
                                                <span className="text-muted-foreground text-xs">{phoneDisplay}</span>
                                            ) : null
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
                        <CountrySheetView
                            open={action === "view"}
                            onOpenChange={() => setAction("")}
                            country={country}
                            onDelete={onDelete}
                            onRestore={onRestore}
                        />
                    )}
                    {action === "delete" && (
                        <DeleteAction
                            accessModel="countries"
                            deleteId={country._id}
                            openAlert={action === "delete"}
                            name={read?.name && country.name}
                            confirmName={read?.name && country.name}
                            onSuccess={onDelete}
                            onCancel={() => setAction("")}
                            url="/api/auxiliary/country"
                        />
                    )}
                    {action === "restore" && (
                        <RestoreAction
                            accessModel="countries"
                            deleteId={country._id}
                            openAlert={action === "restore"}
                            name={read?.name && country.name}
                            confirmName={read?.name && country.name}
                            onSuccess={onRestore}
                            onCancel={() => setAction("")}
                            url="/api/auxiliary/country/restore"
                        />
                    )}
                </>
            )}
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/countries/center/cardView/countryCard.tsx"),
    withAxios<Country, SingleForm>(
        {
            url: "/api/auxiliary/country/single",
            method: "POST",
            data: {},
        },
        true
    ),
    withDebug(true, true)
)(CountryCard);
