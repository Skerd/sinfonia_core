import {IconMapPlus} from "@tabler/icons-react";
import {createGenericCreatePage} from "@coreModule/components/entityPage/createGenericCreatePage.tsx";
import {createStateFormSchema} from "armonia/src/modules/core/api/auxiliary/private/state/createState.form.validator.ts";
import type {CreateStateFormType} from "armonia/src/modules/core/api/auxiliary/private/state/state.schema-def.ts";

export default createGenericCreatePage<CreateStateFormType>({
    languagePath: "src/modules/core/clients/panel/private/tenancy/systemSettings/states/createState.tsx",
    collectionName: "states",
    accessModel: "states",
    apiUrl: "/api/auxiliary/state",
    schema: createStateFormSchema,
    defaultValues: (params) => {
        const countryId = params.get("countryId");
        return ({
            name: "",
            code: "",
            country: countryId ?? "",
        })
    },
    buildFormExtras: (params) => {
        const countryId = params.get("countryId");
        return ({countryIdLocked: !!countryId})
    },
    buildExtraTitles: (params) => {
        const countryName = params.get("countryName");
        return (countryName ? [countryName] : [])
    },
    submitIcon: <IconMapPlus />,
});
