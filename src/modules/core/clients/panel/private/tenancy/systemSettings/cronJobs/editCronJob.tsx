import {createGenericEditPage} from "@coreModule/components/entityPage/createGenericEditPage.tsx";
import {editCronJobFormSchema} from "armonia/src/modules/core/api/auxiliary/private/cronJob/editCronJob.form.validator.ts";
import type {CronJob} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.dto.ts";
import type {EditCronJobFormType} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.schema-def.ts";
import {Save} from "lucide-react";

export default createGenericEditPage<CronJob, EditCronJobFormType>({
    languagePath: "src/modules/core/clients/panel/private/tenancy/systemSettings/cronJobs/editCronJob.tsx",
    collectionName: "cronjobs",
    accessModel: "cronjobs",
    apiUrl: "/api/auxiliary/cron-jobs",
    schema: editCronJobFormSchema,
    buildInitialValues: (data, writeFields) => ({
        _id: data._id,
        name: writeFields.name ? data.name : undefined,
        description: writeFields.description ? data.description : undefined,
        cronExpression: writeFields.cronExpression ? data.cronExpression : undefined,
        maxRetries: writeFields.maxRetries ? data.maxRetries : undefined,
        retryDelaySeconds: writeFields.retryDelaySeconds ? data.retryDelaySeconds : undefined,
        timeoutSeconds: writeFields.timeoutSeconds ? data.timeoutSeconds : undefined,
        priority: writeFields.priority ? data.priority : undefined,
        missedRunPolicy: writeFields.missedRunPolicy ? data.missedRunPolicy : undefined,
    }),
    submitIcon: <Save />,
});
