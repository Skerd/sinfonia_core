import {IconCalendarClock, IconAlertTriangle} from "@tabler/icons-react";
import {useEffect, useState} from "react";
import {useSelector} from "react-redux";
import {useWatch, type UseFormReturn} from "react-hook-form";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {DATE_FORMATS, formatDate} from "@coreModule/helpers/general/dateTime.ts";
import type {CronJobRunsPreview as RunsPreview} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.dto.ts";
import type {EditCronJobFormType} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.schema-def.ts";

/** Wait for the user to stop typing before asking the server. */
const DEBOUNCE_MS = 400;
const PREVIEW_REQUEST = {method: "post" as const, url: "/api/auxiliary/cron-jobs/previewNextRuns", data: {}};

type CronJobRunsPreviewProps = {
    form: UseFormReturn<EditCronJobFormType>;
    jobId: string;
    resolveLanguageKey: ResolveLanguageKey;
};

/** The next runs of the expression being typed, so a schedule can be checked before it is saved. */
export default function CronJobRunsPreview({form, jobId, resolveLanguageKey}: CronJobRunsPreviewProps) {
    const expression = useWatch({control: form.control, name: "cronExpression"})?.trim();
    const {timezone} = useSelector((state: RootState) => state.authentication.user);
    const [request, setRequest] = useState({body: {} as Record<string, unknown>, count: 0});

    useEffect(() => {
        if (!expression) return;
        const timer = setTimeout(() => {
            setRequest((current) => ({body: {_id: jobId, cronExpression: expression}, count: current.count + 1}));
        }, DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [jobId, expression]);

    // Silent: an expression the server cannot read shows no preview.
    const {data, error} = useHttpRequest<RunsPreview>(PREVIEW_REQUEST, request.body, request.count);
    const preview = expression && !error ? data : null;

    if (!preview) return null;

    const rk = (key: string) => String(resolveLanguageKey(`preview.${key}`));

    if (!preview.valid) {
        return (
            <p className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
                <IconAlertTriangle className="size-4 shrink-0" aria-hidden />
                {rk("never")}
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 px-3 py-2">
            <p className="flex items-center gap-2 text-sm font-medium">
                <IconCalendarClock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                {rk("title")}
            </p>
            <ol className="flex flex-col gap-1 text-sm tabular-nums text-muted-foreground">
                {preview.nextRunsPreview.map((run) => (
                    <li key={run}>{formatDate(run, {timeZone: timezone, format: DATE_FORMATS.dateTime})}</li>
                ))}
            </ol>
        </div>
    );
}
