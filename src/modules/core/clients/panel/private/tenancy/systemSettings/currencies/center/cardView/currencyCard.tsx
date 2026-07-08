import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Loader from "@coreModule/components/custom/loader.tsx";
import {ErrorView} from "@coreModule/components/custom/errorView.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {RefObject, useEffect, useImperativeHandle, useState, memo} from "react";
import {Card} from "@coreModule/components/ui/card.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import DeletedInfo from "@coreModule/components/custom/deletedInfo";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import InfoRow from "@coreModule/components/custom/infoRow.tsx";
import {Hash, Sigma, Type} from "lucide-react";
import CurrencySheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/currencies/center/sheetView/currencySheetView.tsx";
import DeleteAction from "@coreModule/components/custom/actions/deleteAction.tsx";
import type {DeletedData, SingleForm} from "armonia/src/modules/core/types/shared.types.ts";
import RestoreAction from "@coreModule/components/custom/actions/restoreAction.tsx";
import ActionMenu from "@coreModule/components/custom/actions/menu/actionMenu.tsx";
import {Currency} from "armonia/src/modules/core/api/finance/private/currency/currency.dto.ts";
import {currencyEditPath} from "@coreModule/clients/panel/private/tenancy/systemSettings/currencies";

type CurrencyCardProps = WithLanguageType & WithAxiosType<Currency, SingleForm> & {
    currency: Currency;
    fetchId?: string;
    listRef?: RefObject<{
        refetch: () => void;
        updateRow: (id: string | number, patch: Partial<Currency>) => void;
    } | null>;
    hideActions?: boolean;
    onDelete?: (deleted?: Currency, response?: DeletedData) => void;
    onRestore?: () => void;
    sheetOnly?: boolean;
    small?: boolean;
};

const CurrencyCard = memo(function CurrencyCard({
    currency: currencyProp,
    listRef: _listRef,
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
}: CurrencyCardProps) {
    const [action, setAction] = useState("");
    const [currency, setCurrency] = useState<Currency>(currencyProp);
    const [hideAfterDeletion, setHideAfterDeletion] = useState(false);
    const [forceReload, setForceReload] = useState(1);

    const {read, restore} = useAccess("currencies");

    const onDelete = (data: DeletedData) => {
        if (!data.deletedBy && !data.deletedAt) {
            setHideAfterDeletion(true);
        } else if (onDeleteProp) {
            onDeleteProp(currency, data);
        } else {
            setCurrency({...currency, ...data});
        }
    };

    const onRestore = () => {
        if (onRestoreProp) {
            onRestoreProp();
        } else {
            setCurrency({
                ...currency,
                deletedAt: undefined,
                deletedBy: undefined,
            });
        }
    };

    useEffect(() => {
        if (!fetchId) {
            setCurrency(currencyProp);
        }
    }, [fetchId, currencyProp]);

    useEffect(() => {
        if (fetchId) {
            onFilterChange({_id: fetchId});
        }
    }, [fetchId, forceReload]);

    useImperativeHandle(innerRef, () => ({
        success: (data) => {
            setCurrency(data);
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

    if( !currency ) {
        return <></>
    }

    return (
        <>
            {!sheetOnly && (
                <Card
                    className={cn(
                        "group p-0 relative transition-all duration-300 hover:shadow-md hover:cursor-pointer h-fit",
                        small && "hover:shadow-sm"
                    )}
                    onClick={() => setAction("view")}
                >
                    <div className="flex w-full items-stretch">
                        {(read.deletedBy || read.deletedAt) && (
                            <DeletedInfo deletedAt={currency.deletedAt} deletedBy={currency.deletedBy} />
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
                                                {currency.name ? (
                                                    <TooltipDisplayer tooltip={resolveLanguageKey("name")}>
                                                        <div
                                                            className={cn(
                                                                "font-semibold leading-tight",
                                                                small ? "text-sm" : "text-base"
                                                            )}
                                                        >
                                                            {currency.name}
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
                                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <ActionMenu
                                            accessModel="currencies"
                                            deletedData={currency}
                                            onAction={(a: string) => setAction(a)}
                                            editPath={currencyEditPath(currency)}
                                        />
                                    </div>
                                )}
                            </div>
                            <div
                                className={cn("space-y-2 text-sm pt-0", small ? "px-3" : "px-4")}
                            >
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <InfoRow
                                        icon={Type}
                                        label={resolveLanguageKey("symbol")}
                                        tooltip={resolveLanguageKey("symbol")}
                                        value={
                                            <HiddenElement showLock randomLength={0}>
                                                {read?.symbol && (
                                                    <>
                                                        {currency.symbol != null && currency.symbol !== "" ? (
                                                            <div className="flex items-center border rounded-lg px-2 py-0.5 text-xs font-normal">
                                                                {currency.symbol}
                                                            </div>
                                                        ) : (
                                                            <ValueNotSet />
                                                        )}
                                                    </>
                                                )}
                                            </HiddenElement>
                                        }
                                    />
                                    <InfoRow
                                        icon={Hash}
                                        label={resolveLanguageKey("abbreviation")}
                                        tooltip={resolveLanguageKey("abbreviation")}
                                        value={
                                            <HiddenElement showLock randomLength={0}>
                                                {read?.abbreviation && (
                                                    <>
                                                        {currency.abbreviation != null && currency.abbreviation !== "" ? (
                                                            <div className="flex items-center border rounded-lg px-2 py-0.5 text-xs font-normal">
                                                                {currency.abbreviation}
                                                            </div>
                                                        ) : (
                                                            <ValueNotSet />
                                                        )}
                                                    </>
                                                )}
                                            </HiddenElement>
                                        }
                                    />
                                    <InfoRow
                                        icon={Sigma}
                                        label={resolveLanguageKey("decimalPlaces")}
                                        tooltip={resolveLanguageKey("decimalPlaces")}
                                        value={
                                            <HiddenElement showLock randomLength={0}>
                                                {read?.decimalPlaces != null && (
                                                    <>
                                                        {currency.decimalPlaces != null ? (
                                                            <div className="flex items-center border rounded-lg px-2 py-0.5 text-xs font-normal">
                                                                {currency.decimalPlaces}
                                                            </div>
                                                        ) : (
                                                            <ValueNotSet />
                                                        )}
                                                    </>
                                                )}
                                            </HiddenElement>
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
                        <CurrencySheetView
                            open={action === "view"}
                            onOpenChange={() => setAction("")}
                            currency={currency}
                            onDelete={onDelete}
                            onRestore={onRestore}
                        />
                    )}
                    {action === "delete" && (
                        <DeleteAction
                            accessModel="currencies"
                            deleteId={currency._id}
                            openAlert={action === "delete"}
                            name={read?.name && currency.name}
                            confirmName={read?.name && currency.name}
                            onSuccess={onDelete}
                            onCancel={() => setAction("")}
                            url="/api/finance/currency"
                        />
                    )}
                    {action === "restore" && (
                        <RestoreAction
                            accessModel="currencies"
                            deleteId={currency._id}
                            openAlert={action === "restore"}
                            name={read?.name && currency.name}
                            confirmName={read?.name && currency.name}
                            onSuccess={onRestore}
                            onCancel={() => setAction("")}
                            url="/api/finance/currency/restore"
                        />
                    )}
                </>
            )}
        </>
    );
});

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/currencies/center/cardView/currencyCard.tsx"),
    withAxios<Currency, SingleForm>(
        {
            url: "/api/finance/currency/single",
            method: "POST",
            data: {},
        },
        true
    ),
    withDebug(true, true)
)(CurrencyCard);
