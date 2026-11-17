import {IconDeviceFloppy} from "@tabler/icons-react";
import {createGenericEditPage} from "@coreModule/components/entityPage/pages/createGenericEditPage.tsx";
import {editUserAddressFormSchema} from "armonia/src/modules/core/api/user/private/userAddress/editUserAddress.form.validator.ts";
import type {EditUserAddressFormType} from "armonia/src/modules/core/api/user/private/userAddress/userAddress.schema-def.ts";
import type {UserAddress} from "armonia/src/modules/core/api/user/private/userAddress/userAddress.dto.ts";

export default createGenericEditPage<UserAddress, EditUserAddressFormType>({
    languagePath: "src/modules/core/clients/panel/private/accountSettings/addresses/editUserAddress.tsx",
    collectionName: "userAddresses",
    accessModel: "userAddresses",
    apiUrl: "/api/user/userAddress",
    schema: editUserAddressFormSchema,
    mapEntityData: (data) => ({
        ...data,
        type: data.type,
        country: data.country?._id ?? data.country,
        state: data.state?._id ?? data.state,
        city: data.city?._id ?? data.city,
    }),
    submitIcon: <IconDeviceFloppy />,
});
