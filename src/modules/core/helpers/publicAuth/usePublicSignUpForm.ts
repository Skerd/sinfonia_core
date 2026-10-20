import {useImperativeHandle, useState} from "react";
import type {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {SignUpFormType} from "armonia/src/modules/core/api/user/public/signUp/signup.form.type.ts";
import type {SignupFormResponseType} from "armonia/src/modules/core/api/user/public/signUp/signup.form.response.type.ts";
import {signupFormSchema} from "armonia/src/modules/core/api/user/public/signUp/signup.form.validator.ts";
import {useFieldErrors} from "./useFieldErrors.ts";

const FIELDS = ["name", "surname", "email", "password", "confirmPassword"] as const;

/**
 * Account sign-up for a public site: validates with the armonia sign-up schema and
 * posts through the page's `withAxios`. `submitted` turns true once the server has
 * sent the activation email. The dictionary must provide the `form.*Label` keys.
 */
export function usePublicSignUpForm({
    resolveLanguageKey,
    languageCode,
    onFilterChange,
    innerRef,
    busy,
}: Pick<WithAxiosType<SignupFormResponseType, SignUpFormType>, "onFilterChange" | "innerRef"> & {
    resolveLanguageKey: ResolveLanguageKey;
    languageCode: string;
    busy: boolean;
}) {
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const {fieldErrors, clearFieldError, showIssues, clearAll} = useFieldErrors(FIELDS);

    useImperativeHandle(innerRef, () => ({
        success: () => setSubmitted(true),
        error: () => setSubmitted(false),
    }));

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (busy) return;
        setSubmitted(false);

        // The schema's password-match refinement types its output loosely, so the
        // typed body is what gets posted once it has passed.
        const body: SignUpFormType = {
            name: name.trim(),
            surname: surname.trim(),
            email: email.trim(),
            password,
            confirmPassword,
        };
        const parsed = signupFormSchema(languageCode, {
            nameLabel: resolveLanguageKey("form.nameLabel"),
            surnameLabel: resolveLanguageKey("form.surnameLabel"),
            emailLabel: resolveLanguageKey("form.emailLabel"),
            passwordLabel: resolveLanguageKey("form.passwordLabel"),
            confirmPasswordLabel: resolveLanguageKey("form.confirmPasswordLabel"),
        }).safeParse(body);

        if (!parsed.success) {
            showIssues(parsed.error.issues);
            return;
        }

        clearAll();
        onFilterChange(body);
    };

    return {
        name, setName,
        surname, setSurname,
        email, setEmail,
        password, setPassword,
        confirmPassword, setConfirmPassword,
        submitted,
        fieldErrors, clearFieldError,
        handleSubmit,
    };
}
