import {createGenericEditPage} from "@coreModule/components/entityPage/createGenericEditPage.tsx";
import {editCountryFormSchema} from "armonia/src/modules/core/api/auxiliary/private/country/editCountry.form.validator.ts";
import type {Country} from "armonia/src/modules/core/api/auxiliary/private/country/country.dto.ts";
import type {EditCountryFormType} from "armonia/src/modules/core/api/auxiliary/private/country/country.schema-def.ts";

export default createGenericEditPage<Country, EditCountryFormType>({
    languagePath: "src/modules/core/clients/panel/private/tenancy/systemSettings/countries/editCountry.tsx",
    collectionName: "countries",
    accessModel: "countries",
    apiUrl: "/api/auxiliary/country",
    schema: editCountryFormSchema,
    buildInitialValues: (data, writeFields) => ({
        _id: data._id,
        name: writeFields.name ? data.name : undefined,
        code: writeFields.code ? data.code : undefined,
        phoneCode: writeFields.phoneCode ? data.phoneCode : undefined,
    }),
});
