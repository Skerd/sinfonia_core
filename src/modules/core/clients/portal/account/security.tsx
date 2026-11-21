import {useState, type FormEvent} from "react";
import {compose} from "redux";
import {toast} from "sonner";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
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

const MFA_STATUS_REQUEST = {method: "get" as const, url: "/api/user/mfa", data: {}, cache: true};
const CHANGE_PASSWORD_REQUEST = {method: "patch" as const, url: "/api/user/data/password", data: {}};
const MFA_SETUP_REQUEST = {method: "post" as const, url: "/api/user/mfa", data: {}};
const MFA_ENABLE_REQUEST = {method: "put" as const, url: "/api/user/mfa", data: {}};
const MFA_DISABLE_REQUEST = {method: "delete" as const, url: "/api/user/mfa", data: {}};

type PasswordErrors = Partial<Record<"currentPassword" | "newPassword" | "confirmPassword", string>>;

function SecurityPageInner({resolveLanguageKey, languageCode}: WithLanguageType) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});

    const [mfaEnabled, setMfaEnabled] = useState(false);
    const [setup, setSetup] = useState<GenerateMfaQrCodeFormResponseType | null>(null);
    const [mfaToken, setMfaToken] = useState("");
    const [mfaTokenError, setMfaTokenError] = useState<string | undefined>();
    const [disableCode, setDisableCode] = useState("");
    const [disableError, setDisableError] = useState<string | undefined>();

    // No translator: these keep their own toasts (`handleError` on failure, a message on success).
    const failed = (fallbackKey: string) => (err: unknown) =>
        handleError(err, {context: "Shop security", showToast: true, fallbackMessage: resolveLanguageKey(fallbackKey)});
    const mfaStatus = useHttpRequest<MfaStatusFormResponseType>(MFA_STATUS_REQUEST, {}, 1, true, {
        success: (data) => setMfaEnabled(data.enabled),
        error: failed("mfaLoadError"),
    });
    const mfaLoading = mfaStatus.loading;

    const [passwordRequest, setPasswordRequest] = useState({body: {} as Record<string, unknown>, count: 0});
    const passwordSave = useHttpRequest(CHANGE_PASSWORD_REQUEST, passwordRequest.body, passwordRequest.count, true, {
        success: () => {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            toast.success(resolveLanguageKey("passwordSaved"));
        },
        error: failed("passwordSaveError"),
    });
    const savingPassword = passwordSave.loading;

    const [setupCount, setSetupCount] = useState(0);
    const mfaSetup = useHttpRequest<GenerateMfaQrCodeFormResponseType>(MFA_SETUP_REQUEST, {}, setupCount, true, {
        success: (data) => {
            if (data.enabled) {
                setMfaEnabled(true);
                setSetup(null);
                return;
            }
            setSetup(data);
        },
        error: failed("mfaSetupError"),
    });

    const [enableRequest, setEnableRequest] = useState({body: {} as Record<string, unknown>, count: 0});
    const mfaEnable = useHttpRequest(MFA_ENABLE_REQUEST, enableRequest.body, enableRequest.count, true, {
        success: () => {
            setMfaEnabled(true);
            setSetup(null);
            setMfaToken("");
            toast.success(resolveLanguageKey("mfaEnabled"));
        },
        error: failed("mfaEnableError"),
    });

    const [disableRequest, setDisableRequest] = useState({body: {} as Record<string, unknown>, count: 0});
    const mfaDisable = useHttpRequest(MFA_DISABLE_REQUEST, disableRequest.body, disableRequest.count, true, {
        success: () => {
            setMfaEnabled(false);
            setDisableCode("");
            toast.success(resolveLanguageKey("mfaDisabled"));
        },
        error: failed("mfaDisableError"),
    });
    const mfaBusy = mfaSetup.loading || mfaEnable.loading || mfaDisable.loading;

    const handleChangePassword = (event: FormEvent) => {
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
        setPasswordRequest((current) => ({body: parsed.data, count: current.count + 1}));
    };

    const startMfaSetup = () => setSetupCount((count) => count + 1);

    const confirmMfa = (event: FormEvent) => {
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
        setEnableRequest((current) => ({body: parsed.data, count: current.count + 1}));
    };

    const disableMfa = (event: FormEvent) => {
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
        setDisableRequest((current) => ({body: parsed.data, count: current.count + 1}));
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
