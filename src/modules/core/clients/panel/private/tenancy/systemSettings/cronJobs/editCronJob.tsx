import {createGenericEditPage} from "@coreModule/components/entityPage/createGenericEditPage.tsx";
import {editCronJobFormSchema} from "armonia/src/modules/core/api/auxiliary/private/cronJob/editCronJob.form.validator.ts";
import type {CronJob} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.dto.ts";
import type {EditCronJobFormType} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.schema-def.ts";
import {Save} from "lucide-react";

export default createGenericEditPage<CronJob, EditCronJobFormType>({
    languagePath: "src/modules/core/clients/panel/private/tenancy/systemSettings/cronJobs/editCronJob.tsx",
    collectionName: "cronjobs",
    accessModel: "cronJobs",
    apiUrl: "/api/auxiliary/cron-jobs",
    schema: editCronJobFormSchema,
    buildInitialValues: (data, writeFields) => ({
        _id: data._id,
        code: writeFields.code ? data.code : undefined,
        name: writeFields.name ? data.name : undefined,
        description: writeFields.description ? data.description : undefined,
        active: writeFields.active ? data.active : undefined,
        handler: writeFields.handler ? data.handler : undefined,
        type: writeFields.type ? data.type : undefined,
        cronExpression: writeFields.cronExpression ? data.cronExpression : undefined,
        interval: writeFields.interval ? data.interval : undefined,
        timezone: writeFields.timezone ? data.timezone : undefined,
        maxRetries: writeFields.maxRetries ? data.maxRetries : undefined,
        retryDelaySeconds: writeFields.retryDelaySeconds ? data.retryDelaySeconds : undefined,
        timeoutSeconds: writeFields.timeoutSeconds ? data.timeoutSeconds : undefined,
        singleton: writeFields.singleton ? data.singleton : undefined,
        allowParallelRuns: writeFields.allowParallelRuns ? data.allowParallelRuns : undefined,
        priority: writeFields.priority ? data.priority : undefined,
        executionStrategy: writeFields.executionStrategy ? data.executionStrategy : undefined,
        queueName: writeFields.queueName ? data.queueName : undefined,
        missedRunPolicy: writeFields.missedRunPolicy ? data.missedRunPolicy : undefined,
        maxConcurrentRuns: writeFields.maxConcurrentRuns ? data.maxConcurrentRuns : undefined,
        scope: writeFields.scope ? data.scope : undefined,
        company: writeFields.company ? data.company?._id : undefined,
        tags: writeFields.tags ? data.tags : undefined,
    }),
    submitIcon: <Save />,
});
