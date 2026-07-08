import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {LockKeyholeOpen} from "lucide-react";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {useImperativeHandle, useState} from "react";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {CompanyUserType} from "armonia/src/modules/core/api/company/private/users/allUsers.form.response.type.ts";
import type {UnlockMfaDeactivationFormType} from "armonia/src/modules/core/api/company/private/users/unlockMfaDeactivation.form.type.ts";
import type {UnlockMfaDeactivationFormResponseType} from "armonia/src/modules/core/api/company/private/users/unlockMfaDeactivation.form.response.type.ts";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import {useTableUpdate} from "@coreModule/components/custom/tableUpdateContext.tsx";
import {Checkbox} from "@coreModule/components/ui/checkbox.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";

type UnlockMfaDeactivationActionProps = WithLanguageType & WithAxiosType<UnlockMfaDeactivationFormResponseType, UnlockMfaDeactivationFormType> & {
    user: CompanyUserType;
    specificUserId?: string;
}

function UnlockMfaDeactivationAction({user, resolveLanguageKey, onFilterChange, loading, innerRef, specificUserId}: UnlockMfaDeactivationActionProps) {
    const {write} = useAccess("users", !specificUserId ? "self" : "others");
    const {refetch} = useTableUpdate();
    const [open, setOpen] = useState(false);
    const [resendEmail, setResendEmail] = useState(false);

    const hasLock = !!(user.requests?.mfaDeactivation?.lockedUntil);

    useImperativeHandle(innerRef, () => ({
        success: () => {
            setOpen(false);
            setResendEmail(false);
            refetch();
        },
        error: () => {
            setOpen(false);
        },
    }));

    const shortcut = "4";
    useKeyboardShortcuts(shortcut, () => {if( hasLock){ setOpen(true)}});

    if( !hasLock ) return (<></>)
    if (!write?.requests?.keys?.mfaDeactivation?.keys?.lockedUntil) return <HiddenElement />;

    return (
        <>
            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}>
                <LockKeyholeOpen size={16} />
                <p>{resolveLanguageKey("unlockMfaDeactivation")}</p>
                <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
            </DropdownMenuItem>
            <ConfirmDialog
                open={open}
                onOpenChange={(isOpen: boolean) => { setOpen(isOpen); if (!isOpen) setResendEmail(false); }}
                title={resolveLanguageKey("unlockMfaDeactivationConfirm")}
                desc={resolveLanguageKey("unlockMfaDeactivationConfirmDesc")}
                handleConfirm={() => onFilterChange({resendEmail})}
                isLoading={loading}
            >
                <div className="flex items-center space-x-2 mt-4">
                    <Checkbox
                        id="unlock-mfa-deactivation-resend"
                        checked={resendEmail}
                        onCheckedChange={(v) => setResendEmail(!!v)}
                    />
                    <Label htmlFor="unlock-mfa-deactivation-resend" className="text-sm font-normal cursor-pointer">
                        {resolveLanguageKey("unlockMfaDeactivationResendEmail")}
                    </Label>
                </div>
            </ConfirmDialog>
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/users/center/actions/unlockMfaDeactivation.tsx"),
    withAxios({
        method: "PATCH",
        url: "/api/company/users/unlockMfaDeactivation",
        data: {},
        addToHeader: [{
            whatToGet: "specificUserId",
            whereToPut: "specificUser"
        }]
    }, true),
    withDebug(true, true)
)(UnlockMfaDeactivationAction);
