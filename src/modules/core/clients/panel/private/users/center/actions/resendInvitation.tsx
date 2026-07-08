import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {Mail} from "lucide-react";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {CompanyUserType} from "armonia/src/modules/core/api/company/private/users/allUsers.form.response.type.ts";
import type {ResendInvitationEmailFormType} from "armonia/src/modules/core/api/company/private/users/resendInvitationEmail.form.type.ts";
import type {ResendInvitationEmailFormResponseType} from "armonia/src/modules/core/api/company/private/users/resendInvitationEmail.form.response.type.ts";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import {useTableUpdate} from "@coreModule/components/custom/tableUpdateContext.tsx";
import {useImperativeHandle, useState} from "react";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";

type ResendInvitationActionProps = WithLanguageType & WithAxiosType<ResendInvitationEmailFormResponseType, ResendInvitationEmailFormType> & {
    user: CompanyUserType;
    specificUserId?: string;
};

function ResendInvitationAction({user, resolveLanguageKey, onFilterChange, loading, innerRef}: ResendInvitationActionProps) {

    const {updateRow} = useTableUpdate();
    const [open, setOpen] = useState(false);

    useImperativeHandle(innerRef, () => ({
        success: (data) => {
            setOpen(false);
            const {attempts, lockedUntil, ...invitationRest} = user.requests?.invitation ?? {};
            updateRow(user._id, {
                requests: {
                    ...user.requests,
                    invitation: { ...invitationRest, attempts: (attempts ?? 0) + 1, lockedUntil: !!data.lockedUntil ? data.lockedUntil : lockedUntil }
                }
            });
        },
        error: () => {
            setOpen(false);
        },
    }));

    const shortcut = "5";
    useKeyboardShortcuts(shortcut, () => setOpen(true));

    return (
        <>
            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}>
                <Mail size={16}/>
                <p>{resolveLanguageKey("resendInvitationEmail")}</p>
                <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
            </DropdownMenuItem>
            <ConfirmDialog
                open={open}
                onOpenChange={setOpen}
                title={resolveLanguageKey("resendInvitationEmailConfirm")}
                desc={resolveLanguageKey("resendInvitationEmailConfirmDesc")}
                handleConfirm={() => onFilterChange({})}
                isLoading={loading}
            />
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/users/center/actions/resendInvitation.tsx"),
    withAxios({
        method: "PATCH",
        url: "/api/company/users/resendInvitationEmail",
        data: {},
        addToHeader: [{
            whatToGet: "specificUserId",
            whereToPut: "specificUser"
        }]
    }, true),
    withDebug(true, true)
)(ResendInvitationAction);
