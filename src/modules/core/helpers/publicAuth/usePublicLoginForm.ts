import {useImperativeHandle, useState} from "react";
import {useDispatch} from "react-redux";
import type {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {logIn} from "@coreModule/helpers/redux/slices/authSlice.ts";
import type {LoginFormType} from "armonia/src/modules/core/api/user/public/login/login.form.type.ts";
import {loginFormSchema} from "armonia/src/modules/core/api/user/public/login/login.form.validator.ts";
import type {
    LoginFormResponseType,
    MFAEnabledLoginFormResponseType,
} from "armonia/src/modules/core/api/user/public/login/login.form.response.type.ts";
import {useFieldErrors} from "./useFieldErrors.ts";

export type PublicLoginResponse = LoginFormResponseType & MFAEnabledLoginFormResponseType;

const FIELDS = ["username", "password", "mfaCode"] as const;

/**
 * Email + password (+ MFA code) sign-in for a public site. Validates with the
 * armonia login schema, posts through the page's `withAxios`, stores the session
 * on success and then calls `onLoggedIn` so the site can navigate. Markup stays
 * with the site; the dictionary must provide the `form.*Label` keys.
 */
export function usePublicLoginForm({
    resolveLanguageKey,
    languageCode,
    onFilterChange,
    innerRef,
    busy,
    onLoggedIn,
}: Pick<WithAxiosType<PublicLoginResponse, LoginFormType>, "onFilterChange" | "innerRef"> & {
    resolveLanguageKey: ResolveLanguageKey;
    languageCode: string;
    busy: boolean;
    onLoggedIn: () => void;
}) {
    const dispatch = useDispatch();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [mfaCode, setMfaCode] = useState("");
    const [needsMfa, setNeedsMfa] = useState(false);
    const {fieldErrors, clearFieldError, showIssues, clearAll} = useFieldErrors(FIELDS);

    const cancelMfa = () => {
        setNeedsMfa(false);
        setMfaCode("");
    };

    useImperativeHandle(innerRef, () => ({
        success: (data) => {
            if (data.mfaActivated) {
                setNeedsMfa(true);
                return;
            }
            if (data.token && data.refreshToken) {
                dispatch(logIn({token: data.token, refreshToken: data.refreshToken}));
                onLoggedIn();
            }
        },
        error: cancelMfa,
    }));

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (busy) return;

        const parsed = loginFormSchema(languageCode, {
            emailLabel: resolveLanguageKey("form.emailLabel"),
            passwordLabel: resolveLanguageKey("form.passwordLabel"),
            mfaCodeLabel: resolveLanguageKey("form.mfaCodeLabel"),
        }).safeParse({
            username: username.trim(),
            password,
            ...(needsMfa ? {mfaCode: mfaCode.trim() || undefined} : {}),
        });

        if (!parsed.success) {
            showIssues(parsed.error.issues);
            return;
        }

        clearAll();
        onFilterChange(parsed.data);
    };

    return {
        username, setUsername,
        password, setPassword,
        mfaCode, setMfaCode,
        needsMfa, cancelMfa,
        fieldErrors, clearFieldError,
        handleSubmit,
    };
}
