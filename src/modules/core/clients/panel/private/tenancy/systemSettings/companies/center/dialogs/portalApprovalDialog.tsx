import {compose} from "redux";
import {useImperativeHandle, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {Textarea} from "@coreModule/components/ui/textarea.tsx";
import {Company} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";
import {PORTAL_APPROVAL_REASON_MAX} from "armonia/src/modules/core/api/company/private/company/portalApproval.ts";
import type {
    SetCompanyVerificationResponse,
    SetPortalApprovalResponse,
} from "armonia/src/modules/core/api/platform/private/companies/platformModules.dto.ts";

const LANGUAGE_PATH = "src/modules/core/clients/panel/private/tenancy/systemSettings/companies/center/dialogs/portalApprovalDialog.tsx";

/** The row actions of the platform's approval and verified mark (D178). */
export const PORTAL_APPROVAL_ACTIONS = ["approvePortalListing", "rejectPortalListing", "verifyCompany", "unverifyCompany"] as const;
export type PortalApprovalAction = typeof PORTAL_APPROVAL_ACTIONS[number];

export function isPortalApprovalAction(action: string): action is PortalApprovalAction {
    return (PORTAL_APPROVAL_ACTIONS as readonly string[]).includes(action);
}

type DialogProps = {
    onOpenChange: (open: boolean) => void;
    company: Partial<Company> & {_id: string};
    /** The company's fields the decision changed, for the list and the sheet. */
    onSuccess?: (patch: Partial<Company>) => void;
};

function DecisionDialogInner({
    onOpenChange, company, onSuccess, decision, resolveLanguageKey, innerRef, onFilterChange, loading,
}: DialogProps & {decision: "approved" | "rejected"} & WithLanguageType & WithAxiosType<SetPortalApprovalResponse>) {
    const [reason, setReason] = useState("");
    const prefix = decision === "approved" ? "approve" : "reject";

    useImperativeHandle(innerRef, () => ({
        success: (data: SetPortalApprovalResponse) => {
            onSuccess?.({portalApproval: data.portalApproval});
            onOpenChange(false);
        },
    }));

    return (
        <ConfirmDialog
            open
            onOpenChange={(next: boolean) => { if (!loading) onOpenChange(next); }}
            title={resolveLanguageKey(`${prefix}.title`)}
            desc={`${company.name} — ${resolveLanguageKey(`${prefix}.description`)}`}
            handleConfirm={() => onFilterChange({status: decision, ...(decision === "rejected" && reason.trim() ? {reason: reason.trim()} : {})})}
            isLoading={loading}
            destructive={decision === "rejected"}
        >
            {decision === "rejected" ? (
                <Label className="flex-col items-stretch gap-1.5">
                    {resolveLanguageKey("reject.reasonLabel")}
                    <Textarea rows={3} maxLength={PORTAL_APPROVAL_REASON_MAX} value={reason} onChange={(event) => setReason(event.target.value)} className="h-auto py-2" />
                    <span className="text-xs font-normal text-muted-foreground">{resolveLanguageKey("reject.reasonHint")}</span>
                </Label>
            ) : null}
        </ConfirmDialog>
    );
}

const DecisionDialog = compose(
    withLanguage(LANGUAGE_PATH),
    withAxios<SetPortalApprovalResponse>(
        {method: "PUT", url: "/api/platform/companies/portalApproval", data: {}, addToPath: [{whatToGet: ["company", "_id"]}]},
        true,
    ),
    withDebug(true, true, "companies"),
)(DecisionDialogInner);

function VerificationDialogInner({
    onOpenChange, company, onSuccess, verified, resolveLanguageKey, innerRef, onFilterChange, loading,
}: DialogProps & {verified: boolean} & WithLanguageType & WithAxiosType<SetCompanyVerificationResponse>) {
    const prefix = verified ? "verify" : "unverify";

    useImperativeHandle(innerRef, () => ({
        success: (data: SetCompanyVerificationResponse) => {
            onSuccess?.({verifiedAt: data.verifiedAt ?? undefined});
            onOpenChange(false);
        },
    }));

    return (
        <ConfirmDialog
            open
            onOpenChange={(next: boolean) => { if (!loading) onOpenChange(next); }}
            title={resolveLanguageKey(`${prefix}.title`)}
            desc={`${company.name}${company.vat ? ` (${company.vat})` : ""} — ${resolveLanguageKey(`${prefix}.description`)}`}
            handleConfirm={() => onFilterChange({verified})}
            isLoading={loading}
            destructive={!verified}
        />
    );
}

const VerificationDialog = compose(
    withLanguage(LANGUAGE_PATH),
    withAxios<SetCompanyVerificationResponse>(
        {method: "PUT", url: "/api/platform/companies/verification", data: {}, addToPath: [{whatToGet: ["company", "_id"]}]},
        true,
    ),
    withDebug(true, true, "companies"),
)(VerificationDialogInner);

/** The dialog of one approval or verified-mark action, opened from a company's row, card or sheet. */
export default function PortalApprovalDialog({action, ...props}: DialogProps & {action: PortalApprovalAction}) {
    switch (action) {
        case "approvePortalListing":
            return <DecisionDialog {...props} decision="approved" />;
        case "rejectPortalListing":
            return <DecisionDialog {...props} decision="rejected" />;
        case "verifyCompany":
            return <VerificationDialog {...props} verified />;
        case "unverifyCompany":
            return <VerificationDialog {...props} verified={false} />;
    }
}
