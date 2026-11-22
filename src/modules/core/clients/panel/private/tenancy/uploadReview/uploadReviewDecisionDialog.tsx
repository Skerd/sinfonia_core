import {useImperativeHandle} from "react";
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import type {UploadReviewItem} from "armonia/src/modules/core/api/auxiliary/private/uploadReview/uploadReview.dto.ts";

type DecisionDialogOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: UploadReviewItem;
    decision: "approve" | "remove";
    /** After the decision is saved, with the file as it now is. */
    onDone: (decided?: UploadReviewItem) => void;
};

type DecisionDialogProps = DecisionDialogOwnProps & WithLanguageType & WithAxiosType<UploadReviewItem> & {
    endpoint: "approve" | "remove";
};

/** Confirms a review decision, says what it does to the file, and sends it. */
function UploadReviewDecisionDialogInner({open, onOpenChange, item, decision, onDone, resolveLanguageKey, innerRef, onFilterChange, loading}: DecisionDialogProps) {
    useImperativeHandle(innerRef, () => ({
        success: (decided: UploadReviewItem) => {
            onOpenChange(false);
            onDone(decided);
        },
        error: () => onOpenChange(false),
    }));

    return (
        <ConfirmDialog
            open={open}
            onOpenChange={(next: boolean) => { if (!loading) onOpenChange(next); }}
            title={resolveLanguageKey(`${decision}.title`)}
            desc={resolveLanguageKey(`${decision}.description`).replace("{name}", item.fileName)}
            confirmText={resolveLanguageKey(`${decision}.confirm`)}
            destructive={decision === "remove"}
            handleConfirm={() => onFilterChange({_id: item._id})}
            isLoading={loading}
        />
    );
}

const UploadReviewDecisionDialogConnected = compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/uploadReview/uploadReviewDecisionDialog.tsx"),
    withAxios<UploadReviewItem>(
        {
            method: "POST",
            url: "/api/auxiliary/uploadReview",
            data: {},
            addToPath: [{whatToGet: ["endpoint"]}],
            onSuccessMessage: {if: "status", condition: "rejected", message: "removed"},
        },
        true,
    ),
    withDebug(true, true, "media"),
)(UploadReviewDecisionDialogInner);

export default function UploadReviewDecisionDialog(props: DecisionDialogOwnProps) {
    return <UploadReviewDecisionDialogConnected {...props} endpoint={props.decision} />;
}
