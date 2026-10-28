import {compose} from "redux";
import {Link} from "react-router-dom";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import type {ForgotPasswordFormType} from "armonia/src/modules/core/api/user/public/forgotPassword/forgotPassword.form.type.ts";
import type {ForgotPasswordFormResponseType} from "armonia/src/modules/core/api/user/public/forgotPassword/forgotPassword.form.response.type.ts";
import {usePublicForgotPasswordForm} from "@coreModule/helpers/publicAuth/usePublicForgotPasswordForm.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import PortalAuthShell from "./portalAuthShell.tsx";
import FormField from "../shared/formField.tsx";

/** Asks for a password reset link by email. */
function PortalForgotPasswordPage({resolveLanguageKey, languageCode, onFilterChange, innerRef, loading}: WithLanguageType & WithAxiosType<ForgotPasswordFormResponseType, ForgotPasswordFormType>) {
    const form = usePublicForgotPasswordForm({resolveLanguageKey, languageCode, onFilterChange, innerRef, busy: loading});
    return (
        <PortalAuthShell title={resolveLanguageKey("title")} subtitle={resolveLanguageKey(form.submitted ? "submitted" : "subtitle")}>
            {form.submitted ? null : (
                <form className="flex flex-col gap-4" onSubmit={form.handleSubmit} noValidate>
                    <FormField type="email" autoComplete="email" disabled={loading}
                        label={resolveLanguageKey("form.emailLabel")} placeholder={resolveLanguageKey("form.emailPlaceholder")} error={form.fieldError}
                        value={form.email} onChange={(e) => form.changeEmail(e.target.value)} />
                    <Button type="submit" size="lg" disabled={loading}>{resolveLanguageKey("submit")}</Button>
                </form>
            )}
            <div><Button asChild variant="link" className="h-auto p-0"><Link to="/login">{resolveLanguageKey("backToLogin")}</Link></Button></div>
        </PortalAuthShell>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/portal/auth/forgotPassword.tsx"),
    withAxios<ForgotPasswordFormResponseType, ForgotPasswordFormType>({method: "post", url: "/api/user/forgotPassword", data: {}}, true),
    withDebug(true, true),
)(PortalForgotPasswordPage);
