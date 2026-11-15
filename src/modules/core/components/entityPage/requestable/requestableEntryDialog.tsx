import {compose} from "redux";
import {useImperativeHandle, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {Textarea} from "@coreModule/components/ui/textarea.tsx";
import type {RequestableEntry, RequestDecision} from "@coreModule/components/entityPage/requestable/requestableEntry.tsx";

type OwnProps = {
    decision: RequestDecision;
    entry: RequestableEntry;
    /** The list's API base, e.g. `/api/auxiliary/city`; the decision posts to `<apiUrl>/<decision>`. */
    apiUrl: string;
    onClose: () => void;
    /** The entry as the server stored the decision (rejected or withdrawn ones come back deleted). */
    onDecided: (decided: RequestableEntry) => void;
};

type DecisionBody = {_id: string; notes?: string};

type Props = OwnProps & WithLanguageType & WithAxiosType<unknown, DecisionBody> & {url: string};

/**
 * Confirms one decision on a requested entry (D160). Rejecting needs a reason the requester will read; the platform
 * corrects an entry with the list's edit form before approving it.
 */
function RequestableEntryDialogInner({decision, entry, onClose, onDecided, resolveLanguageKey, innerRef, onFilterChange, loading}: Props) {
    const [notes, setNotes] = useState("");

    useImperativeHandle(innerRef, () => ({
        success: (decided: RequestableEntry) => {
            onDecided(decided);
            onClose();
        },
    }));

    const reasonMissing = decision === "reject" && notes.trim() === "";

    return (
        <ConfirmDialog
            open
            onOpenChange={(open: boolean) => { if (!open && !loading) onClose(); }}
            title={String(resolveLanguageKey(`${decision}.title`)).replace("{name}", typeof entry.name === "string" ? entry.name : "")}
            desc={resolveLanguageKey(`${decision}.description`)}
            confirmText={resolveLanguageKey(`${decision}.confirm`)}
            destructive={decision !== "approve"}
            disabled={reasonMissing}
            isLoading={loading}
            handleConfirm={() => onFilterChange(decision === "reject" ? {_id: entry._id, notes: notes.trim()} : {_id: entry._id})}
        >
            {decision === "reject" && (
                <div className="flex flex-col gap-2">
                    <Label htmlFor="entry-request-reason">{resolveLanguageKey("reasonLabel")}</Label>
                    <Textarea
                        id="entry-request-reason"
                        value={notes}
                        placeholder={resolveLanguageKey("reasonPlaceholder")}
                        onChange={(event) => setNotes(event.target.value)}
                        disabled={loading}
                    />
                </div>
            )}
        </ConfirmDialog>
    );
}

const RequestableEntryDialogConnected = compose(
    withLanguage("src/modules/core/components/entityPage/requestable/requestableEntryDialog.tsx"),
    withAxios({method: "POST", url: "toBeDeterminedByProp", data: {}}, true),
    withDebug(true, true),
)(RequestableEntryDialogInner);

export default function RequestableEntryDialog(props: OwnProps) {
    return <RequestableEntryDialogConnected {...props} url={`${props.apiUrl}/${props.decision}`} />;
}
