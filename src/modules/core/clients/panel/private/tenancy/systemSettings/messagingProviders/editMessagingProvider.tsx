import {Save} from "lucide-react";
import {createGenericEditPage} from "@coreModule/components/entityPage/createGenericEditPage.tsx";
import {editMessagingProviderFormSchema} from "armonia/src/modules/core/api/auxiliary/private/messagingProvider/editMessagingProvider.form.validator.ts";
import type {MessagingProvider} from "armonia/src/modules/core/api/auxiliary/private/messagingProvider/messagingProvider.dto.ts";
import type {EditMessagingProviderFormType} from "armonia/src/modules/core/api/auxiliary/private/messagingProvider/messagingProvider.schema-def.ts";

export default createGenericEditPage<MessagingProvider, EditMessagingProviderFormType>({
    languagePath:   "src/modules/core/clients/panel/private/tenancy/systemSettings/messagingProviders/editMessagingProvider.tsx",
    model:          "messagingproviders",
    accessModel:    "messagingProviders",
    apiUrl:         "/api/auxiliary/messagingProvider",
    schema:         editMessagingProviderFormSchema,
    buildInitialValues: (data, writeFields) => ({
        _id: data._id,
        name: writeFields.name ? data.name : undefined,
        providerType: writeFields.providerType ? data.providerType : undefined,
        accountSid: writeFields.accountSid ? data.accountSid : undefined,
        authToken: undefined,
        fromPhone: writeFields.fromPhone ? data.fromPhone ?? "" : undefined,
        fromWhatsapp: writeFields.fromWhatsapp ? data.fromWhatsapp ?? "" : undefined,
    }),
    submitIcon: <Save />,
});
