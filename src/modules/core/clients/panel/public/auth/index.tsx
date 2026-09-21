import {useParams} from "react-router-dom";
import Login from "@coreModule/clients/panel/public/auth/login";
import SignUp from "@coreModule/clients/panel/public/auth/signUp";
import ForgotPassword from "@coreModule/clients/panel/public/auth/password/forgetPassword.form.tsx";
import ActivateAccount from "@coreModule/clients/panel/public/auth/activateAccount/activateAccount.form.tsx";
import ConfirmOTPDeactivation from "@coreModule/clients/panel/public/auth/2fa/confirm2FADeactivation.form.tsx";
import ChangeForgottenPassword from "@coreModule/clients/panel/public/auth/password/changeForgottenPassword.form.tsx";
import AcceptInvitation from "@coreModule/clients/panel/public/auth/acceptInvitation/acceptInvitation.form.tsx";
import LanguageSwitch from "@coreModule/components/custom/preferences/languageSwitch.tsx";
import ThemeSwitch from "@coreModule/components/custom/preferences/themeSwitch.tsx";
import {resolveAuthPanelComponent} from "@coreModule/helpers/moduleContributions/loadAuthPanelContributions.ts";
import type {CoreAuthPanelKey} from "@coreModule/helpers/moduleContributions/coreAuthPanelKeys.ts";
import {GalleryVerticalEnd} from "lucide-react";
import type {ComponentType} from "react";

/** Core panels by `:panel` key; the key list is shared with the module loader, which reserves it. */
const CORE_AUTH_PANELS: Record<CoreAuthPanelKey, ComponentType> = {
    login: Login,
    requestResetPassword: ForgotPassword,
    resetPassword: ChangeForgottenPassword,
    deactivateOTP: ConfirmOTPDeactivation,
    signUp: SignUp,
    activateAccount: ActivateAccount,
    acceptInvitation: AcceptInvitation,
};

function resolvePanel(panel: string | undefined): ComponentType | undefined {
    if (panel && Object.hasOwn(CORE_AUTH_PANELS, panel)) {
        return CORE_AUTH_PANELS[panel as CoreAuthPanelKey];
    }
    return resolveAuthPanelComponent(panel);
}

/**
 * The `/authenticate/:panel` page. Resolves `:panel` against
 * {@link CORE_AUTH_PANELS} — whose entries are the sibling folders here — and
 * then against the module auth-panel contributions.
 */
export default function AuthenticationPage() {

    const {panel} = useParams();
    const Panel = resolvePanel(panel);

    return (
        <div className='container grid grid-cols-1 h-svh max-w-none items-center justify-center px-2'>
            <div className='mx-auto flex w-full flex-col justify-center gap-y-2 py-8 sm:w-[480px] sm:p-8'>
                <div className='mb-4 flex items-center justify-center'>
                    <GalleryVerticalEnd className='me-2' />
                    <h1 className='text-xl font-medium'>{window.location.host}</h1>
                </div>
                {Panel ? <Panel /> : null}
                <div className="flex justify-center">
                    <LanguageSwitch showTitles={true} />
                    <ThemeSwitch showTitles={true}/>
                </div>
            </div>
        </div>
    )
}