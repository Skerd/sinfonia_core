import {compose} from "redux";
import {Link, useLocation, useNavigate} from "react-router-dom";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import type {LoginFormType} from "armonia/src/modules/core/api/user/public/login/login.form.type.ts";
import {type PublicLoginResponse, usePublicLoginForm} from "@coreModule/helpers/publicAuth/usePublicLoginForm.ts";
import {safeNextPath} from "@coreModule/helpers/publicAuth/safeNextPath.ts";
import PortalAuthShell from "./portalAuthShell.tsx";
import {PORTAL_BUTTON, PORTAL_FIELD_ERROR, PORTAL_INPUT, PORTAL_LINK} from "../shared/portalStyles.ts";

/** Sign in to a portal account (it belongs to the platform owner, so it works on every section). */
function PortalLoginPage({resolveLanguageKey, languageCode, onFilterChange, innerRef, loading}: WithLanguageType & WithAxiosType<PublicLoginResponse, LoginFormType>) {
    const navigate = useNavigate();
    const location = useLocation();
    const form = usePublicLoginForm({
        resolveLanguageKey,
        languageCode,
        onFilterChange,
        innerRef,
        busy: loading,
        onLoggedIn: () => navigate(safeNextPath(location.search, "/account")),
    });

    return (
        <PortalAuthShell
            title={resolveLanguageKey(form.needsMfa ? "mfaTitle" : "title")}
            subtitle={resolveLanguageKey(form.needsMfa ? "mfaSubtitle" : "subtitle")}
        >
            <form className="flex flex-col gap-4" onSubmit={form.handleSubmit} noValidate>
                {!form.needsMfa ? (
                    <>
                        <div>
                            <input type="email" autoComplete="email" className={PORTAL_INPUT} disabled={loading}
                                placeholder={resolveLanguageKey("form.emailPlaceholder")} aria-label={resolveLanguageKey("form.emailLabel")}
                                value={form.username} onChange={(e) => { form.setUsername(e.target.value); form.clearFieldError("username"); }} />
                            {form.fieldErrors.username ? <p className={PORTAL_FIELD_ERROR}>{form.fieldErrors.username}</p> : null}
                        </div>
                        <div>
                            <input type="password" autoComplete="current-password" className={PORTAL_INPUT} disabled={loading}
                                placeholder={resolveLanguageKey("form.passwordPlaceholder")} aria-label={resolveLanguageKey("form.passwordLabel")}
                                value={form.password} onChange={(e) => { form.setPassword(e.target.value); form.clearFieldError("password"); }} />
                            {form.fieldErrors.password ? <p className={PORTAL_FIELD_ERROR}>{form.fieldErrors.password}</p> : null}
                        </div>
                    </>
                ) : (
                    <div>
                        <input inputMode="numeric" autoComplete="one-time-code" className={PORTAL_INPUT} disabled={loading}
                            placeholder={resolveLanguageKey("form.mfaCodePlaceholder")} aria-label={resolveLanguageKey("form.mfaCodeLabel")}
                            value={form.mfaCode} onChange={(e) => { form.setMfaCode(e.target.value); form.clearFieldError("mfaCode"); }} />
                        {form.fieldErrors.mfaCode ? <p className={PORTAL_FIELD_ERROR}>{form.fieldErrors.mfaCode}</p> : null}
                    </div>
                )}
                <button type="submit" className={PORTAL_BUTTON} disabled={loading}>{resolveLanguageKey("submit")}</button>
            </form>
            <div className="flex flex-col gap-2 text-sm">
                <Link to="/forgot-password" className={PORTAL_LINK}>{resolveLanguageKey("forgotPassword")}</Link>
                <p className="text-portal-ink-muted">
                    {resolveLanguageKey("noAccount")} <Link to={`/signup${location.search}`} className={PORTAL_LINK}>{resolveLanguageKey("signUpLink")}</Link>
                </p>
            </div>
        </PortalAuthShell>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/portal/auth/login.tsx"),
    withAxios<PublicLoginResponse, LoginFormType>({method: "post", url: "/api/user/login", data: {}}, true),
    withDebug(true, true),
)(PortalLoginPage);
