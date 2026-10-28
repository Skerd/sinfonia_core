import {compose} from "redux";
import {Link} from "react-router-dom";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import type {SignUpFormType} from "armonia/src/modules/core/api/user/public/signUp/signup.form.type.ts";
import type {SignupFormResponseType} from "armonia/src/modules/core/api/user/public/signUp/signup.form.response.type.ts";
import {usePublicSignUpForm} from "@coreModule/helpers/publicAuth/usePublicSignUpForm.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import PortalAuthShell from "./portalAuthShell.tsx";
import FormField from "../shared/formField.tsx";
import PortalThirdPartyAuthentication from "./portalThirdPartyAuthentication.tsx";

const FIELDS = [
    {key: "name", type: "text", autoComplete: "given-name"},
    {key: "surname", type: "text", autoComplete: "family-name"},
    {key: "email", type: "email", autoComplete: "email"},
    {key: "password", type: "password", autoComplete: "new-password"},
    {key: "confirmPassword", type: "password", autoComplete: "new-password"},
] as const;

/** Create a portal account; it is activated from the emailed link. */
function PortalSignUpPage({resolveLanguageKey, languageCode, onFilterChange, innerRef, loading}: WithLanguageType & WithAxiosType<SignupFormResponseType, SignUpFormType>) {
    const form = usePublicSignUpForm({resolveLanguageKey, languageCode, onFilterChange, innerRef, busy: loading});
    const values = {name: form.name, surname: form.surname, email: form.email, password: form.password, confirmPassword: form.confirmPassword};
    const setters = {name: form.setName, surname: form.setSurname, email: form.setEmail, password: form.setPassword, confirmPassword: form.setConfirmPassword};

    return (
        <PortalAuthShell title={resolveLanguageKey("title")} subtitle={resolveLanguageKey(form.submitted ? "submitted" : "subtitle")}>
            {form.submitted ? null : (
                <form className="flex flex-col gap-4" onSubmit={form.handleSubmit} noValidate>
                    {FIELDS.map(({key, type, autoComplete}) => (
                        <FormField key={key} type={type} autoComplete={autoComplete} disabled={loading}
                            label={resolveLanguageKey(`form.${key}Label`)} error={form.fieldErrors[key]}
                            value={values[key]} onChange={(e) => { setters[key](e.target.value); form.clearFieldError(key); }} />
                    ))}
                    <Button type="submit" size="lg" disabled={loading}>{resolveLanguageKey("submit")}</Button>
                </form>
            )}
            {form.submitted ? null : <PortalThirdPartyAuthentication resolveLanguageKey={resolveLanguageKey} loading={loading} />}
            <p className="text-sm text-muted-foreground">
                {resolveLanguageKey("haveAccount")} <Button asChild variant="link" className="h-auto p-0"><Link to="/login">{resolveLanguageKey("signInLink")}</Link></Button>
            </p>
        </PortalAuthShell>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/portal/auth/signup.tsx"),
    withAxios<SignupFormResponseType, SignUpFormType>({method: "post", url: "/api/user/signUp", data: {}}, true),
    withDebug(true, true),
)(PortalSignUpPage);
