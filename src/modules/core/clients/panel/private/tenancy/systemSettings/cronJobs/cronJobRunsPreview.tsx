import {useEffect, useState} from "react";
import {useSelector} from "react-redux";
import {useWatch, type UseFormReturn} from "react-hook-form";
import {CalendarClock, TriangleAlert} from "lucide-react";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import {DATE_FORMATS, formatDate} from "@coreModule/helpers/general/dateTime.ts";
import type {CronJobRunsPreview as RunsPreview} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.dto.ts";
import type {EditCronJobFormType} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.schema-def.ts";

/** Wait for the user to stop typing before asking the server. */
const DEBOUNCE_MS = 400;

type CronJobRunsPreviewProps = {
    form: UseFormReturn<EditCronJobFormType>;
    jobId: string;
    resolveLanguageKey: ResolveLanguageKey;
};

/** The next runs of the expression being typed, so a schedule can be checked before it is saved. */
export default function CronJobRunsPreview({form, jobId, resolveLanguageKey}: CronJobRunsPreviewProps) {
    const expression = useWatch({control: form.control, name: "cronExpression"})?.trim();
    const {timezone} = useSelector((state: RootState) => state.authentication.user);
    const [preview, setPreview] = useState<RunsPreview | null>(null);

    useEffect(() => {
        if (!expression) {
            setPreview(null);
            return;
        }
        let cancelled = false;
        const timer = setTimeout(() => {
            apiClient.post<RunsPreview>("/api/auxiliary/cron-jobs/previewNextRuns", {_id: jobId, cronExpression: expression})
                .then((res) => {
                    if (!cancelled) setPreview(res.data);
                })
                .catch(() => {
                    if (!cancelled) setPreview(null);
                });
        }, DEBOUNCE_MS);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [jobId, expression]);

    if (!preview) return null;

    const rk = (key: string) => String(resolveLanguageKey(`preview.${key}`));

    if (!preview.valid) {
        return (
            <p className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
                <TriangleAlert className="size-4 shrink-0" aria-hidden />
                {rk("never")}
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 px-3 py-2">
            <p className="flex items-center gap-2 text-sm font-medium">
                <CalendarClock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
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
