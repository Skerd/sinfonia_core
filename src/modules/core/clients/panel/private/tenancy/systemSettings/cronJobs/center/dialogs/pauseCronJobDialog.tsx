import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useImperativeHandle} from "react";
import type {SingleForm} from "armonia/src/modules/core/types/shared.types.ts";
import {LoaderCircle, Pause} from "lucide-react";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@coreModule/components/ui/alert-dialog.tsx";
import type {CronJob} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.dto.ts";

type PauseCronJobDialogProps = WithLanguageType & WithAxiosType<CronJob, SingleForm> & {
    open: boolean;
    onClose: () => void;
    job: CronJob;
    onSuccess?: (updated: CronJob) => void;
};

function PauseCronJobDialog({
    job,
    open,
    onClose,
    resolveLanguageKey,
    innerRef,
    onFilterChange,
    onSuccess = () => {},
    loading,
}: PauseCronJobDialogProps) {
    useImperativeHandle(innerRef, () => ({
        success: (data: CronJob) => {
            onSuccess(data);
            onClose();
        },
    }));

    const handleOpenChange = (next: boolean) => {
        if (!next && !loading) onClose();
    };

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{resolveLanguageKey("confirmTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {resolveLanguageKey("confirmDescription")}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>
                        {resolveLanguageKey("cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onFilterChange({_id: job._id});
                        }}
                        disabled={loading}
                    >
                        {(loading) ? <LoaderCircle className="animate-spin"/> : <Pause />}
                        <p>{resolveLanguageKey("confirm")}</p>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/cronJobs/center/dialogs/pauseCronJobDialog.tsx"),
    withAxios<CronJob, SingleForm>(
        {
            method: "post",
            url: "/api/auxiliary/cron-jobs/pause",
            data: {},
        },
        true,
    ),
    withDebug(true, true, "cronjobs"),
)(PauseCronJobDialog);
