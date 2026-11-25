import {compose} from "redux";
import {useImperativeHandle, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {Textarea} from "@coreModule/components/ui/textarea.tsx";
import {RadioGroup, RadioGroupItem} from "@coreModule/components/ui/radio-group.tsx";
import type {ContentReport} from "armonia/src/modules/core/api/reports/contentReport.dto.ts";
import {
    REPORT_DECISION_NOTE_MAX,
    REPORT_DECISIONS,
    type ReportDecision,
} from "armonia/src/modules/core/api/reports/report.form.validator.ts";

const LANGUAGE_PATH = "src/modules/core/clients/panel/private/tenancy/reports/reportDialogs.tsx";

type DialogProps = {
    report: ContentReport;
    onClose: () => void;
    onSuccess: (updated: ContentReport) => void;
};

/** The decisions this report offers: a ban needs the account that wrote the thing. */
function decisionsFor(report: ContentReport): ReportDecision[] {
    return REPORT_DECISIONS.filter((decision) => decision !== "accountBanned" || report.hasAuthor);
}

function DecideDialogInner({
    report, onClose, onSuccess, resolveLanguageKey, innerRef, onFilterChange, loading,
}: DialogProps & WithLanguageType & WithAxiosType<ContentReport>) {
    const [decision, setDecision] = useState<ReportDecision>("dismissed");
    const [note, setNote] = useState("");

    useImperativeHandle(innerRef, () => ({
        success: (data: ContentReport) => {
            onSuccess(data);
            onClose();
        },
    }));

    return (
        <ConfirmDialog
            open
            onOpenChange={(next: boolean) => { if (!next && !loading) onClose(); }}
            title={resolveLanguageKey("decide.title")}
            desc={`${report.recordTitle} — ${resolveLanguageKey("decide.description")}`}
            handleConfirm={() => onFilterChange({_id: report._id, decision, ...(note.trim() ? {note: note.trim()} : {})})}
            isLoading={loading}
            destructive={decision === "companySuspended" || decision === "accountBanned"}
        >
            <RadioGroup value={decision} onValueChange={(value) => setDecision(value as ReportDecision)} aria-label={resolveLanguageKey("decide.title")}>
                {decisionsFor(report).map((value) => (
                    <Label key={value} htmlFor={`report-decision-${value}`} className="flex cursor-pointer items-start gap-3 font-normal">
                        <RadioGroupItem id={`report-decision-${value}`} value={value} className="mt-0.5" />
                        <span className="flex flex-col gap-0.5">
                            <span className="font-medium">{resolveLanguageKey(`decisions.${value}.label`)}</span>
                            <span className="text-xs text-muted-foreground">{resolveLanguageKey(`decisions.${value}.hint`)}</span>
                        </span>
                    </Label>
                ))}
            </RadioGroup>
            <Label className="flex-col items-stretch gap-1.5">
                {resolveLanguageKey("decide.noteLabel")}
                <Textarea rows={3} maxLength={REPORT_DECISION_NOTE_MAX} value={note} onChange={(event) => setNote(event.target.value)} className="h-auto py-2" />
                <span className="text-xs font-normal text-muted-foreground">{resolveLanguageKey("decide.noteHint")}</span>
            </Label>
        </ConfirmDialog>
    );
}

const DecideDialog = compose(
    withLanguage(LANGUAGE_PATH),
    withAxios<ContentReport>({method: "POST", url: "/api/reports/desk/decide", data: {}}, true),
    withDebug(true, true, "contentreports"),
)(DecideDialogInner);

function UndoDialogInner({
    report, onClose, onSuccess, resolveLanguageKey, innerRef, onFilterChange, loading,
}: DialogProps & WithLanguageType & WithAxiosType<ContentReport>) {
    useImperativeHandle(innerRef, () => ({
        success: (data: ContentReport) => {
            onSuccess(data);
            onClose();
        },
    }));

    return (
        <ConfirmDialog
            open
            onOpenChange={(next: boolean) => { if (!next && !loading) onClose(); }}
            title={resolveLanguageKey(`undo.${report.decision}.title`)}
            desc={`${report.recordTitle} — ${resolveLanguageKey(`undo.${report.decision}.description`)}`}
            handleConfirm={() => onFilterChange({_id: report._id})}
            isLoading={loading}
        />
    );
}

const UndoDialog = compose(
    withLanguage(LANGUAGE_PATH),
    withAxios<ContentReport>({method: "POST", url: "/api/reports/desk/undo", data: {}}, true),
    withDebug(true, true, "contentreports"),
)(UndoDialogInner);

/** The dialog of the desk action picked on a report's row, card or sheet. */
export default function ReportDialogs({action, ...props}: DialogProps & {action: string}) {
    if (action === "decide") return <DecideDialog {...props} />;
    if (action === "undo") return <UndoDialog {...props} />;
    return null;
}
