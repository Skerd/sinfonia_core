import {IconBuildingCommunity} from "@tabler/icons-react";
import {createGenericCreatePage} from "@coreModule/components/entityPage/pages/createGenericCreatePage.tsx";
import {PrefillSlug} from "@coreModule/components/entityPage/pages/prefillSlug.tsx";
import {createCompanyFormSchema} from "armonia/src/modules/core/api/company/private/company/createCompany.form.validator.ts";
import type {CreateCompanyFormType} from "armonia/src/modules/core/api/company/private/company/company.schema-def.ts";
import {SITE_SLUG_MAX} from "armonia/src/modules/core/api/company/private/company/siteSlug.ts";

export default createGenericCreatePage<CreateCompanyFormType>({
    languagePath: "src/modules/core/clients/panel/private/tenancy/systemSettings/companies/createCompany.tsx",
    collectionName: "companies",
    accessModel: "companies",
    apiUrl: "/api/company",
    schema: createCompanyFormSchema,
    defaultValues: {name: "", vat: "", siteSlug: ""},
    submitIcon: <IconBuildingCommunity />,
    renderChildren: (form) => <PrefillSlug form={form} from="name" to="siteSlug" max={SITE_SLUG_MAX} />,
    mapSubmitPayload: (data) => {
        const postBody: CreateCompanyFormType = {
            name:           data.name,
            siteSlug:       data.siteSlug,
            timezone:       data.timezone,
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
        };
        const formData = new FormData();
        if (data.logo instanceof File) formData.append("files", data.logo);
        formData.append("data", JSON.stringify(postBody));
        return formData;
    },
});
