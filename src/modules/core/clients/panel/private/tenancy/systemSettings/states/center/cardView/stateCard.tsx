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
import {State} from "armonia/src/modules/core/api/auxiliary/private/state/state.dto.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import DeletedInfo from "@coreModule/components/custom/deletedInfo";
import CountryFlag from "@coreModule/components/custom/countryFlag.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {Tag} from "lucide-react";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import InfoRow from "@coreModule/components/custom/infoRow.tsx";
import StateSheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/states/center/sheetView/stateSheetView.tsx";
import DeleteAction from "@coreModule/components/custom/actions/deleteAction.tsx";
import type {DeletedData, SingleForm} from "armonia/src/modules/core/types/shared.types.ts";
import RestoreAction from "@coreModule/components/custom/actions/restoreAction.tsx";
import ActionMenu from "@coreModule/components/custom/actions/menu/actionMenu.tsx";
import ViewCities from "@coreModule/clients/panel/private/tenancy/systemSettings/states/center/actions/viewCities.tsx";
import {IconFlag} from "@tabler/icons-react";
import {stateEditPath} from "@coreModule/clients/panel/private/tenancy/systemSettings/states";


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
    small = false,
}: StateCardProps) {
    const [action, setAction] = useState("");
    const [state, setState] = useState<State>(stateProp);
    const [hideAfterDeletion, setHideAfterDeletion] = useState(false);
    const [forceReload, setForceReload] = useState(1);

    const {read, restore} = useAccess("states");
    const {read: readCity} = useAccess("cities");

    const cid = countryId ?? state.country?._id;
    const cname = countryName ?? state.country?.name;

    const onDelete = (data: DeletedData) => {
        if (!data.deletedBy && !data.deletedAt) {
            setHideAfterDeletion(true);
        } else if (onDeleteProp) {
            onDeleteProp(state, data);
        } else {
            setState({...state, ...data});
        }
    };

    const onRestore = () => {
        if (onRestoreProp) {
            onRestoreProp();
        } else {
            setState({
                ...state,
                deletedAt: undefined,
                deletedBy: undefined,
            });
        }
    };

    useEffect(() => {
        if (!fetchId) {
            setState(stateProp);
        }
    }, [fetchId, stateProp]);

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
                            <DeletedInfo deletedAt={state.deletedAt} deletedBy={state.deletedBy} />
                        )}
                        <div className={cn("w-full min-w-0", small ? "py-2" : "py-3")}>
                            <div
                                className={cn(
                                    "flex justify-between items-center gap-2",
                                    small ? "ps-3 pe-1.5 pb-1.5" : "ps-4 pe-2 pb-2"
                                )}
                            >
                                <div className="min-w-0 flex-1">
                                    <HiddenElement showLock randomLength={0}>
                                        {read?.name && (
                                            <>
                                                {state.name ? (
                                                    <TooltipDisplayer tooltip={resolveLanguageKey("name")}>
                                                        <div
                                                            className={cn(
                                                                "font-semibold leading-tight",
                                                                small ? "text-sm" : "text-base"
                                                            )}
                                                        >
                                                            {state.name}
                                                        </div>
                                                    </TooltipDisplayer>
                                                ) : (
                                                    <ValueNotSet />
                                                )}
                                            </>
                                        )}
                                    </HiddenElement>
                                </div>
                                {!hideActions && (
                                    <div
                                        role="presentation"
                                        className="shrink-0"
                                        onClick={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => e.stopPropagation()}
                                    >
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
                                    </div>
                                )}
                            </div>
                            <div className={cn("space-y-2 text-sm pt-0", small ? "px-3" : "px-4")}>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <InfoRow
                                        icon={Tag}
                                        label={resolveLanguageKey("code")}
                                        tooltip={String(resolveLanguageKey("code"))}
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
                                        show={read?.country}
                                        value={
                                            state.country ?
                                            <div className="flex items-center space-x-1.5">
                                                <p>{state.country.name}</p>
                                                <CountryFlag code={state.country.code} />
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
