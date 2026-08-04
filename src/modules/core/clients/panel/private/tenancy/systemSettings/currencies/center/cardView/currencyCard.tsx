import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {RefObject, useEffect, useImperativeHandle, useState, memo} from "react";
import DeletedInfo from "@coreModule/components/custom/deletedInfo";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import InfoRow from "@coreModule/components/custom/infoRow.tsx";
import {InfoRowGroup} from "@coreModule/components/custom/infoRowGroup.tsx";
import {Hash, Sigma, Type} from "lucide-react";
import CurrencySheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/currencies/center/sheetView/currencySheetView.tsx";
import DeleteAction from "@coreModule/components/custom/actions/deleteAction.tsx";
import type {DeletedData, SingleForm} from "armonia/src/modules/core/types/shared.types.ts";
import RestoreAction from "@coreModule/components/custom/actions/restoreAction.tsx";
import ActionMenu from "@coreModule/components/custom/actions/menu/actionMenu.tsx";
import {Currency} from "armonia/src/modules/core/api/finance/private/currency/currency.dto.ts";
import {currencyEditPath} from "@coreModule/clients/panel/private/tenancy/systemSettings/currencies";
import {useEntityCard} from "@coreModule/helpers/hooks/useEntityCard.ts";
import {EntityCardShell} from "@coreModule/components/custom/cards/EntityCardShell.tsx";
import {EntityTextCardHeader} from "@coreModule/components/custom/cards/EntityTextCardHeader.tsx";
import {EntityCardFetchGuard} from "@coreModule/components/custom/cards/EntityCardFetchGuard.tsx";
import {CARD_BODY_CLASS} from "@coreModule/components/custom/cards/entityCard.constants.ts";

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
}: CurrencyCardProps) {
    const {
        action,
        setAction,
        entity: currency,
        setEntity: setCurrency,
        hideAfterDeletion,
        onDelete,
        onRestore,
    } = useEntityCard({
        entityProp: currencyProp,
        onDeleteProp,
        onRestoreProp,
        syncPropOnChange: !fetchId,
    });
    const [forceReload, setForceReload] = useState(1);

    const {read, restore} = useAccess("currencies");

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
    if (!currency) {
        return <></>;
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
                                <DeletedInfo deletedAt={currency.deletedAt} deletedBy={currency.deletedBy} />
                            )}
                            <div className="w-full min-w-0">
                                <EntityTextCardHeader
                                    title={currency.name ? currency.name : <ValueNotSet />}
                                    showTitle={!!read?.name}
                                    hideActions={hideActions}
                                    actionMenu={
                                        <ActionMenu
                                            accessModel="currencies"
                                            deletedData={currency}
                                            onAction={(a: string) => setAction(a)}
                                            editPath={currencyEditPath(currency)}
                                        />
                                    }
                                />
                                <div className={CARD_BODY_CLASS}>
                                    <InfoRowGroup>
                                        <InfoRow
                                            icon={Type}
                                            label={resolveLanguageKey("symbol")}
                                            tooltip={resolveLanguageKey("symbol")}
                                            show={!!read?.symbol}
                                            value={
                                                currency.symbol != null && currency.symbol !== "" ? (
                                                    <div className="flex items-center border rounded-lg px-2 py-0.5 text-xs font-normal">
                                                        {currency.symbol}
                                                    </div>
                                                ) : (
                                                    <ValueNotSet />
                                                )
                                            }
                                        />
                                        <InfoRow
                                            icon={Hash}
                                            label={resolveLanguageKey("abbreviation")}
                                            tooltip={resolveLanguageKey("abbreviation")}
                                            show={!!read?.abbreviation}
                                            value={
                                                currency.abbreviation != null && currency.abbreviation !== "" ? (
                                                    <div className="flex items-center border rounded-lg px-2 py-0.5 text-xs font-normal">
                                                        {currency.abbreviation}
                                                    </div>
                                                ) : (
                                                    <ValueNotSet />
                                                )
                                            }
                                        />
                                        <InfoRow
                                            icon={Sigma}
                                            label={resolveLanguageKey("decimalPlaces")}
                                            tooltip={resolveLanguageKey("decimalPlaces")}
                                            show={!!read?.decimalPlaces}
                                            value={
                                                currency.decimalPlaces != null ? (
                                                    <div className="flex items-center border rounded-lg px-2 py-0.5 text-xs font-normal">
                                                        {currency.decimalPlaces}
                                                    </div>
                                                ) : (
                                                    <ValueNotSet />
                                                )
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
        </EntityCardFetchGuard>
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
