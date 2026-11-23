import {useEffect, useState, type FormEvent} from "react";
import {compose} from "redux";
import {useDispatch} from "react-redux";
import {toast} from "sonner";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {requestFromApi} from "@coreModule/helpers/apiClient/requestFromApi.ts";
import {handleError} from "@coreModule/helpers/general/errors.ts";
import {updateUserValue} from "@coreModule/helpers/redux/slices/authSlice.ts";
import {updateUserProfileNameFormSchema} from "armonia/src/modules/core/api/user/private/data/updateUserProfileName.form.validator.ts";
import {updateUserProfileSurnameFormSchema} from "armonia/src/modules/core/api/user/private/data/updateUserProfileSurname.form.validator.ts";
import {updatePhoneNumberFormSchema} from "armonia/src/modules/core/api/user/private/data/updatePhoneNumber.form.validator.ts";
import {updateEmailPreferenceFormSchema} from "armonia/src/modules/core/api/user/private/data/updateEmailPreference.form.validator.ts";
import type {UserProfileNameFormResponse} from "armonia/src/modules/core/api/user/private/data/userProfileName.form.response.type.ts";
import type {UserProfileSurnameFormResponse} from "armonia/src/modules/core/api/user/private/data/userProfileSurname.form.response.type.ts";
import type {PhoneNumberFormResponseType} from "armonia/src/modules/core/api/user/private/data/phoneNumber.form.response.type.ts";
import type {EmailPreferencesFormResponse} from "armonia/src/modules/core/api/user/private/data/emailPreferences.form.response.type.ts";
import FormStatus from "../shared/formStatus.tsx";
import {usePortalTitle} from "../shared/portalTitle.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {FieldError} from "@coreModule/components/ui/field.tsx";

const LANGUAGE_PATH = "src/modules/core/clients/portal/account/profile.tsx";

type FieldErrors = Partial<Record<"name" | "surname" | "phoneNumber" | "newEmail", string>>;

function ProfilePageInner({resolveLanguageKey, languageCode}: WithLanguageType) {
    usePortalTitle(resolveLanguageKey("title"));
    const dispatch = useDispatch();
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [email, setEmail] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [verified, setVerified] = useState(true);
    const [unverifiedEmail, setUnverifiedEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingEmail, setSavingEmail] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                // Silent each: one combined toast below if any of them fails.
                const [nameRes, surnameRes, phoneRes, emailRes] = await Promise.all([
                    requestFromApi<UserProfileNameFormResponse>({method: "get", url: "/api/user/data/name", silent: true}),
                    requestFromApi<UserProfileSurnameFormResponse>({method: "get", url: "/api/user/data/surname", silent: true}),
                    requestFromApi<PhoneNumberFormResponseType>({method: "get", url: "/api/user/data/phoneNumber", silent: true}),
                    requestFromApi<EmailPreferencesFormResponse>({method: "get", url: "/api/user/data/username", silent: true}),
                ]);
                if (cancelled) return;
                setName(nameRes.name ?? "");
                setSurname(surnameRes.surname ?? "");
                setPhoneNumber(phoneRes.phoneNumber ?? "");
                setEmail(emailRes.email ?? "");
                setVerified(emailRes.verified);
                setUnverifiedEmail(emailRes.unverifiedEmail ?? "");
            } catch (err) {
                handleError(err, {context: "Shop profile", showToast: true, fallbackMessage: resolveLanguageKey("loadError")});
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [resolveLanguageKey]);

    const handleSaveProfile = async (event: FormEvent) => {
        event.preventDefault();
        if (savingProfile) return;

        const nameParsed = updateUserProfileNameFormSchema(languageCode, {
            nameLabel: resolveLanguageKey("form.nameLabel"),
        }).safeParse({name: name.trim()});
        const surnameParsed = updateUserProfileSurnameFormSchema(languageCode, {
            surnameLabel: resolveLanguageKey("form.surnameLabel"),
        }).safeParse({surname: surname.trim()});
        const phoneParsed = updatePhoneNumberFormSchema(languageCode, {
            phoneNumberLabel: resolveLanguageKey("form.phoneLabel"),
        }).safeParse({phoneNumber: phoneNumber.trim()});

        const nextErrors: FieldErrors = {};
        if (!nameParsed.success) nextErrors.name = nameParsed.error.issues[0]?.message;
        if (!surnameParsed.success) nextErrors.surname = surnameParsed.error.issues[0]?.message;
        if (!phoneParsed.success) nextErrors.phoneNumber = phoneParsed.error.issues[0]?.message;
        if (Object.keys(nextErrors).length) {
            setFieldErrors((prev) => ({...prev, ...nextErrors}));
            return;
        }

        setFieldErrors({});
        setSavingProfile(true);
        try {
            // Silent each: one combined success or failure toast for the three fields.
            await Promise.all([
                requestFromApi({method: "patch", url: "/api/user/data/name", data: {name: name.trim()}, silent: true}),
                requestFromApi({method: "patch", url: "/api/user/data/surname", data: {surname: surname.trim()}, silent: true}),
                requestFromApi({method: "patch", url: "/api/user/data/phoneNumber", data: {phoneNumber: phoneNumber.trim()}, silent: true}),
            ]);
            dispatch(updateUserValue({field: "name", value: name.trim()}));
            dispatch(updateUserValue({field: "surname", value: surname.trim()}));
            dispatch(updateUserValue({field: "phoneNumber", value: phoneNumber.trim()}));
            toast.success(resolveLanguageKey("profileSaved"));
        } catch (err) {
            handleError(err, {context: "Shop profile", showToast: true, fallbackMessage: resolveLanguageKey("profileSaveError")});
        } finally {
            setSavingProfile(false);
        }
    };

    const handleSaveEmail = async (event: FormEvent) => {
        event.preventDefault();
        if (savingEmail) return;

        const parsed = updateEmailPreferenceFormSchema(languageCode, {
            newEmailLabel: resolveLanguageKey("form.emailLabel"),
        }).safeParse({newEmail: newEmail.trim()});
        if (!parsed.success) {
            setFieldErrors((prev) => ({...prev, newEmail: parsed.error.issues[0]?.message}));
            return;
        }

        setFieldErrors((prev) => {
            const next = {...prev};
            delete next.newEmail;
            return next;
        });
        setSavingEmail(true);
        try {
            await requestFromApi({method: "patch", url: "/api/user/data/username", data: {newEmail: newEmail.trim()}, silent: true});
            setUnverifiedEmail(newEmail.trim());
            setNewEmail("");
            toast.success(resolveLanguageKey("emailSaved"));
        } catch (err) {
            handleError(err, {context: "Shop profile", showToast: true, fallbackMessage: resolveLanguageKey("emailSaveError")});
        } finally {
            setSavingEmail(false);
        }
    };

    if (loading) {
        return <div className="h-48 animate-pulse rounded-xl bg-muted" />;
    }

    return (
        <div className="mx-auto flex w-full max-w-lg flex-col gap-10">
            <div>
                <h1 className="font-display text-3xl font-semibold">{resolveLanguageKey("title")}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{resolveLanguageKey("subtitle")}</p>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleSaveProfile} noValidate>
                <Label className="flex-col items-stretch gap-1.5">
                    {resolveLanguageKey("form.nameLabel")}
                    <Input
            value={name}
            autoComplete="given-name"
            onChange={(e) => setName(e.target.value)}
            aria-invalid={fieldErrors.name ? true : undefined}
          />
                    <FieldError>{fieldErrors.name}</FieldError>
                </Label>
                <Label className="flex-col items-stretch gap-1.5">
                    {resolveLanguageKey("form.surnameLabel")}
                    <Input
            value={surname}
            autoComplete="family-name"
            onChange={(e) => setSurname(e.target.value)}
            aria-invalid={fieldErrors.surname ? true : undefined}
          />
                    <FieldError>{fieldErrors.surname}</FieldError>
                </Label>
                <Label className="flex-col items-stretch gap-1.5">
                    {resolveLanguageKey("form.phoneLabel")}
                    <Input
            type="tel"
            value={phoneNumber}
            autoComplete="tel"
            onChange={(e) => setPhoneNumber(e.target.value)}
            aria-invalid={fieldErrors.phoneNumber ? true : undefined}
          />
                    <FieldError>{fieldErrors.phoneNumber}</FieldError>
                </Label>
                <Button size="lg" type="submit" disabled={savingProfile} className="w-full">
                    {savingProfile ? resolveLanguageKey("saving") : resolveLanguageKey("saveProfile")}
                </Button>
            </form>

            <form className="flex flex-col gap-4 border-t border-border pt-8" onSubmit={handleSaveEmail} noValidate>
                <h2 className="font-display text-xl font-semibold">{resolveLanguageKey("emailHeading")}</h2>
                <p className="text-sm text-muted-foreground">
                    {resolveLanguageKey("currentEmail")}: {email}
                    {verified ? "" : ` (${resolveLanguageKey("unverified")})`}
                </p>
                {unverifiedEmail ? (
                    <FormStatus>{resolveLanguageKey("pendingEmail").replace("{email}", unverifiedEmail)}</FormStatus>
                ) : null}
                <Label className="flex-col items-stretch gap-1.5">
                    {resolveLanguageKey("form.newEmailLabel")}
                    <Input
            type="email"
            value={newEmail}
            autoComplete="email"
            onChange={(e) => setNewEmail(e.target.value)}
            aria-invalid={fieldErrors.newEmail ? true : undefined}
          />
                    <FieldError>{fieldErrors.newEmail}</FieldError>
                </Label>
                <Button size="lg" type="submit" disabled={savingEmail} className="w-full">
                    {savingEmail ? resolveLanguageKey("saving") : resolveLanguageKey("saveEmail")}
                </Button>
            </form>
        </div>
    );
}

export default compose(
    withLanguage(LANGUAGE_PATH),
    withDebug(true, true),
)(ProfilePageInner);
