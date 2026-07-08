import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {Mail} from "lucide-react";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {CompanyUserType} from "armonia/src/modules/core/api/company/private/users/allUsers.form.response.type.ts";
import type {ResendActivationEmailFormType} from "armonia/src/modules/core/api/company/private/users/resendActivationEmail.form.type.ts";
import type {ResendActivationEmailFormResponseType} from "armonia/src/modules/core/api/company/private/users/resendActivationEmail.form.response.type.ts";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import {useTableUpdate} from "@coreModule/components/custom/tableUpdateContext.tsx";
import {useImperativeHandle, useState} from "react";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";

type ResendActivationActionProps = WithLanguageType & WithAxiosType<ResendActivationEmailFormResponseType, ResendActivationEmailFormType> & {
    user: CompanyUserType;
    specificUserId?: string;
};

function ResendActivationAction({user, resolveLanguageKey, onFilterChange, loading, innerRef}: ResendActivationActionProps) {

    const {updateRow} = useTableUpdate();
    const [open, setOpen] = useState(false);

    useImperativeHandle(innerRef, () => ({
        success: (data) => {
            setOpen(false);
            const {attempts, lockedUntil, ...activationRest} = user.requests?.activation ?? {};
            updateRow(user._id, {
                requests: {
                    ...user.requests,
                    activation: { ...activationRest, attempts: (attempts ?? 0) + 1, lockedUntil: !!data.lockedUntil ? data.lockedUntil : lockedUntil }
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
                <p>{resolveLanguageKey("resendActivationEmail")}</p>
                <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
            </DropdownMenuItem>
            <ConfirmDialog
                open={open}
                onOpenChange={setOpen}
                title={resolveLanguageKey("resendActivationEmailConfirm")}
                desc={resolveLanguageKey("resendActivationEmailConfirmDesc")}
                handleConfirm={() => onFilterChange({})}
                isLoading={loading}
            />
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/users/center/actions/resendActivation.tsx"),
    withAxios({
        method: "PATCH",
        url: "/api/company/users/resendActivationEmail",
        data: {},
        addToHeader: [{
            whatToGet: "specificUserId",
            whereToPut: "specificUser"
        }]
    }, true),
    withDebug(true, true)
)(ResendActivationAction);
