import {IconBan, IconCircleCheck, IconCircleX, IconLockOpen, IconRosetteDiscountCheck, IconRosetteDiscountCheckOff} from "@tabler/icons-react";
import {compose} from "redux";
import {useSelector} from "react-redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {Company} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";
import type {PortalApprovalAction} from "../dialogs/portalApprovalDialog.tsx";

type PortalApprovalActionsProps = WithLanguageType & {
    company: Partial<Company> & {_id: string};
    onAction: (action: PortalApprovalAction) => void;
};

/**
 * Platform admins decide whether the apex lists a self-serve company, and mark a company verified after checking its
 * NIPT/VAT (D178). Companies the platform created carry no decision, so only the verified mark applies to them. They
 * also suspend a company, or lift its suspension (D191); a protected company is never suspended.
 */
function PortalApprovalActions({company, resolveLanguageKey, onAction}: PortalApprovalActionsProps) {
    const isPlatformAdmin = useSelector((state: RootState) => state.authentication.user.isPlatformAdmin);
    if (!isPlatformAdmin) return <></>;
    const status = company.portalApproval?.status;

    return (
        <>
            {status && status !== "approved" ? (
                <DropdownMenuItem onClick={() => onAction("approvePortalListing")}>
                    <IconCircleCheck size={16} />
                    {resolveLanguageKey("approve")}
                </DropdownMenuItem>
            ) : null}
            {status && status !== "rejected" && !company.isProtected ? (
                <DropdownMenuItem onClick={() => onAction("rejectPortalListing")}>
                    <IconCircleX size={16} />
                    {resolveLanguageKey("reject")}
                </DropdownMenuItem>
            ) : null}
            {company.verifiedAt ? (
                <DropdownMenuItem onClick={() => onAction("unverifyCompany")}>
                    <IconRosetteDiscountCheckOff size={16} />
                    {resolveLanguageKey("unverify")}
                </DropdownMenuItem>
            ) : company.vat ? (
                <DropdownMenuItem onClick={() => onAction("verifyCompany")}>
                    <IconRosetteDiscountCheck size={16} />
                    {resolveLanguageKey("verify")}
                </DropdownMenuItem>
            ) : null}
            {company.suspendedAt ? (
                <DropdownMenuItem onClick={() => onAction("liftSuspension")}>
                    <IconLockOpen size={16} />
                    {resolveLanguageKey("liftSuspension")}
                </DropdownMenuItem>
            ) : !company.isProtected && !company.isPlatformOwner ? (
                <DropdownMenuItem onClick={() => onAction("suspendCompany")}>
                    <IconBan size={16} />
                    {resolveLanguageKey("suspend")}
                </DropdownMenuItem>
            ) : null}
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/companies/center/actions/portalApproval.tsx"),
    withDebug(true, true, "companies"),
)(PortalApprovalActions);
