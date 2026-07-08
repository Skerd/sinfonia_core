import {IconBuildingPlus} from "@tabler/icons-react";
import {createGenericCreatePage} from "@coreModule/components/entityPage/createGenericCreatePage.tsx";
import {createCityFormSchema} from "armonia/src/modules/core/api/auxiliary/private/city/createCity.form.validator.ts";
import type {CreateCityFormType} from "armonia/src/modules/core/api/auxiliary/private/city/city.schema-def.ts";

export default createGenericCreatePage<CreateCityFormType>({
    languagePath: "src/modules/core/clients/panel/private/tenancy/systemSettings/cities/createCity.tsx",
    collectionName: "cities",
    accessModel: "cities",
    apiUrl: "/api/auxiliary/city",
    schema: createCityFormSchema,
    defaultValues: () => {
        const params = new URLSearchParams();
        const countryId = params.get("countryId");
        const stateId = params.get("stateId");
        return ({
            name: "",
            country: countryId ?? "",
            state: stateId ?? undefined
        })
    },
    buildFormExtras: (params) => {
        const countryId = params.get("countryId");
        const stateId = params.get("stateId");
        return ({
            lockCountrySelect: !!(countryId || stateId),
            lockStateSelect: !!stateId
        })
    },
    buildExtraTitles: (params) => {
        const countryName = params.get("countryName");
        const stateName = params.get("stateName");
        return [countryName ?? "", stateName ?? ""]
    },
    submitIcon: <IconBuildingPlus />,
});
