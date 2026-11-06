import {IconBuildingCommunity} from "@tabler/icons-react";
import {useEffect} from "react";
import type {UseFormReturn} from "react-hook-form";
import {createGenericCreatePage} from "@coreModule/components/entityPage/pages/createGenericCreatePage.tsx";
import {createCompanyFormSchema} from "armonia/src/modules/core/api/company/private/company/createCompany.form.validator.ts";
import type {CreateCompanyFormType} from "armonia/src/modules/core/api/company/private/company/company.schema-def.ts";
import {slugifySiteSlug} from "armonia/src/modules/core/api/company/private/company/siteSlug.ts";

export default createGenericCreatePage<CreateCompanyFormType>({
    languagePath: "src/modules/core/clients/panel/private/tenancy/systemSettings/companies/createCompany.tsx",
    collectionName: "companies",
    accessModel: "companies",
    apiUrl: "/api/company",
    schema: createCompanyFormSchema,
    defaultValues: {name: "", vat: "", siteSlug: ""},
    submitIcon: <IconBuildingCommunity />,
    renderChildren: (form) => <PrefillSiteSlug form={form} />,
    mapSubmitPayload: (data) => {
        const postBody: CreateCompanyFormType = {
            name:           data.name,
            siteSlug:       data.siteSlug,
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

function PrefillSiteSlug({form}: {form: UseFormReturn<CreateCompanyFormType>}) {
    const name = form.watch("name");
    const siteSlugDirty = form.formState.dirtyFields.siteSlug;

    useEffect(() => {
        if (siteSlugDirty) {
            return;
        }
        form.setValue("siteSlug", slugifySiteSlug(name ?? ""), {shouldDirty: false, shouldValidate: false});
    }, [form, name, siteSlugDirty]);

    return null;
}
