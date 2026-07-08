import {createGenericEditPage} from "@coreModule/components/entityPage/createGenericEditPage.tsx";
import {editCurrencyFormSchema} from "armonia/src/modules/core/api/finance/private/currency/editCurrency.form.validator.ts";
import type {Currency} from "armonia/src/modules/core/api/finance/private/currency/currency.dto.ts";
import type {EditCurrencyFormType} from "armonia/src/modules/core/api/finance/private/currency/currency.schema-def.ts";

export default createGenericEditPage<Currency, EditCurrencyFormType>({
    languagePath: "src/modules/core/clients/panel/private/tenancy/systemSettings/currencies/editCurrency.tsx",
    collectionName: "currencies",
    accessModel: "currencies",
    apiUrl: "/api/finance/currency",
    schema: editCurrencyFormSchema,
    buildInitialValues: (data, writeFields) => ({
        _id: data._id,
        name: writeFields.name ? data.name : undefined,
        symbol: writeFields.symbol ? data.symbol : undefined,
        decimalPlaces: writeFields.decimalPlaces ? data.decimalPlaces : undefined,
        abbreviation: writeFields.abbreviation ? data.abbreviation : undefined,
    }),
});
