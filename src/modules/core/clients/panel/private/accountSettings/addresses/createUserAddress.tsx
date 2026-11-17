import {IconPlus} from "@tabler/icons-react";
import {createGenericCreatePage} from "@coreModule/components/entityPage/pages/createGenericCreatePage.tsx";
import {createUserAddressFormSchema} from "armonia/src/modules/core/api/user/private/userAddress/createUserAddress.form.validator.ts";
import type {CreateUserAddressFormType} from "armonia/src/modules/core/api/user/private/userAddress/userAddress.schema-def.ts";

export default createGenericCreatePage<CreateUserAddressFormType>({
    languagePath: "src/modules/core/clients/panel/private/accountSettings/addresses/createUserAddress.tsx",
    collectionName: "userAddresses",
    accessModel: "userAddresses",
    apiUrl: "/api/user/userAddress",
    schema: createUserAddressFormSchema,
    defaultValues: () => ({
        type: "shipping",
        firstName: "",
        lastName: "",
        street: "",
    }),
    submitIcon: <IconPlus />,
});
