import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Card} from "@coreModule/components/ui/card.tsx";
import type {CronJob} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import {cronJobEditPath} from "../../index.tsx";
import {useNavigate} from "react-router-dom";

type Props = WithLanguageType & {
    job: CronJob;
    onDelete: (row: CronJob, response?: DeletedData) => void;
    onRestore: () => void;
};

function CronJobCard({job, resolveLanguageKey}: Props) {
    const navigate = useNavigate();
    const isActive = job.active && !job.pausedAt;
    return (
        <Card className="p-4">
            <button
                type="button"
                className="font-semibold hover:underline text-left"
                onClick={() => navigate(cronJobEditPath(job))}
            >
                {job.name}
            </button>
            <p className="text-muted-foreground text-sm">{job.code}</p>
            <dl className="mt-2 grid grid-cols-2 gap-1 text-xs">
                <dt className="text-muted-foreground">{resolveLanguageKey("handler")}</dt>
                <dd>{job.handler}</dd>
                <dt className="text-muted-foreground">{resolveLanguageKey("nextRunAt")}</dt>
                <dd>{job.nextRunAt ?? "—"}</dd>
                <dt className="text-muted-foreground">{resolveLanguageKey("active")}</dt>
                <dd>{resolveLanguageKey(isActive ? "yes" : "no")}</dd>
            </dl>
        </Card>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/cronJobs/center/cardView/cronJobCard.tsx"),
)(CronJobCard);
