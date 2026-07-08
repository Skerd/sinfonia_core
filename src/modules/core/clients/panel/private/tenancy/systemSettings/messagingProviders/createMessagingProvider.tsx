import {MessageSquarePlus} from "lucide-react";
import {createGenericCreatePage} from "@coreModule/components/entityPage/createGenericCreatePage.tsx";
import {createMessagingProviderFormSchema} from "armonia/src/modules/core/api/auxiliary/private/messagingProvider/createMessagingProvider.form.validator.ts";
import type {CreateMessagingProviderFormType} from "armonia/src/modules/core/api/auxiliary/private/messagingProvider/messagingProvider.schema-def.ts";

export default createGenericCreatePage<CreateMessagingProviderFormType>({
    languagePath:   "src/modules/core/clients/panel/private/tenancy/systemSettings/messagingProviders/createMessagingProvider.tsx",
    model:          "messagingproviders",
    accessModel:    "messagingProviders",
    apiUrl:         "/api/auxiliary/messagingProvider",
    schema:         createMessagingProviderFormSchema,
    defaultValues:  {name: "", providerType: "twilio", accountSid: "", authToken: ""},
    successPath:    "/tenancy/systemSettings/messagingProviders",
    submitIcon:     <MessageSquarePlus />,
});
