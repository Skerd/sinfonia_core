import { z } from 'zod'
import {compose} from "redux";
import { cn } from '@coreModule/components/lib/utils.ts'
import queryString from "query-string";
import {useDispatch} from "react-redux";
import { useForm } from 'react-hook-form';
import { Input } from '@coreModule/components/ui/input.tsx';
import { Loader2, LogIn } from 'lucide-react';
import {logIn} from "@coreModule/helpers/redux/slices/authSlice.ts";
import { Button } from '@coreModule/components/ui/button.tsx';
import {getClientConfig} from "@coreModule/helpers/general";
import { zodResolver } from '@hookform/resolvers/zod';
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import { PasswordInput } from '@coreModule/components/custom/passwordInput.tsx';
import {HTMLAttributes, useEffect, useImperativeHandle, useState} from 'react';
import {defaultSignInValues} from "@coreModule/helpers/defaultFormValues";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Link, useLocation, useNavigate, useParams} from "react-router-dom";
import {LoginFormType} from "armonia/src/modules/core/api/user/public/login/login.form.type.ts";
import { loginFormSchema } from "armonia/src/modules/core/api/user/public/login/login.form.validator.ts";
import DisableOTP from "@coreModule/clients/panel/public/auth/login/disableOTP.form.tsx";
import {InputOTP, InputOTPGroup, InputOTPSlot} from "@coreModule/components/ui/input-otp.tsx";
import {LoginFormResponseType, MFAEnabledLoginFormResponseType} from "armonia/src/modules/core/api/user/public/login/login.form.response.type.ts";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@coreModule/components/ui/form.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {IconKey} from "@tabler/icons-react";

interface SignInFormProps extends HTMLAttributes<HTMLFormElement>, WithLanguageType, WithAxiosType {
    onMfa: Function,
    openDisable: number,
    goLogin: number
}

function SignInForm({
    className,
    resolveLanguageKey,
    onFilterChange,
    innerRef,
    loading,
    languageCode,
    onMfa,
    openDisable,
    goLogin,
    ...props
}: SignInFormProps) {

    const config = getClientConfig();
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();
    const dispatch = useDispatch();

    const [inputMfa, setInputMfa] = useState<boolean>(false);
    const [disableOTP, setDisableOTP] = useState<number>(0);

    useImperativeHandle(innerRef, () => ({
        start: () => {},
        success: (data: LoginFormResponseType & MFAEnabledLoginFormResponseType) => {
            if (data.mfaActivated) {
                setInputMfa(true);
            }
            else {
                if( !!data.token && !!data.refreshToken ){
                    dispatch(logIn({token: data.token, refreshToken: data.refreshToken}));
                    navigate("/");
                }
            }
        },
        error: () => {
            setInputMfa(false);
            setDisableOTP(0);
            form.setValue("mfaCode", undefined);
        }
    }));

    useEffect(() => {
        if( !!location ){
            const queryParams = queryString.parse(location.search);
            if( !!queryParams.code ){
                onFilterChange({
                    thirdPartyAuthentication: {
                        platform: params.platform,
                        code: queryParams.code
                    }
                });
            }
        }
    }, [location]);
    useEffect(() => {
        onMfa(inputMfa);
    }, [inputMfa]);
    useEffect(() => {
        setDisableOTP(openDisable);
    }, [openDisable]);
    useEffect(() => {
        setInputMfa(false);
    }, [goLogin]);

    const formSchema = loginFormSchema(languageCode, resolveLanguageKey("form"));
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultSignInValues(),
    });
    const mfaCode = form.watch("mfaCode");

    function onSubmit(data: z.infer<typeof formSchema>) {
        const postBody: LoginFormType = {
            username: data.username,
            password: data.password,
            mfaCode: data.mfaCode
        };
        onFilterChange({...postBody});
    }

    if( inputMfa ){
        return (
            <>
                <DisableOTP
                    openNow={disableOTP}
                    username={form.watch("username")}
                    password={form.watch("password")}
                    onRequestSent={() => {
                        setInputMfa(false);
                        setDisableOTP(0);
                    }}
                />
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className={cn('grid gap-2', className)}
                        {...props}
                    >
                        <FormField
                            control={form.control}
                            name="mfaCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <InputOTP
                                            maxLength={6}
                                            {...field}
                                            disabled={loading}
                                            containerClassName='justify-center sm:[&>[data-slot="input-otp-group"]>div]:w-12'
                                        >
                                            <InputOTPGroup>
                                                <InputOTPSlot index={0} />
                                                <InputOTPSlot index={1} />
                                                <InputOTPSlot index={2} />
                                                <InputOTPSlot index={3} />
                                                <InputOTPSlot index={4} />
                                                <InputOTPSlot index={5} />
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button className='mt-2' disabled={mfaCode?.length !== 6 || loading}>
                            {(loading) ? <Loader2 className='animate-spin' /> : <IconKey /> }
                            {resolveLanguageKey("verify")}
                        </Button>
                    </form>
                </Form>
            </>
        )
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className={cn('grid gap-3', className)}
                {...props}
            >
                <FormField
                    control={form.control}
                    name='username'
                    disabled={loading}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{resolveLanguageKey("form.emailLabel")}</FormLabel>
                            <FormControl>
                                <Input placeholder={resolveLanguageKey("form.emailPlaceholder")} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name='password'
                    disabled={loading}
                    render={({ field }) => (
                        <FormItem className='relative'>
                            <FormLabel>{resolveLanguageKey("form.passwordLabel")}</FormLabel>
                            <FormControl>
                                <PasswordInput placeholder={resolveLanguageKey("form.passwordPlaceholder")} {...field} />
                            </FormControl>
                            <FormMessage />
                            {
                                config.layout.activateForgetPassword &&
                                <Link to='/authenticate/requestResetPassword' className='text-muted-foreground absolute end-0 -top-0.5 text-sm font-medium hover:opacity-75'>
                                    {resolveLanguageKey("forgotPassword")}
                                </Link>
                            }
                        </FormItem>
                    )}
                />
                <Button className='mt-2' disabled={loading}>
                    {(loading) ? <Loader2 className='animate-spin' /> : <LogIn />}
                    {resolveLanguageKey("signInButtonLabel")}
                </Button>
            </form>
        </Form>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/public/auth/login/signin.form.tsx"),
    withAxios(
        {
            method: "post",
            url: `/api/user/login`,
            data: {}
        },
        true
    ),
    withDebug(true, true)
)(SignInForm)
