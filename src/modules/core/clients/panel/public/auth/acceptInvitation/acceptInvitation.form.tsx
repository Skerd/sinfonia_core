import {IconCircleCheck, IconCircleX, IconLoader2, IconLogin2, IconShieldExclamation, IconShieldX} from "@tabler/icons-react";
import {z} from "zod";
import {compose} from "redux";
import {cn} from "@coreModule/components/lib/utils.ts";
import {useForm} from "react-hook-form";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
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
import {acceptInvitationFormSchema} from "armonia/src/modules/core/api/user/public/acceptInvitation/acceptInvitation.form.validator.ts";
import {AcceptInvitationFormType} from "armonia/src/modules/core/api/user/public/acceptInvitation/acceptInvitation.form.type.ts";
import {AcceptInvitationFormResponseType} from "armonia/src/modules/core/api/user/public/acceptInvitation/acceptInvitation.form.response.type.ts";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";

const EMPTY_FORM_VALUES: AcceptInvitationFormType = {
    password: "",
    invitationCode: "",
};

const VALIDATE_INVITATION_REQUEST = {method: "post" as const, url: "/api/user/acceptInvitation/validate", data: {}};

type AcceptInvitationProps =  WithLanguageType & WithAxiosType<AcceptInvitationFormResponseType, AcceptInvitationFormType> & {}

function AcceptInvitation({
    onFilterChange = () => {},
    innerRef,
    languageCode,
    resolveLanguageKey,
    loading
}: AcceptInvitationProps){

    const navigate = useNavigate();
    const params = useParams();
    const [error, setError] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);

    const code = params.platform;
    useEffect(() => {
        if (!code) navigate("/authenticate/login");
    }, [code, navigate]);

    const formSchema: any = acceptInvitationFormSchema(languageCode, resolveLanguageKey("form"));
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: EMPTY_FORM_VALUES
    });

    // Silent check of the emailed code: the page shows its own verifying / invalid states.
    const [verification, setVerification] = useState({code, count: code ? 1 : 0});
    if (verification.code !== code) setVerification({code, count: code ? verification.count + 1 : verification.count});
    const {loading: verifyingInvitationCode, error: verifyError} = useHttpRequest(VALIDATE_INVITATION_REQUEST, {invitationCode: code}, verification.count, true, {
        success: () => {
            if (code) form.setValue("invitationCode", code);
        },
    });
    const errorVerifyingInvitationCode = !!verifyError;

    useImperativeHandle(innerRef, () => ({
        start: () => {},
        success: () => {setSuccess(true);},
        error: () => {setError(true);}
    }));
    const password = form.watch("password")

    function onSubmit(data: z.infer<typeof formSchema>) {
        const postBody: AcceptInvitationFormType = {
            password: data.password as string,
            invitationCode: data.invitationCode as string
        }
        onFilterChange(postBody)
    }

    if( verifyingInvitationCode ){
        return (
            <Card className="w-full gap-4 h-fit">
                <CardHeader className="flex flex-col items-center justify-center text-center">
                    <IconShieldExclamation size={30} color="green" className="animate-pulse" />
                    <CardTitle className='text-lg tracking-tight'>{resolveLanguageKey("verifyingInvitationCodeTitle")}</CardTitle>
                    <CardDescription>{resolveLanguageKey("verifyingInvitationCodeDescription")}</CardDescription>
                </CardHeader>
                <CardFooter>
                    <GoBackToLogin />
                </CardFooter>
            </Card>
        )
    }
    if( errorVerifyingInvitationCode ){
        return (
            <Card className="w-full gap-4 h-fit">
                <CardHeader className="flex flex-col items-center justify-center text-center">
                    <IconShieldX size={30} color="var(--destructive)"/>
                    <CardTitle className='text-lg tracking-tight'>{resolveLanguageKey("errorVerifyingInvitationCodeTitle")}</CardTitle>
                    <CardDescription>{resolveLanguageKey("errorVerifyingInvitationCodeDescription")}</CardDescription>
                </CardHeader>
                <CardFooter>
                    <GoBackToLogin />
                </CardFooter>
            </Card>
        )
    }
    if( error ){
        return (
            <Card className="w-full gap-4 h-fit">
                <CardHeader className="flex flex-col items-center justify-center text-center">
                    <IconCircleX size={30} color="var(--destructive)" />
                    <CardTitle className='text-lg tracking-tight'>{resolveLanguageKey("errorAcceptingInvitationTitle")}</CardTitle>
                    <CardDescription>{resolveLanguageKey("errorAcceptingInvitationDescription")}</CardDescription>
                </CardHeader>
                <CardFooter>
                    <GoBackToLogin />
                </CardFooter>
            </Card>
        )
    }
    if( success ){
        return (
            <Card className="w-full gap-4 h-fit">
                <CardHeader className="flex flex-col items-center justify-center text-center">
                    <IconCircleCheck size={30} color="green"/>
                    <CardTitle className='text-lg tracking-tight'>{resolveLanguageKey("successAcceptingInvitationTitle")}</CardTitle>
                    <CardDescription>{resolveLanguageKey("successAcceptingInvitationDescription")}</CardDescription>
                </CardHeader>
                <CardFooter>
                    <GoBackToLogin />
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="gap-4">
            <CardHeader>
                <CardTitle className="text-lg tracking-tight">{resolveLanguageKey("title")}</CardTitle>
                <CardDescription>{resolveLanguageKey("description")}</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className={cn('grid gap-3')}>
                        <FormField
                            control={form.control}
                            name='password'
                            disabled={loading}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{resolveLanguageKey("form.passwordLabel")}</FormLabel>
                                    <FormControl>
                                        <PasswordInput
                                            disabled={loading}
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
    withLanguage("src/modules/core/clients/panel/public/auth/acceptInvitation/acceptInvitation.form.tsx"),
    withAxios(
        {
            method: "post",
            url: `/api/user/acceptInvitation`,
            data: {}
        },
        true
    ),
    withDebug(true, true, "users")
)(AcceptInvitation)

