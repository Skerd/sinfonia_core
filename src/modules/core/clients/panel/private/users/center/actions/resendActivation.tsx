import {IconMail} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {CompanyUserType} from "armonia/src/modules/core/api/company/private/users/companyUser.dto.ts";
import type {ResendUserEmailFormResponseType} from "armonia/src/modules/core/api/company/private/users/resendUserEmail.form.response.type.ts";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import {useTableUpdate} from "@coreModule/helpers/hooks/useTableUpdate.ts";
import {useImperativeHandle, useState} from "react";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {useActionAccess} from "@coreModule/helpers/hooks/useActionAccess.ts";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type ResendActivationActionProps = WithLanguageType & WithAxiosType<ResendUserEmailFormResponseType> & {
    user: CompanyUserType;
    specificUserId?: string;
};

function ResendActivationAction({user, resolveLanguageKey, onFilterChange, loading, innerRef}: ResendActivationActionProps) {

    const {updateRow} = useTableUpdate();
    // The `others` permission of this account action (D65).
    const allowed = useActionAccess("users", "resendActivationEmail", "others");
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
    useKeyboardShortcuts(shortcut, () => setOpen(true), {enabled: allowed});

    if (!allowed) return <HiddenElement />;

    return (
        <>
            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}>
                <IconMail size={16}/>
                <p>{resolveLanguageKey("resendActivationEmail")}</p>
                <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
            </DropdownMenuItem>
            <ConfirmDialog
                open={open}
                onOpenChange={setOpen}
                title={resolveLanguageKey("resendActivationEmailConfirm")}
                desc={resolveLanguageKey("resendActivationEmailConfirmDesc")}
                handleConfirm={() => onFilterChange({_id: user._id})}
                isLoading={loading}
            />
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/users/center/actions/resendActivation.tsx"),
    withAxios({
        method: "POST",
        url: "/api/company/users/resendActivationEmail",
        data: {}
    }, true),
    withDebug(true, true, "users")
)(ResendActivationAction);
