import {useState} from "react";
import {compose} from "redux";
import {Link, useLocation, useNavigate} from "react-router-dom";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import type {LoginFormType} from "armonia/src/modules/core/api/user/public/login/login.form.type.ts";
import {type PublicLoginResponse, usePublicLoginForm} from "@coreModule/helpers/publicAuth/usePublicLoginForm.ts";
import {safeNextPath} from "@coreModule/helpers/publicAuth/safeNextPath.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import PortalAuthShell from "./portalAuthShell.tsx";
import FormField from "../shared/formField.tsx";
import PortalThirdPartyAuthentication from "./portalThirdPartyAuthentication.tsx";
import PortalThirdPartyLoginForm from "./portalThirdPartyLogin.form.tsx";

/** Sign in to a portal account (it belongs to the platform owner, so it works on every section). */
function PortalLoginPage({resolveLanguageKey, languageCode, onFilterChange, innerRef, loading}: WithLanguageType & WithAxiosType<PublicLoginResponse, LoginFormType>) {
    const navigate = useNavigate();
    const location = useLocation();
    const [oauthBusy, setOauthBusy] = useState(false);
    const busy = loading || oauthBusy;
    const form = usePublicLoginForm({
        resolveLanguageKey,
        languageCode,
        onFilterChange,
        innerRef,
        busy,
        onLoggedIn: () => navigate(safeNextPath(location.search, "/account")),
    });

    return (
        <PortalAuthShell
            title={resolveLanguageKey(form.needsMfa ? "mfaTitle" : "title")}
            subtitle={resolveLanguageKey(form.needsMfa ? "mfaSubtitle" : "subtitle")}
        >
            <PortalThirdPartyLoginForm onBusy={setOauthBusy} />
            <form className="flex flex-col gap-4" onSubmit={form.handleSubmit} noValidate>
                {!form.needsMfa ? (
                    <>
                        <FormField type="email" autoComplete="email" disabled={busy}
                            label={resolveLanguageKey("form.emailLabel")} placeholder={resolveLanguageKey("form.emailPlaceholder")} error={form.fieldErrors.username}
                            value={form.username} onChange={(e) => { form.setUsername(e.target.value); form.clearFieldError("username"); }} />
                        <FormField type="password" autoComplete="current-password" disabled={busy}
                            label={resolveLanguageKey("form.passwordLabel")} placeholder={resolveLanguageKey("form.passwordPlaceholder")} error={form.fieldErrors.password}
                            value={form.password} onChange={(e) => { form.setPassword(e.target.value); form.clearFieldError("password"); }} />
                    </>
                ) : (
                    <FormField inputMode="numeric" autoComplete="one-time-code" disabled={busy}
                        label={resolveLanguageKey("form.mfaCodeLabel")} placeholder={resolveLanguageKey("form.mfaCodePlaceholder")} error={form.fieldErrors.mfaCode}
                        value={form.mfaCode} onChange={(e) => { form.setMfaCode(e.target.value); form.clearFieldError("mfaCode"); }} />
                )}
                <Button type="submit" size="lg" disabled={busy}>{resolveLanguageKey("submit")}</Button>
            </form>
            {!form.needsMfa ? <PortalThirdPartyAuthentication resolveLanguageKey={resolveLanguageKey} loading={busy} /> : null}
            <div className="flex flex-col items-start gap-2 text-sm">
                <Button asChild variant="link" className="h-auto p-0"><Link to="/forgot-password">{resolveLanguageKey("forgotPassword")}</Link></Button>
                <p className="text-muted-foreground">
                    {resolveLanguageKey("noAccount")} <Button asChild variant="link" className="h-auto p-0"><Link to={`/signup${location.search}`}>{resolveLanguageKey("signUpLink")}</Link></Button>
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
