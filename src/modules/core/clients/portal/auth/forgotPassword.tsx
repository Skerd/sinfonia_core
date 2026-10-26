import {compose} from "redux";
import {Link} from "react-router-dom";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import type {ForgotPasswordFormType} from "armonia/src/modules/core/api/user/public/forgotPassword/forgotPassword.form.type.ts";
import type {ForgotPasswordFormResponseType} from "armonia/src/modules/core/api/user/public/forgotPassword/forgotPassword.form.response.type.ts";
import {usePublicForgotPasswordForm} from "@coreModule/helpers/publicAuth/usePublicForgotPasswordForm.ts";
import PortalAuthShell from "./portalAuthShell.tsx";
import {PORTAL_BUTTON, PORTAL_FIELD_ERROR, PORTAL_INPUT, PORTAL_LINK} from "../shared/portalStyles.ts";

/** Asks for a password reset link by email. */
function PortalForgotPasswordPage({resolveLanguageKey, languageCode, onFilterChange, innerRef, loading}: WithLanguageType & WithAxiosType<ForgotPasswordFormResponseType, ForgotPasswordFormType>) {
    const form = usePublicForgotPasswordForm({resolveLanguageKey, languageCode, onFilterChange, innerRef, busy: loading});
    return (
        <PortalAuthShell title={resolveLanguageKey("title")} subtitle={resolveLanguageKey(form.submitted ? "submitted" : "subtitle")}>
            {form.submitted ? null : (
                <form className="flex flex-col gap-4" onSubmit={form.handleSubmit} noValidate>
                    <div>
                        <input type="email" autoComplete="email" className={PORTAL_INPUT} disabled={loading}
                            placeholder={resolveLanguageKey("form.emailPlaceholder")} aria-label={resolveLanguageKey("form.emailLabel")}
                            value={form.email} onChange={(e) => form.changeEmail(e.target.value)} />
                        {form.fieldError ? <p className={PORTAL_FIELD_ERROR}>{form.fieldError}</p> : null}
                    </div>
                    <button type="submit" className={PORTAL_BUTTON} disabled={loading}>{resolveLanguageKey("submit")}</button>
                </form>
            )}
            <Link to="/login" className={`${PORTAL_LINK} text-sm`}>{resolveLanguageKey("backToLogin")}</Link>
        </PortalAuthShell>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/portal/auth/forgotPassword.tsx"),
    withAxios<ForgotPasswordFormResponseType, ForgotPasswordFormType>({method: "post", url: "/api/user/forgotPassword", data: {}}, true),
    withDebug(true, true),
)(PortalForgotPasswordPage);
