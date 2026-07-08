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
import type {UnlockActivationFormType} from "armonia/src/modules/core/api/company/private/users/unlockActivation.form.type.ts";
import type {UnlockActivationFormResponseType} from "armonia/src/modules/core/api/company/private/users/unlockActivation.form.response.type.ts";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import {useTableUpdate} from "@coreModule/components/custom/tableUpdateContext.tsx";
import {Checkbox} from "@coreModule/components/ui/checkbox.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";

type UnlockActivationActionProps = WithLanguageType & WithAxiosType<UnlockActivationFormResponseType, UnlockActivationFormType> & {
    user: CompanyUserType;
    specificUserId?: string;
}

function UnlockActivationAction({user, resolveLanguageKey, onFilterChange, loading, innerRef, specificUserId}: UnlockActivationActionProps) {
    const {write} = useAccess("users", !specificUserId ? "self" : "others");
    const {refetch} = useTableUpdate();
    const [open, setOpen] = useState(false);
    const [resendEmail, setResendEmail] = useState(false);

    const hasLock = !!(user.requests?.activation?.lockedUntil);

    useImperativeHandle(innerRef, () => ({
        success: () => {
            setOpen(false);
            setResendEmail(false);
            refetch();
        },
        error: () => {
            setOpen(false);
        }
    }));

    const shortcut = "2";
    useKeyboardShortcuts(shortcut, () => {if( hasLock){ setOpen(true)}});

    if( !hasLock ) return (<></>)
    if (!write?.requests?.keys?.activation?.keys?.lockedUntil || !hasLock) return <HiddenElement />;

    return (
        <>
            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}>
                <LockKeyholeOpen size={16} />
                <p>{resolveLanguageKey("unlockActivation")}</p>
                <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
            </DropdownMenuItem>
            <ConfirmDialog
                open={open}
                onOpenChange={(isOpen: boolean) => { setOpen(isOpen); if (!isOpen) setResendEmail(false); }}
                title={resolveLanguageKey("unlockActivationConfirm")}
                desc={resolveLanguageKey("unlockActivationConfirmDesc")}
                handleConfirm={() => onFilterChange({ resendEmail })}
                isLoading={loading}
            >
                {
                    write?.requests?.keys?.activation?.keys?.date &&
                    <div className="flex items-center space-x-2 mt-4">
                        <Checkbox
                            id="unlock-activation-resend"
                            checked={resendEmail}
                            onCheckedChange={(v) => setResendEmail(!!v)}
                        />
                        <Label htmlFor="unlock-activation-resend" className="text-sm font-normal cursor-pointer">
                            {resolveLanguageKey("unlockActivationResendEmail")}
                        </Label>
                    </div>
                }
            </ConfirmDialog>
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/users/center/actions/unlockActivation.tsx"),
    withAxios({
        method: "PATCH",
        url: "/api/company/users/unlockActivation",
        data: {},
        addToHeader: [{
            whatToGet: "specificUserId",
            whereToPut: "specificUser"
        }]
    }, true),
    withDebug(true, true)
)(UnlockActivationAction);
