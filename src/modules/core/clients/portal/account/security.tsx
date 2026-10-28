import {useEffect, useState, type FormEvent} from "react";
import {compose} from "redux";
import {toast} from "sonner";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import {handleError} from "@coreModule/helpers/general/errors.ts";
import {changePasswordFormSchema} from "armonia/src/modules/core/api/user/private/data/changePassword.form.validator.ts";
import {enableMfaFormSchema} from "armonia/src/modules/core/api/user/private/mfa/enableMfa.form.validator.ts";
import {deactivateMfaFormSchema} from "armonia/src/modules/core/api/user/private/mfa/deactivateMfa.form.validator.ts";
import type {MfaStatusFormResponseType} from "armonia/src/modules/core/api/user/private/mfa/mfaStatus.form.response.type.ts";
import type {GenerateMfaQrCodeFormResponseType} from "armonia/src/modules/core/api/user/private/mfa/generateMfaQrCode.form.response.type.ts";
import FormStatus from "../shared/formStatus.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {FieldError} from "@coreModule/components/ui/field.tsx";

const LANGUAGE_PATH = "src/modules/core/clients/portal/account/security.tsx";

type PasswordErrors = Partial<Record<"currentPassword" | "newPassword" | "confirmPassword", string>>;

function SecurityPageInner({resolveLanguageKey, languageCode}: WithLanguageType) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
    const [savingPassword, setSavingPassword] = useState(false);

    const [mfaEnabled, setMfaEnabled] = useState(false);
    const [mfaLoading, setMfaLoading] = useState(true);
    const [setup, setSetup] = useState<GenerateMfaQrCodeFormResponseType | null>(null);
    const [mfaToken, setMfaToken] = useState("");
    const [mfaTokenError, setMfaTokenError] = useState<string | undefined>();
    const [disableCode, setDisableCode] = useState("");
    const [disableError, setDisableError] = useState<string | undefined>();
    const [mfaBusy, setMfaBusy] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await apiClient.get<MfaStatusFormResponseType>("/api/user/mfa");
                if (!cancelled) setMfaEnabled(res.data.enabled);
            } catch (err) {
                handleError(err, {context: "Shop security", showToast: true, fallbackMessage: resolveLanguageKey("mfaLoadError")});
            } finally {
                if (!cancelled) setMfaLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [resolveLanguageKey]);

    const handleChangePassword = async (event: FormEvent) => {
        event.preventDefault();
        if (savingPassword) return;

        const parsed = changePasswordFormSchema(languageCode, {
            currentPasswordLabel: resolveLanguageKey("form.currentPasswordLabel"),
            newPasswordLabel: resolveLanguageKey("form.newPasswordLabel"),
            confirmPasswordLabel: resolveLanguageKey("form.confirmPasswordLabel"),
        }).safeParse({currentPassword, newPassword, confirmPassword});

        if (!parsed.success) {
            const next: PasswordErrors = {};
            for (const issue of parsed.error.issues) {
                const key = issue.path[0];
                if (key === "currentPassword" || key === "newPassword" || key === "confirmPassword") {
                    next[key] = issue.message;
                }
            }
            setPasswordErrors(next);
            return;
        }

        setPasswordErrors({});
        setSavingPassword(true);
        try {
            await apiClient.patch("/api/user/data/password", parsed.data);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            toast.success(resolveLanguageKey("passwordSaved"));
        } catch (err) {
            handleError(err, {context: "Shop security", showToast: true, fallbackMessage: resolveLanguageKey("passwordSaveError")});
        } finally {
            setSavingPassword(false);
        }
    };

    const startMfaSetup = async () => {
        setMfaBusy(true);
        try {
            const res = await apiClient.post<GenerateMfaQrCodeFormResponseType>("/api/user/mfa", {});
            if (res.data.enabled) {
                setMfaEnabled(true);
                setSetup(null);
                return;
            }
            setSetup(res.data);
        } catch (err) {
            handleError(err, {context: "Shop security", showToast: true, fallbackMessage: resolveLanguageKey("mfaSetupError")});
        } finally {
            setMfaBusy(false);
        }
    };

    const confirmMfa = async (event: FormEvent) => {
        event.preventDefault();
        if (!setup || mfaBusy) return;

        const parsed = enableMfaFormSchema(languageCode, {
            secretLabel: resolveLanguageKey("form.secretLabel"),
            tokenLabel: resolveLanguageKey("form.mfaCodeLabel"),
        }).safeParse({secret: setup.secret, token: mfaToken.trim()});

        if (!parsed.success) {
            setMfaTokenError(parsed.error.issues.find((issue) => issue.path[0] === "token")?.message);
            return;
        }

        setMfaTokenError(undefined);
        setMfaBusy(true);
        try {
            await apiClient.put("/api/user/mfa", parsed.data);
            setMfaEnabled(true);
            setSetup(null);
            setMfaToken("");
            toast.success(resolveLanguageKey("mfaEnabled"));
        } catch (err) {
            handleError(err, {context: "Shop security", showToast: true, fallbackMessage: resolveLanguageKey("mfaEnableError")});
        } finally {
            setMfaBusy(false);
        }
    };

    const disableMfa = async (event: FormEvent) => {
        event.preventDefault();
        if (mfaBusy) return;

        const parsed = deactivateMfaFormSchema(languageCode, {
            mfaCodeLabel: resolveLanguageKey("form.mfaCodeLabel"),
        }).safeParse({mfaCode: disableCode.trim()});

        if (!parsed.success) {
            setDisableError(parsed.error.issues[0]?.message);
            return;
        }

        setDisableError(undefined);
        setMfaBusy(true);
        try {
            await apiClient.delete("/api/user/mfa", {data: parsed.data});
            setMfaEnabled(false);
            setDisableCode("");
            toast.success(resolveLanguageKey("mfaDisabled"));
        } catch (err) {
            handleError(err, {context: "Shop security", showToast: true, fallbackMessage: resolveLanguageKey("mfaDisableError")});
        } finally {
            setMfaBusy(false);
        }
    };

    return (
        <div className="mx-auto flex w-full max-w-lg flex-col gap-10">
            <div>
                <h1 className="font-display text-3xl font-semibold">{resolveLanguageKey("title")}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{resolveLanguageKey("subtitle")}</p>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleChangePassword} noValidate>
                <h2 className="font-display text-xl font-semibold">{resolveLanguageKey("passwordHeading")}</h2>
                <Label className="flex-col items-stretch gap-1.5">
                    {resolveLanguageKey("form.currentPasswordLabel")}
                    <Input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            aria-invalid={passwordErrors.currentPassword ? true : undefined}
          />
                    <FieldError>{passwordErrors.currentPassword}</FieldError>
                </Label>
                <Label className="flex-col items-stretch gap-1.5">
                    {resolveLanguageKey("form.newPasswordLabel")}
                    <Input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            aria-invalid={passwordErrors.newPassword ? true : undefined}
          />
                    <FieldError>{passwordErrors.newPassword}</FieldError>
                </Label>
                <Label className="flex-col items-stretch gap-1.5">
                    {resolveLanguageKey("form.confirmPasswordLabel")}
                    <Input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-invalid={passwordErrors.confirmPassword ? true : undefined}
          />
                    <FieldError>{passwordErrors.confirmPassword}</FieldError>
                </Label>
                <Button size="lg" type="submit" disabled={savingPassword} className="w-full">
                    {savingPassword ? resolveLanguageKey("saving") : resolveLanguageKey("savePassword")}
                </Button>
            </form>

            <section className="flex flex-col gap-4 border-t border-border pt-8">
                <h2 className="font-display text-xl font-semibold">{resolveLanguageKey("mfaHeading")}</h2>
                {mfaLoading ? (
                    <div className="h-24 animate-pulse rounded-xl bg-muted" />
                ) : mfaEnabled ? (
                    <form className="flex flex-col gap-4" onSubmit={disableMfa} noValidate>
                        <FormStatus tone="success">{resolveLanguageKey("mfaOn")}</FormStatus>
                        <Label className="flex-col items-stretch gap-1.5">
                            {resolveLanguageKey("form.mfaCodeLabel")}
                            <Input
                value={disableCode}
                inputMode="numeric"
                autoComplete="one-time-code"
                onChange={(e) => setDisableCode(e.target.value)}
                aria-invalid={disableError ? true : undefined}
              />
                            <FieldError>{disableError}</FieldError>
                        </Label>
                        <Button size="lg" type="submit" disabled={mfaBusy} className="w-full">
                            {mfaBusy ? resolveLanguageKey("saving") : resolveLanguageKey("disableMfa")}
                        </Button>
                    </form>
                ) : setup ? (
                    <form className="flex flex-col gap-4" onSubmit={confirmMfa} noValidate>
                        <p className="text-sm text-muted-foreground">{resolveLanguageKey("mfaScan")}</p>
                        {setup.data_url ? (
                            <img src={setup.data_url} alt={resolveLanguageKey("mfaQrAlt")} className="h-40 w-40 self-start rounded-md border border-border" />
                        ) : null}
                        <p className="break-all font-mono text-xs text-muted-foreground">{setup.secret}</p>
                        <Label className="flex-col items-stretch gap-1.5">
                            {resolveLanguageKey("form.mfaCodeLabel")}
                            <Input
                value={mfaToken}
                inputMode="numeric"
                autoComplete="one-time-code"
                onChange={(e) => setMfaToken(e.target.value)}
                aria-invalid={mfaTokenError ? true : undefined}
              />
                            <FieldError>{mfaTokenError}</FieldError>
                        </Label>
                        <Button size="lg" type="submit" disabled={mfaBusy} className="w-full">
                            {mfaBusy ? resolveLanguageKey("saving") : resolveLanguageKey("enableMfa")}
                        </Button>
                    </form>
                ) : (
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-muted-foreground">{resolveLanguageKey("mfaOff")}</p>
                        <Button size="lg" type="button" disabled={mfaBusy} onClick={startMfaSetup} className="w-full">
                            {mfaBusy ? resolveLanguageKey("saving") : resolveLanguageKey("startMfa")}
                        </Button>
                    </div>
                )}
            </section>
        </div>
    );
}

export default compose(
    withLanguage(LANGUAGE_PATH),
    withDebug(true, true),
)(SecurityPageInner);
