import {useEffect} from "react";
import {Building2} from "lucide-react";
import type {UseFormReturn} from "react-hook-form";
import {createGenericCreatePage} from "@coreModule/components/entityPage/pages/createGenericCreatePage.tsx";
import {newCompanyCreated} from "@coreModule/helpers/redux/slices/uiSlice.ts";
import {store} from "@coreModule/helpers/redux/store/generalStore.ts";
import {createCompanyFormSchema} from "armonia/src/modules/core/api/company/private/company/createCompany.form.validator.ts";
import type {CreateCompanyFormType} from "armonia/src/modules/core/api/company/private/company/company.schema-def.ts";
import {slugifyShopSlug} from "armonia/src/modules/core/api/company/private/company/shopSlug.ts";

export default createGenericCreatePage<CreateCompanyFormType>({
    languagePath: "src/modules/core/clients/panel/private/tenancy/systemSettings/companies/createCompany.tsx",
    collectionName: "companies",
    accessModel: "companies",
    apiUrl: "/api/company",
    schema: createCompanyFormSchema,
    defaultValues: {name: "", vat: "", shopSlug: ""},
    submitIcon: <Building2 />,
    afterSuccess: () => store.dispatch(newCompanyCreated()),
    renderChildren: (form) => <PrefillShopSlug form={form} />,
    mapSubmitPayload: (data) => {
        const postBody: CreateCompanyFormType = {
            name:           data.name,
            shopSlug:       data.shopSlug,
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

function PrefillShopSlug({form}: {form: UseFormReturn<CreateCompanyFormType>}) {
    const name = form.watch("name");
    const shopSlugDirty = form.formState.dirtyFields.shopSlug;

    useEffect(() => {
        if (shopSlugDirty) {
            return;
        }
        form.setValue("shopSlug", slugifyShopSlug(name ?? ""), {shouldDirty: false, shouldValidate: false});
    }, [form, name, shopSlugDirty]);

    return null;
}
