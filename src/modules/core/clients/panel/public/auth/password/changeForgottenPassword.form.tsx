import {IconCircleCheck, IconCircleX, IconLoader2, IconLogin2, IconShieldExclamation, IconShieldX} from "@tabler/icons-react";
import {z} from "zod";
import {compose} from "redux";
import {cn} from "@coreModule/components/lib/utils.ts";
import {useForm} from "react-hook-form";
import {Button} from "@coreModule/components/ui/button.tsx";
import {CardFooter} from "@coreModule/components/ui/card.tsx";
import {zodResolver} from "@hookform/resolvers/zod";
import {useNavigate, useParams} from "react-router-dom";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {PasswordInput} from "@coreModule/components/custom/inputs/passwordInput.tsx";
import {useEffect, useImperativeHandle, useState} from 'react';
import PasswordStrength from "@coreModule/components/custom/passwordStrength.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@coreModule/components/ui/card.tsx";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@coreModule/components/ui/form.tsx";
import GoBackToLogin from "@coreModule/clients/panel/public/auth/shared/goBackToLogin.tsx";
import {ChangeForgottenPasswordFormType} from "armonia/src/modules/core/api/user/public/forgotPassword/changeForgottenPassword.form.type.ts";
import {ChangeForgottenPasswordFormResponseType} from "armonia/src/modules/core/api/user/public/forgotPassword/changeForgottenPassword.form.response.type.ts";
import {changeForgottenPasswordFormSchema} from "armonia/src/modules/core/api/user/public/forgotPassword/changeForgottenPassword.form.validator.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";

const EMPTY_FORM_VALUES: ChangeForgottenPasswordFormType = {
    password: "",
    confirmPassword: "",
    resetPasswordCode: "",
};

const OPEN_RESET_LINK_REQUEST = {method: "post" as const, url: "/api/user/forgotPassword/openLink", data: {}};

type ChangeForgottenPasswordProps = WithLanguageType & WithAxiosType<ChangeForgottenPasswordFormResponseType, ChangeForgottenPasswordFormType> & {}

function ChangeForgottenPassword({
    onFilterChange = () => {},
    innerRef,
    languageCode,
    resolveLanguageKey,
    loading
}: ChangeForgottenPasswordProps){

    const navigate = useNavigate();
    const params = useParams();
    const [error, setError] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);

    const code = params.platform;
    useEffect(() => {
        if (!code) navigate("/authenticate/login");
    }, [code, navigate]);

    useImperativeHandle(innerRef, () => ({
        start: () => {},
        success: () => {setSuccess(true);},
        error: () => {setError(true);}
    }));

    const formSchema: any = changeForgottenPasswordFormSchema(languageCode, resolveLanguageKey("form"));
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: EMPTY_FORM_VALUES
    });

    // Silent check of the emailed code: the page shows its own verifying / invalid states.
    const [verification, setVerification] = useState({code, count: code ? 1 : 0});
    if (verification.code !== code) setVerification({code, count: code ? verification.count + 1 : verification.count});
    const {loading: verifyingResetPasswordLink, error: verifyError} = useHttpRequest(OPEN_RESET_LINK_REQUEST, {resetPasswordCode: code}, verification.count, true, {
        success: () => {
            if (code) form.setValue("resetPasswordCode", code);
        },
    });
    const errorVerifyingResetPasswordLink = !!verifyError;
    const password = form.watch("password")

    function onSubmit(data: z.infer<typeof formSchema>) {
        onFilterChange({
            password: data.password,
            confirmPassword: data.confirmPassword,
            resetPasswordCode: data.resetPasswordCode
        })
    }

    if( verifyingResetPasswordLink ){
        return (
            <Card className="gap-4 w-full h-fit">
                <CardHeader className="flex flex-col items-center justify-center text-center">
                    <IconShieldExclamation size={30} color="green" className="animate-pulse" />
                    <CardTitle className='text-lg tracking-tight'>{resolveLanguageKey("verifyingPasswordResetLinkTitle")}</CardTitle>
                    <CardDescription>{resolveLanguageKey("verifyingPasswordResetLinkDescription")}</CardDescription>
                </CardHeader>
                <CardFooter>
                    <GoBackToLogin />
                </CardFooter>
            </Card>
        )
    }
    if( errorVerifyingResetPasswordLink ){
        return (
            <Card className="gap-4 w-full h-fit">
                <CardHeader className="flex flex-col items-center justify-center text-center">
                    <IconShieldX size={30} color="var(--destructive)"/>
                    <CardTitle className='text-lg tracking-tight'>{resolveLanguageKey("errorVerifyingPasswordResetLinkTitle")}</CardTitle>
                    <CardDescription>{resolveLanguageKey("errorVerifyingPasswordResetLinkDescription")}</CardDescription>
                </CardHeader>
                <CardFooter>
                    <GoBackToLogin />
                </CardFooter>
            </Card>
        )
    }
    if( error ){
        return (
            <Card className="gap-4 w-full h-fit">
                <CardHeader className="flex flex-col items-center justify-center text-center">
                    <IconCircleX size={30} color="var(--destructive)" />
                    <CardTitle className='text-lg tracking-tight'>{resolveLanguageKey("errorChangingPasswordTitle")}</CardTitle>
                    <CardDescription>{resolveLanguageKey("errorChangingPasswordDescription")}</CardDescription>
                </CardHeader>
                <CardFooter>
                    <GoBackToLogin />
                </CardFooter>
            </Card>
        )
    }
    if( success ){
        return (
            <Card className="gap-4 w-full h-fit">
                <CardHeader className="flex flex-col items-center justify-center text-center">
                    <IconCircleCheck size={30} color="green"/>
                    <CardTitle className='text-lg tracking-tight'>{resolveLanguageKey("successChangingPasswordTitle")}</CardTitle>
                    <CardDescription>{resolveLanguageKey("successChangingPasswordDescription")}</CardDescription>
                </CardHeader>
                <CardFooter>
                    <GoBackToLogin />
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="gap-4 w-full h-fit">
            <CardHeader>
                <CardTitle className="text-lg tracking-tight">{resolveLanguageKey("title")}</CardTitle>
                <CardDescription>
                    {resolveLanguageKey("descriptionOne")} <br />
                    {resolveLanguageKey("descriptionTwo")}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className={cn('grid gap-4')}>
                        <FormField
                            control={form.control}
                            name='password'
                            disabled={loading}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{resolveLanguageKey("form.passwordLabel")}</FormLabel>
                                    <FormControl>
                                        <PasswordInput
                                            placeholder={resolveLanguageKey("form.passwordPlaceholder")}
                                            autoComplete="new-password"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {
                            !!password &&
                            <div className="flex justify-end">
                                <PasswordStrength password={password as string} />
                            </div>
                        }
                        <FormField
                            control={form.control}
                            name='confirmPassword'
                            disabled={loading}
                            render={({ field }) => (
                                <FormItem className='relative'>
                                    <FormLabel>{resolveLanguageKey("form.confirmPasswordLabel")}</FormLabel>
                                    <FormControl>
                                        <PasswordInput
                                            placeholder={resolveLanguageKey("form.confirmPasswordPlaceholder")}
                                            autoComplete="new-password"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button className='mt-2' disabled={loading}>
                            {(loading) ? <IconLoader2 className='animate-spin' /> : <IconLogin2 />}
                            {resolveLanguageKey("confirm")}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter>
                <GoBackToLogin />
            </CardFooter>
        </Card>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/public/auth/password/changeForgottenPassword.form.tsx"),
    withAxios(
        {
            method: "post",
            url: `/api/user/forgotPassword/changePassword`,
            data: {}
        },
        true
    ),
    withDebug(true, true, "users")
)(ChangeForgottenPassword)
