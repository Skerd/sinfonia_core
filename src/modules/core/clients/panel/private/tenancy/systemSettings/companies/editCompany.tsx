import {Save} from "lucide-react";
import {z} from "zod";
import type {ReactElement} from "react";
import {createGenericEditPage, type GenericEditPageProps} from "@coreModule/components/entityPage/createGenericEditPage.tsx";
import {store} from "@coreModule/helpers/redux/store/generalStore.ts";
import {newCompanyCreated} from "@coreModule/helpers/redux/slices/uiSlice.ts";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";
import type {Company} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";
import {editCompanyFormSchema} from "armonia/src/modules/core/api/company/private/company/editCompany.form.validator.ts";
import {EditCompanyFormType} from "armonia/src/modules/core/api/company/private/company/company.schema-def.ts";

const editCompanyClientFormSchema = (
    languageCode: string,
    form: Record<string, unknown> | undefined,
    permissions: Record<string, unknown>,
    readPermissions: Record<string, unknown>,
) => editCompanyFormSchema(languageCode, form, permissions, readPermissions).extend({logo: z.union([z.instanceof(File), z.string()]).optional(),});

export type EditCompanyFormData = Omit<EditCompanyFormType, "logo"> & {
    logo?: File | string;
};

const EditCompanyForm = createGenericEditPage<Company, EditCompanyFormData>({
    languagePath: "src/modules/core/clients/panel/private/tenancy/systemSettings/companies/editCompany.tsx",
    collectionName: "companies",
    accessModel: "companies",
    apiUrl: "/api/company",
    /** Same company scope as GET — `authMW` resolves `req.company` from `x-company-id`. */
    patchAddToHeader: [{whatToGet: "entityId", whereToPut: "x-company-id"}],
    fetchEntity: (entityId: string) => apiClient.get<Company>("/api/company", {headers: {"x-company-id": entityId}}).then((r) => r.data),
    schema: editCompanyClientFormSchema as any,
    buildInitialValues: (companyData, writeFields): EditCompanyFormData => ({
        _id:            companyData._id,
        name:           writeFields.name           ? companyData.name           : undefined,
        email:          writeFields.email          ? companyData.email          : undefined,
        phoneNumber:    writeFields.phoneNumber    ? companyData.phoneNumber    : undefined,
        website:        writeFields.website        ? companyData.website        : undefined,
        vat:            writeFields.vat            ? companyData.vat            : undefined,
        description:    writeFields.description    ? companyData.description    : undefined,
        allowedDomains: writeFields.allowedDomains ? companyData.allowedDomains || [] : undefined,
        parentCompany:  writeFields.parentCompany  ? companyData.parentCompany?._id : undefined,
        addresses: writeFields.addresses
            ? (companyData.addresses || []).map((address) => ({
                _id:        address._id,
                street:     address.street ?? "",
                postalCode: address.postalCode ?? "",
                city:       address.city?._id ?? "",
                state:      address.state?._id || undefined,
                country:    address.country?._id || "",
                latitude:   address.latitude ?? 41.3275,
                longitude:  address.longitude ?? 19.8189,
            }))
            : undefined,
        logo: writeFields.logo ? companyData.logo : undefined,
    }),
    submitIcon: <Save />,
    afterSuccess: () => store.dispatch(newCompanyCreated()),
    mapSubmitPayload: (data, {writeFields}) => {
        const postBody: EditCompanyFormType = {
            _id:            data._id!,
            name:           data.name,
            email:          data.email,
            phoneNumber:    data.phoneNumber,
            description:    data.description,
            website:        data.website,
            vat:            data.vat,
            parentCompany:  data.parentCompany,
            allowedDomains: data.allowedDomains || [],
            addresses:      (data.addresses || []).map((addr) => ({
                street:     addr.street,
                postalCode: addr.postalCode,
                city:       addr.city,
                state:      addr.state,
                country:    addr.country,
                latitude:   addr.latitude,
                longitude:  addr.longitude,
            })),
        };

        const formData = new FormData();
        if (writeFields.logo && data.logo instanceof File) {
            formData.append("files", data.logo);
        }
        formData.append("data", JSON.stringify(postBody));
        return formData;
    },
});

type EditCompanyOuterProps = GenericEditPageProps & {
    companyId?: string | null;
    companyName?: string | null;
    overrideCompanyId?: string | null;
};

export default function EditCompany(props: EditCompanyOuterProps): ReactElement {
    const {companyId, companyName} = props;

    return (
        <EditCompanyForm
            entityId={companyId}
            entityName={companyName}
        />
    );
}
