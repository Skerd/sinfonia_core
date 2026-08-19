import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {memo, type ReactNode, type RefObject} from "react";
import {Hash} from "lucide-react";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import DisplayRow from "@coreModule/components/custom/displayValue/displayRow.tsx";
import DisplayValue from "@coreModule/components/custom/displayValue/displayValue.tsx";
import CurrencySheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/currencies/center/sheetView/currencySheetView.tsx";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import {Currency} from "armonia/src/modules/core/api/finance/private/currency/currency.dto.ts";
import {currencyEditPath} from "@coreModule/clients/panel/private/tenancy/systemSettings/currencies";
import EntityCard from "@coreModule/components/custom/systemCards/entityCard.tsx";
import type {WithAxiosLifecycleRef} from "@coreModule/helpers/hocs/withAxios.tsx";

type CurrencyCardProps = WithLanguageType & {
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
    innerRef?: RefObject<WithAxiosLifecycleRef<Currency> | null>;
};

const CurrencyCard = memo(function CurrencyCard({
    currency,
    listRef: _listRef,
    resolveLanguageKey,
    fetchId,
    hideActions,
    onDelete,
    onRestore,
    sheetOnly = false,
    innerRef,
}: CurrencyCardProps) {
    return (
        <EntityCard
            resource="currencies"
            entity={currency}
            fetchId={fetchId}
            singleUrl="/api/finance/currency/single"
            onDelete={onDelete}
            onRestore={onRestore}
            hideActions={hideActions}
            sheetOnly={sheetOnly}
            editPath={currencyEditPath}
            Sheet={CurrencySheetView}
            sheetEntityProp="currency"
            deleteUrl="/api/finance/currency"
            restoreUrl="/api/finance/currency/restore"
            failedTitle={String(resolveLanguageKey("failedTitle"))}
            failedDescription={String(resolveLanguageKey("failedDescription"))}
            titlePath="name"
            innerRef={innerRef}
        >
            {({entity}) => (
                <>
                    <EntityCard.Header
                        titlePath="name"
                        title={entity.name}
                        icon={
                            <DisplayValue path="symbol" value={entity.symbol}>
                                {(formatted: ReactNode) => (
                                    <Badge variant="outline">{formatted}</Badge>
                                )}
                            </DisplayValue>
                        }
                    />
                    <EntityCard.Body>
                        <DisplayRow
                            icon={Hash}
                            label={resolveLanguageKey("abbreviation")}
                            tooltip={resolveLanguageKey("abbreviation")}
                            path="abbreviation"
                            value={entity.abbreviation}
                        />
                        {/* <DisplayRow
                            icon={Sigma}
                            label={resolveLanguageKey("decimalPlaces")}
                            tooltip={resolveLanguageKey("decimalPlaces")}
                            path="decimalPlaces"
                            type="number"
                            value={entity.decimalPlaces}
                        >
                            {(formatted) => <Badge variant="outline">{formatted}</Badge>}
                        </DisplayRow> */}
                    </EntityCard.Body>
                </>
            )}
        </EntityCard>
    );
});

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/currencies/center/cardView/currencyCard.tsx"),
    withDebug(true, true, "currencies")
)(CurrencyCard);
