import type {CronJob} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.dto.ts";

export function cronJobEditPath(job: Pick<CronJob, "_id" | "name">) {
    const params = new URLSearchParams();
    params.set("cronJobId", job._id);
    if (job.name) params.set("cronJobName", job.name);
    return `/tenancy/systemSettings/cronJobs/edit?${params.toString()}`;
}
