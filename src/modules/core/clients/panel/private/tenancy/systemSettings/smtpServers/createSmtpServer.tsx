import {IconMailPlus} from "@tabler/icons-react";
import {createGenericCreatePage} from "@coreModule/components/entityPage/createGenericCreatePage.tsx";
import {createSmtpServerFormSchema} from "armonia/src/modules/core/api/auxiliary/private/smtpServer/createSmtpServer.form.validator.ts";
import type {CreateSmtpServerFormType} from "armonia/src/modules/core/api/auxiliary/private/smtpServer/smtpServer.schema-def.ts";

export default createGenericCreatePage<CreateSmtpServerFormType>({
    languagePath: "src/modules/core/clients/panel/private/tenancy/systemSettings/smtpServers/createSmtpServer.tsx",
    collectionName: "smtpservers",
    accessModel: "smtpServers",
    apiUrl: "/api/auxiliary/smtpServer",
    schema: createSmtpServerFormSchema,
    defaultValues: {
        name: "",
        sequence: 10,
        active: true,
        host: "",
        port: 587,
        encryption: "starttls",
        authType: "login",
        username: "",
        password: "",
        fromEmail: "",
        fromName: "",
        replyTo: "",
    },
    successPath: "/tenancy/systemSettings/smtpServers",
    submitIcon: <IconMailPlus />,
});
