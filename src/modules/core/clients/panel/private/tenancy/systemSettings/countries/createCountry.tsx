import {IconFlagPlus} from "@tabler/icons-react";
import {createGenericCreatePage} from "@coreModule/components/entityPage/createGenericCreatePage.tsx";
import {createCountryFormSchema} from "armonia/src/modules/core/api/auxiliary/private/country/createCountry.form.validator.ts";
import type {CreateCountryFormType} from "armonia/src/modules/core/api/auxiliary/private/country/country.schema-def.ts";

export default createGenericCreatePage<CreateCountryFormType>({
    languagePath: "src/modules/core/clients/panel/private/tenancy/systemSettings/countries/createCountry.tsx",
    collectionName: "countries",
    accessModel: "countries",
    apiUrl: "/api/auxiliary/country",
    schema: createCountryFormSchema,
    defaultValues: {name: "", code: "", phoneCode: ""},
    submitIcon: <IconFlagPlus />,
});
