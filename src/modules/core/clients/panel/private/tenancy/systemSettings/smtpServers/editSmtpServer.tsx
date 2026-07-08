import {Save} from "lucide-react";
import {createGenericEditPage} from "@coreModule/components/entityPage/createGenericEditPage.tsx";
import {editSmtpServerFormSchema} from "armonia/src/modules/core/api/auxiliary/private/smtpServer/editSmtpServer.form.validator.ts";
import type {SmtpServer} from "armonia/src/modules/core/api/auxiliary/private/smtpServer/smtpServer.dto.ts";
import type {EditSmtpServerFormType} from "armonia/src/modules/core/api/auxiliary/private/smtpServer/smtpServer.schema-def.ts";

export default createGenericEditPage<SmtpServer, EditSmtpServerFormType>({
    languagePath: "src/modules/core/clients/panel/private/tenancy/systemSettings/smtpServers/editSmtpServer.tsx",
    collectionName: "smtpservers",
    accessModel: "smtpServers",
    apiUrl: "/api/auxiliary/smtpServer",
    schema: editSmtpServerFormSchema,
    buildInitialValues: (data, writeFields) => ({
        _id: data._id,
        name: writeFields.name ? data.name : undefined,
        sequence: writeFields.sequence ? data.sequence : undefined,
        active: writeFields.active ? data.active : undefined,
        host: writeFields.host ? data.host : undefined,
        port: writeFields.port ? data.port : undefined,
        encryption: writeFields.encryption ? data.encryption : undefined,
        authType: writeFields.authType ? data.authType : undefined,
        username: writeFields.username ? data.username ?? "" : undefined,
        password: undefined,
        fromEmail: writeFields.fromEmail ? data.fromEmail : undefined,
        fromName: writeFields.fromName ? data.fromName ?? "" : undefined,
        replyTo: writeFields.replyTo ? data.replyTo ?? "" : undefined,
    }),
    submitIcon: <Save />,
});
