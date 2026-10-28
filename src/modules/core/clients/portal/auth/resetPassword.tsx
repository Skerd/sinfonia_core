import {compose} from "redux";
import {Link} from "react-router-dom";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import type {ChangeForgottenPasswordFormType} from "armonia/src/modules/core/api/user/public/forgotPassword/changeForgottenPassword.form.type.ts";
import type {ChangeForgottenPasswordFormResponseType} from "armonia/src/modules/core/api/user/public/forgotPassword/changeForgottenPassword.form.response.type.ts";
import {usePublicResetPasswordForm} from "@coreModule/helpers/publicAuth/usePublicResetPasswordForm.ts";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import PortalAuthShell from "./portalAuthShell.tsx";
import FormField from "../shared/formField.tsx";

/** Opened from the reset email (`/reset-password/:code`). */
function PortalResetPasswordPage({resolveLanguageKey, languageCode, onFilterChange, innerRef, loading}: WithLanguageType & WithAxiosType<ChangeForgottenPasswordFormResponseType, ChangeForgottenPasswordFormType>) {
    const form = usePublicResetPasswordForm({resolveLanguageKey, languageCode, onFilterChange, innerRef, busy: loading});
    const state = form.verifying ? "verifying" : form.verifyError ? "invalid" : form.success ? "success" : "form";
    return (
        <PortalAuthShell title={resolveLanguageKey(`${state}.title`)} subtitle={resolveLanguageKey(`${state}.subtitle`, true) ?? undefined}>
            {state === "verifying" ? <Loader /> : state === "form" ? (
                <form className="flex flex-col gap-4" onSubmit={form.handleSubmit} noValidate>
                    {(["password", "confirmPassword"] as const).map((key) => (
                        <FormField key={key} type="password" autoComplete="new-password" disabled={loading}
                            label={resolveLanguageKey(`form.${key}Label`)} error={form.fieldErrors[key]}
                            value={key === "password" ? form.password : form.confirmPassword}
                            onChange={(e) => { (key === "password" ? form.setPassword : form.setConfirmPassword)(e.target.value); form.clearFieldError(key); }} />
                    ))}
                    <Button type="submit" size="lg" disabled={loading}>{resolveLanguageKey("submit")}</Button>
                </form>
            ) : <Button asChild size="lg"><Link to="/login">{resolveLanguageKey("signIn")}</Link></Button>}
        </PortalAuthShell>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/portal/auth/resetPassword.tsx"),
    withAxios<ChangeForgottenPasswordFormResponseType, ChangeForgottenPasswordFormType>({method: "post", url: "/api/user/forgotPassword/changePassword", data: {}}, true),
    withDebug(true, true),
)(PortalResetPasswordPage);
