import {createGenericEditPage} from "@coreModule/components/entityPage/createGenericEditPage.tsx";
import {editCityFormSchema} from "armonia/src/modules/core/api/auxiliary/private/city/editCity.form.validator.ts";
import type {City} from "armonia/src/modules/core/api/auxiliary/private/city/city.dto.ts";
import type {EditCityFormType} from "armonia/src/modules/core/api/auxiliary/private/city/city.schema-def.ts";

export default createGenericEditPage<City, EditCityFormType>({
    languagePath: "src/modules/core/clients/panel/private/tenancy/systemSettings/cities/editCity.tsx",
    collectionName: "cities",
    accessModel: "cities",
    apiUrl: "/api/auxiliary/city",
    schema: editCityFormSchema,
    buildInitialValues: (data, writeFields) => ({
        _id: data._id,
        name: writeFields.name ? data.name : undefined,
        country: writeFields.country ? data.country?._id : undefined,
        state: writeFields.state ? data.state?._id : undefined,
    }),
    buildExtraTitles: (params) => {
        const countryName = params.get("countryName");
        const stateName = params.get("stateName");
        return [countryName ?? "", stateName ?? ""]
    },
});
