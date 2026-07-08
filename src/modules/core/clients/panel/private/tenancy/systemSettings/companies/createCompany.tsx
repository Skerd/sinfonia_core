import {Building2} from "lucide-react";
import {z} from "zod";
import {createGenericCreatePage} from "@coreModule/components/entityPage/createGenericCreatePage.tsx";
import {newCompanyCreated} from "@coreModule/helpers/redux/slices/uiSlice.ts";
import {store} from "@coreModule/helpers/redux/store/generalStore.ts";
import {createCompanyFormSchema} from "armonia/src/modules/core/api/company/private/company/createCompany.form.validator.ts";
import type {CreateCompanyFormType} from "armonia/src/modules/core/api/company/private/company/company.schema-def.ts";

type CreateCompanyFormPayload = Omit<CreateCompanyFormType, "logo"> & {
    logo?: File;
};

const createCompanySchema = (languageCode: string, form: unknown) =>
    createCompanyFormSchema(languageCode, form).extend({logo: z.instanceof(File).optional()});

export default createGenericCreatePage<CreateCompanyFormPayload>({
    languagePath: "src/modules/core/clients/panel/private/tenancy/systemSettings/companies/createCompany.tsx",
    collectionName: "companies",
    accessModel: "companies",
    apiUrl: "/api/company",
    schema: createCompanySchema,
    defaultValues: {name: "", vat: ""},
    submitIcon: <Building2 />,
    afterSuccess: () => store.dispatch(newCompanyCreated()),
    mapSubmitPayload: (data) => {
        const postBody: CreateCompanyFormType = {
            name:           data.name,
            email:          data.email,
            phoneNumber:    data.phoneNumber,
            addresses:      (data.addresses || []).map((address) => ({
                street:     address.street,
                postalCode: address.postalCode,
                city:       address.city,
                state:      address.state,
                country:    address.country,
                latitude:   address.latitude,
                longitude:   address.longitude,
            })),
            description:    data.description,
            website:        data.website,
            vat:            data.vat,
            allowedDomains: data.allowedDomains || [],
        };
        const formData = new FormData();
        if (data.logo instanceof File) formData.append("files", data.logo);
        formData.append("data", JSON.stringify(postBody));
        return formData;
    },
});
