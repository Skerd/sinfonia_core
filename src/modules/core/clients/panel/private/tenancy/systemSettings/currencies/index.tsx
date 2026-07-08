import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {Currency} from "armonia/src/modules/core/api/finance/private/currency/currency.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import {IconCashPlus} from "@tabler/icons-react";
import CurrencyCard from "@coreModule/clients/panel/private/tenancy/systemSettings/currencies/center/cardView/currencyCard.tsx";
import CurrencySheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/currencies/center/sheetView/currencySheetView.tsx";
import EntityListPage from "@coreModule/components/entityPage/EntityListPage.tsx";

export function currencyEditPath(c: Currency) {
    const params = new URLSearchParams();
    params.set("currencyId", c._id);
    if (c.name) params.set("currencyName", c.name);
    return `/tenancy/systemSettings/currencies/edit?${params.toString()}`;
}

type AllCurrenciesProps = WithLanguageType & {};

function AllCurrencies({resolveLanguageKey}: AllCurrenciesProps) {
    return (
        <EntityListPage<Currency>
            apiUrl="/api/finance/currency"
            collectionName="currencies"
            accessModel="currencies"
            tableConfigKey="currencies"
            createPath="/tenancy/systemSettings/currencies/create"
            createIcon={<IconCashPlus />}
            createLanguageKey="createCurrency"
            buildEditPath={currencyEditPath}
            resolveLanguageKey={resolveLanguageKey}
            cardViewClassName="grid grid-cols-1 gap-2 lg:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            renderCard={(currency, onDelete, onRestore) => (
                <CurrencyCard
                    currency={currency}
                    onDelete={(row: Currency | undefined, response?: DeletedData) => onDelete(row, response)}
                    onRestore={() => onRestore(currency)}
                />
            )}
            renderSheet={({entity, open, onOpenChange, onDelete, onRestore}) => (
                <CurrencySheetView
                    open={open}
                    onOpenChange={(opened: boolean) => { if (!opened) onOpenChange(); }}
                    currency={entity}
                    onDelete={onDelete}
                    onRestore={onRestore}
                />
            )}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/currencies/index.tsx"),
    withDebug(true, true)
)(AllCurrencies);
