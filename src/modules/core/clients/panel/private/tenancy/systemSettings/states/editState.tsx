import {createGenericEditPage} from "@coreModule/components/entityPage/createGenericEditPage.tsx";
import {editStateFormSchema} from "armonia/src/modules/core/api/auxiliary/private/state/editState.form.validator.ts";
import type {State} from "armonia/src/modules/core/api/auxiliary/private/state/state.dto.ts";
import type {EditStateFormType} from "armonia/src/modules/core/api/auxiliary/private/state/state.schema-def.ts";

export default createGenericEditPage<State, EditStateFormType>({
    languagePath: "src/modules/core/clients/panel/private/tenancy/systemSettings/states/editState.tsx",
    collectionName: "states",
    accessModel: "states",
    apiUrl: "/api/auxiliary/state",
    schema: editStateFormSchema,
    buildInitialValues: (data, writeFields) => ({
        _id: data._id,
        name: writeFields.name ? data.name : undefined,
        code: writeFields.code ? data.code : undefined,
        country: writeFields.country ? data.country?._id : undefined,
    }),
    buildExtraTitles: (params) => {
        const countryName = params.get("countryName");
        const stateName = params.get("stateName");
        return [countryName ?? "", stateName ?? ""]
    },});
