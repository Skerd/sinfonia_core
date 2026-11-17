import {IconPlus} from "@tabler/icons-react";
import {createGenericCreatePage} from "@coreModule/components/entityPage/pages/createGenericCreatePage.tsx";
import {createUserAddressFormSchema} from "armonia/src/modules/core/api/user/private/userAddress/createUserAddress.form.validator.ts";
import type {CreateUserAddressFormType} from "armonia/src/modules/core/api/user/private/userAddress/userAddress.schema-def.ts";
import {PlaceFromCity} from "./placeFromCity.tsx";

export default createGenericCreatePage<CreateUserAddressFormType>({
    languagePath: "src/modules/core/clients/panel/private/accountSettings/addresses/createUserAddress.tsx",
    collectionName: "userAddresses",
    accessModel: "userAddresses",
    apiUrl: "/api/user/userAddress",
    // Back to the book, wherever the form was opened from (a link would otherwise go back to that page, TD-F129).
    successPath: "/account/addresses",
    schema: createUserAddressFormSchema,
    // Most addresses are the person's own, in the company's country (TD-F114); all of it can be changed.
    defaultValues: (_params, {user}) => ({
        type: "shipping",
        firstName: user.name ?? "",
        lastName: user.surname ?? "",
        email: user.email || undefined,
        country: user.company.country,
        street: "",
    }),
    renderChildren: (form) => <PlaceFromCity form={form}/>,
    submitIcon: <IconPlus />,
});
