import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useImperativeHandle} from "react";
import {toast} from "sonner";
import {LoaderCircle, Send} from "lucide-react";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@coreModule/components/ui/alert-dialog.tsx";
import {formatNumber} from "@coreModule/helpers/general/numbers.ts";
import type {
    KafkaDeadLetterBacklog,
    KafkaDeadLetterReplayDto
} from "armonia/src/modules/core/api/auxiliary/private/serverHealth/serverHealth.dto.ts";

type ReplayDeadLettersDialogProps = WithLanguageType & WithAxiosType<KafkaDeadLetterReplayDto, {}> & {
    open: boolean;
    onClose: () => void;
    deadLetters: KafkaDeadLetterBacklog[];
};

/** Confirms, then resends every Kafka dead letter onto its original topic. */
function ReplayDeadLettersDialog({
    open,
    onClose,
    deadLetters,
    resolveLanguageKey,
    innerRef,
    onFilterChange,
    loading,
}: ReplayDeadLettersDialogProps) {
    useImperativeHandle(innerRef, () => ({
        success: (data: KafkaDeadLetterReplayDto) => {
            toast.success(resolveLanguageKey("resent").replace("{count}", formatNumber(data.replayed)));
            onClose();
        },
    }));

    const handleOpenChange = (next: boolean) => {
        if (!next && !loading) onClose();
    };
    const total = deadLetters.reduce((sum, entry) => sum + entry.pending, 0);

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{resolveLanguageKey("confirmTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {resolveLanguageKey("confirmDescription").replace("{count}", formatNumber(total))}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex max-h-64 flex-col gap-y-1 overflow-y-auto rounded-md border p-2 text-xs">
                    {deadLetters.map((entry) => (
                        <div key={entry.topic} className="flex items-baseline justify-between gap-x-3">
                            <span className="min-w-0 break-words font-medium">{entry.topic}</span>
                            <span className="shrink-0 tabular-nums">{formatNumber(entry.pending)}</span>
                        </div>
                    ))}
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>
                        {resolveLanguageKey("cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onFilterChange({});
                        }}
                        disabled={loading}
                    >
                        {loading ? <LoaderCircle className="animate-spin"/> : <Send />}
                        <p>{resolveLanguageKey("confirm")}</p>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/online/serverHealth/replayDeadLettersDialog.tsx"),
    withAxios(
        {
            method: "post",
            url: "/api/auxiliary/health/kafka/dead-letters/replay",
            data: {},
        },
        true,
    ),
    withDebug(true, true),
)(ReplayDeadLettersDialog);
