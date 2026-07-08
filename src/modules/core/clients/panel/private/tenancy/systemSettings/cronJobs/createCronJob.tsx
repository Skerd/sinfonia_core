import {createGenericCreatePage} from "@coreModule/components/entityPage/createGenericCreatePage.tsx";
import {createCronJobFormSchema} from "armonia/src/modules/core/api/auxiliary/private/cronJob/createCronJob.form.validator.ts";
import type {CreateCronJobFormType} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.schema-def.ts";
import {IconPlus} from "@tabler/icons-react";

export default createGenericCreatePage<CreateCronJobFormType>({
    languagePath: "src/modules/core/clients/panel/private/tenancy/systemSettings/cronJobs/createCronJob.tsx",
    collectionName: "cronjobs",
    accessModel: "cronJobs",
    apiUrl: "/api/auxiliary/cron-jobs",
    schema: createCronJobFormSchema,
    defaultValues: {
        code: "",
        name: "",
        description: "",
        active: true,
        handler: "",
        type: "cron",
        cronExpression: "0 0 * * * *",
        timezone: "UTC",
        maxRetries: 3,
        retryDelaySeconds: 60,
        timeoutSeconds: 300,
        singleton: true,
        allowParallelRuns: false,
        priority: 10,
        executionStrategy: "distributed",
        missedRunPolicy: "skip",
        scope: "company",
    },
    successPath: "/tenancy/cronJobs",
    submitIcon: <IconPlus />,
});
