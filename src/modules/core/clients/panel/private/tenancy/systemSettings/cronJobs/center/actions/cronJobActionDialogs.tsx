import type {CronJob} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.dto.ts";
import RunCronJobDialog from "../dialogs/runCronJobDialog.tsx";
import PauseCronJobDialog from "../dialogs/pauseCronJobDialog.tsx";
import ResumeCronJobDialog from "../dialogs/resumeCronJobDialog.tsx";

type CronJobActionDialogsProps = {
    action: string;
    job: CronJob;
    onClose: () => void;
    onSuccess: (updated: CronJob) => void;
};

export default function CronJobActionDialogs({action, job, onClose, onSuccess}: CronJobActionDialogsProps) {
    return (
        <>
            {action === "run" && (
                <RunCronJobDialog open onClose={onClose} job={job} onSuccess={onSuccess} />
            )}
            {action === "pause" && (
                <PauseCronJobDialog open onClose={onClose} job={job} onSuccess={onSuccess} />
            )}
            {action === "resume" && (
                <ResumeCronJobDialog open onClose={onClose} job={job} onSuccess={onSuccess} />
            )}
        </>
    );
}
