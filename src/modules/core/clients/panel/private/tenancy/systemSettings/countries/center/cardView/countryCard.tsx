import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {useEffect, useImperativeHandle, useState} from "react";
import {Country} from "armonia/src/modules/core/api/auxiliary/private/country/country.dto.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import DeletedInfo from "@coreModule/components/custom/deletedInfo";
import CountryFlag from "@coreModule/components/custom/countryFlag.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {Phone, Tag} from "lucide-react";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import InfoRow from "@coreModule/components/custom/infoRow.tsx";
import {InfoRowGroup} from "@coreModule/components/custom/infoRowGroup.tsx";
import CountrySheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/countries/center/sheetView/countrySheetView.tsx";
import DeleteAction from "@coreModule/components/custom/actions/deleteAction.tsx";
import type {DeletedData, SingleForm} from "armonia/src/modules/core/types/shared.types.ts";
import RestoreAction from "@coreModule/components/custom/actions/restoreAction.tsx";
import ActionMenu from "@coreModule/components/custom/actions/menu/actionMenu.tsx";
import ViewStates from "@coreModule/clients/panel/private/tenancy/systemSettings/countries/center/actions/viewStates.tsx";
import ViewCities from "@coreModule/clients/panel/private/tenancy/systemSettings/countries/center/actions/viewCities.tsx";
import {useEntityCard} from "@coreModule/helpers/hooks/useEntityCard.ts";
import {EntityCardShell} from "@coreModule/components/custom/cards/EntityCardShell.tsx";
import {EntityTextCardHeader} from "@coreModule/components/custom/cards/EntityTextCardHeader.tsx";
import {EntityCardFetchGuard} from "@coreModule/components/custom/cards/EntityCardFetchGuard.tsx";
import {CARD_BODY_CLASS} from "@coreModule/components/custom/cards/entityCard.constants.ts";

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
    const {
        action,
        setAction,
        entity: country,
        setEntity: setCountry,
        hideAfterDeletion,
        onDelete,
        onRestore,
    } = useEntityCard({
        entityProp: countryProp,
        onDeleteProp,
        onRestoreProp,
        syncPropOnChange: !fetchId,
    });
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
                                <DeletedInfo
                                    deletedAt={country.deletedAt}
                                    deletedBy={country.deletedBy}
                                />
                            )}
                            <div className="w-full min-w-0">
                                <EntityTextCardHeader
                                    iconTile={
                                        !!read?.code ? (
                                            <TooltipDisplayer tooltip={resolveLanguageKey("flag")}>
                                                {country.code ? (
                                                    <CountryFlag code={country.code} />
                                                ) : (
                                                    <ValueNotSet />
                                                )}
                                            </TooltipDisplayer>
                                        ) : undefined
                                    }
                                    title={country.name ? country.name : <ValueNotSet />}
                                    showTitle={!!read?.name}
                                    hideActions={hideActions}
                                    actionMenu={
                                        <ActionMenu
                                            accessModel="countries"
                                            deletedData={country}
                                            onAction={(a: string) => setAction(a)}
                                            editPath={countryEditPath(country)}
                                        >
                                            {readState && (
                                                <ViewStates
                                                    countryId={country._id}
                                                    countryName={country.name}
                                                />
                                            )}
                                            {readCity && (
                                                <ViewCities
                                                    countryId={country._id}
                                                    countryName={country.name}
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
                                            tooltip={resolveLanguageKey("phoneCode")}
                                            show={!!read?.phoneCode}
                                            value={
                                                phoneDisplay != null ? (
                                                    <span className="text-muted-foreground text-xs">
                                                        {phoneDisplay}
                                                    </span>
                                                ) : null
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
        </EntityCardFetchGuard>
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
