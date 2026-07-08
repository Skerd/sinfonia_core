import {useParams} from "react-router-dom";
import Login from "@coreModule/clients/panel/public/auth/login";
import SignUp from "@coreModule/clients/panel/public/auth/signUp";
import ForgotPassword from "@coreModule/clients/panel/public/auth/password/forgetPassword.form.tsx";
import ActivateAccount from "@coreModule/clients/panel/public/auth/activateAccount/activateAccount.form.tsx";
import ConfirmOTPDeactivation from "@coreModule/clients/panel/public/auth/2fa/confirm2FADeactivation.form.tsx";
import ChangeForgottenPassword from "@coreModule/clients/panel/public/auth/password/changeForgottenPassword.form.tsx";
import AcceptInvitation from "@coreModule/clients/panel/public/auth/acceptInvitation/acceptInvitation.form.tsx";
import LanguageSwitch from "@coreModule/components/custom/languageSwitch.tsx";
import ThemeSwitch from "@coreModule/components/custom/themeSwitch.tsx";
import {ReactNode} from "react";
import {GalleryVerticalEnd} from "lucide-react";

type AuthLayoutProps = {
    children: ReactNode
}

function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className='container grid grid-cols-1 h-svh max-w-none items-center justify-center px-2'>
            <div className='mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:w-[480px] sm:p-8'>
                <div className='mb-4 flex items-center justify-center'>
                    <GalleryVerticalEnd className='me-2' />
                    <h1 className='text-xl font-medium'>{window.location.host}</h1>
                </div>
                {children}
            </div>
        </div>
    )
}

export default function AuthenticationPage() {

    const {panel} = useParams();

    return (
        <AuthLayout>
            {panel === "login" && <Login />}
            {panel === "requestResetPassword" && <ForgotPassword />}
            {panel === "resetPassword" && <ChangeForgottenPassword />}
            {panel === "deactivateOTP" && <ConfirmOTPDeactivation />}
            {panel === "signUp" && <SignUp />}
            {panel === "activateAccount" && <ActivateAccount />}
            {panel === "acceptInvitation" && <AcceptInvitation />}
            <div className="flex justify-center">
                <LanguageSwitch showTitles={true} />
                <ThemeSwitch showTitles={true}/>
            </div>
        </AuthLayout>
    )
}