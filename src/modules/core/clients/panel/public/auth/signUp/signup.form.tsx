import {z} from "zod";
import {compose} from "redux";
import {cn} from "@coreModule/components/lib/utils.ts";
import {LoaderCircle, UserPlus} from "lucide-react";
import {useForm} from "react-hook-form";
import {useImperativeHandle} from 'react';
import {Input} from "@coreModule/components/ui/input.tsx";
import {useNavigate} from "react-router-dom";
import {Button} from "@coreModule/components/ui/button.tsx";
import {zodResolver} from "@hookform/resolvers/zod";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import PasswordStrength from "@coreModule/components/custom/passwordStrength.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@coreModule/components/ui/form.tsx";
import {defaultSignUpValues} from "@coreModule/helpers/defaultFormValues";
import {signupFormSchema} from "armonia/src/modules/core/api/user/public/signUp/signup.form.validator.ts";
import {SignUpFormType} from "armonia/src/modules/core/api/user/public/signUp/signup.form.type.ts";
import {SignupFormResponseType} from "armonia/src/modules/core/api/user/public/signUp/signup.form.response.type.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";

type SignUpFormProps = WithLanguageType & WithAxiosType<SignupFormResponseType, SignUpFormType> & {}

const SignUpForm = ({
    languageCode,
    onFilterChange,
    resolveLanguageKey,
    loading,
    innerRef
}: SignUpFormProps) => {

    const navigate = useNavigate();

    useImperativeHandle(innerRef, () => ({
        success: () => {
            navigate("/authenticate/login");
        }
    }));

    // Create zod schema for signup validation
    const formSchema = signupFormSchema(languageCode, resolveLanguageKey("form"));

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultSignUpValues()
    });

    const password = form.watch("password");

    function onSubmit(formData: z.infer<typeof formSchema>) {
        const postBody: SignUpFormType = {
            name: formData.name as string,
            surname: formData.surname as string,
            email: formData.email as string,
            password: formData.password as string,
            confirmPassword: formData.confirmPassword as string
        };
        onFilterChange(postBody);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={cn('grid gap-3')}>

                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{resolveLanguageKey("form.nameLabel")}</FormLabel>
                            <FormControl>
                                <Input
                                    id="name"
                                    disabled={loading}
                                    placeholder={resolveLanguageKey("form.namePlaceholder")}
                                    value={field.value as string}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="surname"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{resolveLanguageKey("form.surnameLabel")}</FormLabel>
                            <FormControl>
                                <Input
                                    id="surname"
                                    disabled={loading}
                                    placeholder={resolveLanguageKey("form.surnamePlaceholder")}
                                    value={field.value as string}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{resolveLanguageKey("form.emailLabel")}</FormLabel>
                            <FormControl>
                                <Input
                                    id="email"
                                    disabled={loading}
                                    placeholder={resolveLanguageKey("form.emailPlaceholder")}
                                    type="email"
                                    value={field.value as string}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{resolveLanguageKey("form.passwordLabel")}</FormLabel>
                            <FormControl>
                                <Input
                                    id="password"
                                    disabled={loading}
                                    type="password"
                                    value={field.value as string}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                />
                            </FormControl>
                            <FormMessage />
                            {
                                !!password &&
                                <div className="flex justify-end items-center">
                                    <PasswordStrength password={password as string || ""}/>
                                </div>
                            }
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{resolveLanguageKey("form.confirmPasswordLabel")}</FormLabel>
                            <FormControl>
                                <Input
                                    id="confirmPassword"
                                    disabled={loading}
                                    type="password"
                                    value={field.value as string}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                >
                    {loading ? <LoaderCircle className="animate-spin"/> :  <UserPlus />}
                    {resolveLanguageKey("signUpButtonLabel")}
                </Button>
            </form>
        </Form>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/public/auth/signUp/signup.form.tsx"),
    withAxios(
        {
            method: "post",
            url: `/api/user/signUp`,
            data: {}
        },
        true
    ),
    withDebug(true, true)
)(SignUpForm)
