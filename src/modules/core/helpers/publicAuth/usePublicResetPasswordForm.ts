import {useEffect, useImperativeHandle, useRef, useState} from "react";
import {useParams} from "react-router-dom";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import type {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {ChangeForgottenPasswordFormType} from "armonia/src/modules/core/api/user/public/forgotPassword/changeForgottenPassword.form.type.ts";
import {changeForgottenPasswordFormSchema} from "armonia/src/modules/core/api/user/public/forgotPassword/changeForgottenPassword.form.validator.ts";
import type {ChangeForgottenPasswordFormResponseType} from "armonia/src/modules/core/api/user/public/forgotPassword/changeForgottenPassword.form.response.type.ts";
import {useFieldErrors} from "./useFieldErrors.ts";

const FIELDS = ["password", "confirmPassword"] as const;

/**
 * Reset-password page logic for a public site: opens the `:code` link once
 * (`verifying` → `verifyError` when it is dead), then validates and posts the
 * new password. The dictionary must provide the `form.*Label` keys.
 */
export function usePublicResetPasswordForm({
    resolveLanguageKey,
    languageCode,
    onFilterChange,
    innerRef,
    busy,
}: Pick<WithAxiosType<ChangeForgottenPasswordFormResponseType, ChangeForgottenPasswordFormType>, "onFilterChange" | "innerRef"> & {
    resolveLanguageKey: ResolveLanguageKey;
    languageCode: string;
    busy: boolean;
}) {
    const params = useParams();
    const openStarted = useRef(false);
    const [verifying, setVerifying] = useState(true);
    const [verifyError, setVerifyError] = useState(false);
    const [resetPasswordCode, setResetPasswordCode] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [success, setSuccess] = useState(false);
    const {fieldErrors, clearFieldError, showIssues, clearAll} = useFieldErrors(FIELDS);

    useEffect(() => {
        const code = params.code;
        if (!code || openStarted.current) {
            if (!code) {
                setVerifying(false);
                setVerifyError(true);
            }
            return;
        }
        openStarted.current = true;
        setVerifying(true);
        setVerifyError(false);
        apiClient
            .post("/api/user/forgotPassword/openLink", {resetPasswordCode: code})
            .then(() => {
                setResetPasswordCode(code);
                setVerifying(false);
            })
            .catch(() => {
                setVerifying(false);
                setVerifyError(true);
            });
    }, [params.code]);

    useImperativeHandle(innerRef, () => ({
        success: () => setSuccess(true),
        error: () => setSuccess(false),
    }));

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (busy) return;

        // The schema's password-match refinement types its output loosely, so the
        // typed body is what gets posted once it has passed.
        const body: ChangeForgottenPasswordFormType = {password, confirmPassword, resetPasswordCode};
        const parsed = changeForgottenPasswordFormSchema(languageCode, {
            passwordLabel: resolveLanguageKey("form.passwordLabel"),
            confirmPasswordLabel: resolveLanguageKey("form.confirmPasswordLabel"),
            resetPasswordCodeLabel: resolveLanguageKey("form.resetPasswordCodeLabel"),
        }).safeParse(body);

        if (!parsed.success) {
            showIssues(parsed.error.issues);
            return;
        }

        clearAll();
        onFilterChange(body);
    };

    return {
        verifying, verifyError, success,
        password, setPassword,
        confirmPassword, setConfirmPassword,
        fieldErrors, clearFieldError,
        handleSubmit,
    };
}
