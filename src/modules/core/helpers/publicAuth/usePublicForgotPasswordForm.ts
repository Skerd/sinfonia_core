import {useImperativeHandle, useState} from "react";
import type {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {ForgotPasswordFormType} from "armonia/src/modules/core/api/user/public/forgotPassword/forgotPassword.form.type.ts";
import {forgotPasswordFormSchema} from "armonia/src/modules/core/api/user/public/forgotPassword/forgotPassword.form.validator.ts";
import type {ForgotPasswordFormResponseType} from "armonia/src/modules/core/api/user/public/forgotPassword/forgotPassword.form.response.type.ts";

/**
 * "Email me a reset link" for a public site. `submitted` turns true once the
 * server accepted the request. The dictionary must provide `form.emailLabel`.
 */
export function usePublicForgotPasswordForm({
    resolveLanguageKey,
    languageCode,
    onFilterChange,
    innerRef,
    busy,
}: Pick<WithAxiosType<ForgotPasswordFormResponseType, ForgotPasswordFormType>, "onFilterChange" | "innerRef"> & {
    resolveLanguageKey: ResolveLanguageKey;
    languageCode: string;
    busy: boolean;
}) {
    const [email, setEmail] = useState("");
    const [fieldError, setFieldError] = useState<string | undefined>();
    const [submitted, setSubmitted] = useState(false);

    useImperativeHandle(innerRef, () => ({
        success: () => setSubmitted(true),
        error: () => setSubmitted(false),
    }));

    const changeEmail = (value: string) => {
        setFieldError(undefined);
        setEmail(value);
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (busy) return;
        setSubmitted(false);

        const parsed = forgotPasswordFormSchema(languageCode, {
            emailLabel: resolveLanguageKey("form.emailLabel"),
        }).safeParse({email: email.trim()});

        if (!parsed.success) {
            setFieldError(parsed.error.issues[0]?.message);
            return;
        }

        setFieldError(undefined);
        onFilterChange(parsed.data);
    };

    return {email, changeEmail, fieldError, submitted, handleSubmit};
}
