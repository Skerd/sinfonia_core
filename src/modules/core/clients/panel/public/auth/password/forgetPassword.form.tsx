import {z} from "zod";
import {compose} from "redux";
import {cn} from "@coreModule/components/lib/utils.ts";
import {useForm} from "react-hook-form";
import {OctagonAlert} from "lucide-react";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {getClientConfig} from "@coreModule/helpers/general";
import { ArrowRight, Loader2 } from 'lucide-react';
import {zodResolver} from "@hookform/resolvers/zod";
import {useImperativeHandle, useState} from 'react';
import {SiTicktick} from "@icons-pack/react-simple-icons";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@coreModule/components/ui/form.tsx';
import {ForgotPasswordFormType} from "armonia/src/modules/core/api/user/public/forgotPassword/forgotPassword.form.type.ts";
import {ForgotPasswordFormResponseType} from "armonia/src/modules/core/api/user/public/forgotPassword/forgotPassword.form.response.type.ts";
import GoBackToLogin from "@coreModule/clients/panel/public/auth/shared/goBackToLogin.tsx";
import {CardFooter, Card, CardContent, CardDescription, CardHeader, CardTitle} from "@coreModule/components/ui/card.tsx";
import DontHaveAccountSignUp from "@coreModule/clients/panel/public/auth/shared/dontHaveAccountSignUp.tsx";
import {forgotPasswordFormSchema} from "armonia/src/modules/core/api/user/public/forgotPassword/forgotPassword.form.validator.ts";
import {defaultForgotPasswordValues} from "@coreModule/helpers/defaultFormValues";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";

type ForgotPasswordProps = WithLanguageType & WithAxiosType<ForgotPasswordFormResponseType, ForgotPasswordFormType> & {
    changeView?: Function
}

function ForgotPassword({
    onFilterChange = () => {},
    loading,
    innerRef,
    languageCode,
    resolveLanguageKey
}: ForgotPasswordProps){

    const config = getClientConfig();
    const [error, setError] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);

    useImperativeHandle(innerRef, () => ({
        start: () => {
            setError(false);
            setSuccess(false);
        },
        success: () => {
            setError(false);
            setSuccess(true);
        },
        error: () => {
        }
    }));

    const formSchema = forgotPasswordFormSchema(languageCode, resolveLanguageKey("form"));
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultForgotPasswordValues(),
    });

    function onSubmit(data: z.infer<typeof formSchema>) {
        onFilterChange({
            email: data.email
        })
    }

    if( error ){
        return (
            <Card className="gap-4 w-full h-fit">
                <CardHeader className="flex flex-col items-center justify-center text-center">
                    <OctagonAlert size={30} color="#c82121"/>
                    <CardTitle className='text-lg tracking-tight'>{resolveLanguageKey("fail")}</CardTitle>
                    <CardDescription>{resolveLanguageKey("failDescription")}</CardDescription>
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
                    <SiTicktick size={30} color="green"/>
                    <CardTitle className='text-center text-lg tracking-tight'>{resolveLanguageKey("success")}</CardTitle>
                    <CardDescription>{resolveLanguageKey("successDescription")}</CardDescription>
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
                <CardTitle className='text-lg tracking-tight'>
                    {resolveLanguageKey("title")}
                </CardTitle>
                <CardDescription>
                    {resolveLanguageKey("descriptionOne")} <br />
                    {resolveLanguageKey("descriptionTwo")}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className={cn('grid gap-2')}>
                        <FormField
                            control={form.control}
                            name='email'
                            disabled={loading}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder='name@example.com' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button className='mt-2' disabled={loading}>
                            {(loading) ? <Loader2 className='animate-spin' /> : <ArrowRight />}
                            {resolveLanguageKey("continue")}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
                {
                    config.layout.activateSignup &&
                    <>
                        <DontHaveAccountSignUp />
                        <div className='flex items-center w-full'>
                            <p className='flex grow border-t h-0.5'/>
                            <div className='flex justify-center text-xs uppercase text-center text-muted-foreground px-2'>
                                {resolveLanguageKey("or")}
                            </div>
                            <p className='flex grow border-t h-0.5'/>
                        </div>
                    </>
                }
                <GoBackToLogin />
            </CardFooter>
        </Card>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/public/auth/password/forgetPassword.form.tsx"),
    withAxios(
        {
            method: "post",
            url: `/api/user/forgotPassword`,
            data: {}
        },
        true
    ),
    withDebug(true, true)
)(ForgotPassword)
