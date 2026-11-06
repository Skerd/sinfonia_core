import {IconLockOpen} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {CompanyUserType} from "armonia/src/modules/core/api/company/private/users/companyUser.dto.ts";
import type {UnlockUserRequestFormType} from "armonia/src/modules/core/api/company/private/users/unlockUserRequest.form.type.ts";
import type {ActionMessage} from "armonia/src/modules/core/types/shared.types.ts";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import {useTableUpdate} from "@coreModule/helpers/hooks/useTableUpdate.ts";
import {Checkbox} from "@coreModule/components/ui/checkbox.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {useImperativeHandle, useState} from "react";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {useActionAccess} from "@coreModule/helpers/hooks/useActionAccess.ts";

type UnlockInvitationActionProps = WithLanguageType & WithAxiosType<ActionMessage, UnlockUserRequestFormType & {_id: string}> & {
    user: CompanyUserType;
    specificUserId?: string;
};

function UnlockInvitationAction({user, resolveLanguageKey, onFilterChange, loading, innerRef}: UnlockInvitationActionProps) {
    // The `others` permission of this account action (D65), not a field-write stand-in.
    const allowed = useActionAccess("users", "unlockInvitation", "others");
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
    useKeyboardShortcuts(shortcut, () => setOpen(true), {enabled: hasLock && allowed});

    if (!hasLock) return null;
    if (!allowed) return <HiddenElement />;

    return (
        <>
            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}>
                <IconLockOpen size={16}/>
                <p>{resolveLanguageKey("unlockInvitation")}</p>
                <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
            </DropdownMenuItem>
            <ConfirmDialog
                open={open}
                onOpenChange={(isOpen: boolean) => { setOpen(isOpen); if (!isOpen) setResendEmail(false); }}
                title={resolveLanguageKey("unlockInvitationConfirm")}
                desc={resolveLanguageKey("unlockInvitationConfirmDesc")}
                handleConfirm={() => onFilterChange({_id: user._id, resendEmail})}
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
        method: "POST",
        url: "/api/company/users/unlockInvitation",
        data: {}
    }, true),
    withDebug(true, true, "users")
)(UnlockInvitationAction);
