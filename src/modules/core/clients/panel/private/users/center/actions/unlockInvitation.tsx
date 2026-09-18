import withLanguage, {WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@baseModule/helpers/hocs/withAxios.tsx";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {LockKeyholeOpen} from "lucide-react";
import withDebug from "@baseModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@baseModule/helpers/hooks/useAccess.ts";
import {CompanyUserType} from "armonia/src/modules/core/api/company/private/users/companyUser.dto.ts";
import type {UnlockUserRequestFormType} from "armonia/src/modules/core/api/company/private/users/unlockUserRequest.form.type.ts";
import type {ActionMessage} from "armonia/src/modules/core/types/shared.types.ts";
import HiddenElement from "@baseModule/components/custom/hiddenElement.tsx";
import ConfirmDialog from "@baseModule/components/custom/confirmDialog.tsx";
import {useTableUpdate} from "@baseModule/helpers/hooks/useTableUpdate.ts";
import {Checkbox} from "@coreModule/components/ui/checkbox.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {useImperativeHandle, useState} from "react";
import {useKeyboardShortcuts} from "@baseModule/helpers/hooks/useKeyboardShortcut.ts";

type UnlockInvitationActionProps = WithLanguageType & WithAxiosType<ActionMessage, UnlockUserRequestFormType> & {
    user: CompanyUserType;
    specificUserId?: string;
};

function UnlockInvitationAction({user, resolveLanguageKey, onFilterChange, loading, innerRef, specificUserId}: UnlockInvitationActionProps) {
    const {write} = useAccess("users", !specificUserId ? "self" : "others");
    const {updateRow} = useTableUpdate();
    const [open, setOpen] = useState(false);
    const [resendEmail, setResendEmail] = useState(false);

    const hasLock = !!(user.requests?.invitation?.lockedUntil);

    useImperativeHandle(innerRef, () => ({
        success: () => {
            setOpen(false);
            setResendEmail(false);
            const {lockedUntil, ...invitationRest} = user.requests?.invitation ?? {};
            updateRow(user._id, {
                requests: {
                    ...user.requests,
                    invitation: { ...invitationRest, attempts: 0 }
                }
            });
        },
        error: () => {
            setOpen(false);
        },
    }));

    const shortcut = "6";
    useKeyboardShortcuts(shortcut, () => setOpen(true), {enabled: hasLock});

    if (!hasLock) return null;
    if (!write?.requests?.keys?.invitation?.keys?.lockedUntil) return <HiddenElement />;

    return (
        <>
            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}>
                <LockKeyholeOpen size={16}/>
                <p>{resolveLanguageKey("unlockInvitation")}</p>
                <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
            </DropdownMenuItem>
            <ConfirmDialog
                open={open}
                onOpenChange={(isOpen: boolean) => { setOpen(isOpen); if (!isOpen) setResendEmail(false); }}
                title={resolveLanguageKey("unlockInvitationConfirm")}
                desc={resolveLanguageKey("unlockInvitationConfirmDesc")}
                handleConfirm={() => onFilterChange({ resendEmail })}
                isLoading={loading}
            >
                <div className="flex items-center gap-x-2 mt-4">
                    <Checkbox
                        id="unlock-invitation-resend"
                        checked={resendEmail}
                        onCheckedChange={(v) => setResendEmail(!!v)}
                    />
                    <Label htmlFor="unlock-invitation-resend" className="text-sm font-normal cursor-pointer">
                        {resolveLanguageKey("unlockInvitationResendEmail")}
                    </Label>
                </div>
            </ConfirmDialog>
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/users/center/actions/unlockInvitation.tsx"),
    withAxios({
        method: "PATCH",
        url: "/api/company/users/unlockInvitation",
        data: {},
        addToHeader: [{
            whatToGet: "specificUserId",
            whereToPut: "specificUser"
        }]
    }, true),
    withDebug(true, true, "users")
)(UnlockInvitationAction);
