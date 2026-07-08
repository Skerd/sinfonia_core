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
import {PasswordInput} from "@coreModule/components/custom/passwordInput.tsx";
import {useEffect, useImperativeHandle, useState} from 'react';
import PasswordStrength from "@coreModule/components/custom/passwordStrength.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {defaultAcceptInvitationValues} from "@coreModule/helpers/defaultFormValues";
import {CircleCheckBig, CircleX, Loader2, LogIn, ShieldAlert, ShieldBan} from "lucide-react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@coreModule/components/ui/card.tsx";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@coreModule/components/ui/form.tsx";
import GoBackToLogin from "@coreModule/clients/panel/public/auth/shared/goBackToLogin.tsx";
import {acceptInvitationFormSchema} from "armonia/src/modules/core/api/user/public/acceptInvitation/acceptInvitation.form.validator.ts";
import {AcceptInvitationFormType} from "armonia/src/modules/core/api/user/public/acceptInvitation/acceptInvitation.form.type.ts";
import {AcceptInvitationFormResponseType} from "armonia/src/modules/core/api/user/public/acceptInvitation/acceptInvitation.form.response.type.ts";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";

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
    const [verifyingInvitationCode, setVerifyingInvitationCode] = useState<boolean>(false);
    const [errorVerifyingInvitationCode, setErrorVerifyingInvitationCode] = useState<boolean>(false);
    const [error, setError] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);

    const formSchema: any = acceptInvitationFormSchema(languageCode, resolveLanguageKey("form"));
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultAcceptInvitationValues()
    });

    useEffect(() => {
        if( !!params.platform ){
            const currCode = params.platform;
            if( !!currCode ){
                setVerifyingInvitationCode(true);
                setErrorVerifyingInvitationCode(false);
                apiClient.post(`/api/user/acceptInvitation/validate`, {invitationCode: currCode})
                .then(() => {
                    form.setValue("invitationCode", currCode);
                })
                .catch(() => {
                    setErrorVerifyingInvitationCode(true);
                })
                .finally(() => {
                    setVerifyingInvitationCode(false);
                });
            }
        }
        else{
            navigate("/authenticate/login");
        }
    }, [params, form, navigate]);

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
                    <ShieldAlert size={30} color="green" className="animate-pulse" />
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
                    <ShieldBan size={30} color="#c82121"/>
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
                    <CircleX size={30} color="#c82121" />
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
                    <CircleCheckBig size={30} color="green"/>
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
                            {(loading) ? <Loader2 className='animate-spin' /> : <LogIn />}
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
    withDebug(true, true)
)(AcceptInvitation)

