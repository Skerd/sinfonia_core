import {IconCashPlus} from "@tabler/icons-react";
import {createGenericCreatePage} from "@coreModule/components/entityPage/createGenericCreatePage.tsx";
import {createCurrencyFormSchema} from "armonia/src/modules/core/api/finance/private/currency/createCurrency.form.validator.ts";
import type {CreateCurrencyFormType} from "armonia/src/modules/core/api/finance/private/currency/currency.schema-def.ts";

export default createGenericCreatePage<CreateCurrencyFormType>({
    languagePath: "src/modules/core/clients/panel/private/tenancy/systemSettings/currencies/createCurrency.tsx",
    collectionName: "currencies",
    accessModel: "currencies",
    apiUrl: "/api/finance/currency",
    schema: createCurrencyFormSchema,
    defaultValues: {
        name: "",
        symbol: "",
        decimalPlaces: 2,
        abbreviation: "",
    },
    successPath: "/tenancy/systemSettings/currencies",
    submitIcon: <IconCashPlus />,
});
