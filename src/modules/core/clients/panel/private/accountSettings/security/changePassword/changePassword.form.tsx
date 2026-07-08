import {compose} from "redux";
import {useImperativeHandle} from 'react';
import {Input} from "@coreModule/components/ui/input.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@coreModule/components/ui/form.tsx";
import {changePasswordFormSchema} from "armonia/src/modules/core/api/user/private/data/changePassword.form.validator.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {ChangePasswordFormType} from "armonia/src/modules/core/api/user/private/data/changePassword.form.type.ts";
import {ChangePasswordFormResponseType} from "armonia/src/modules/core/api/user/private/data/changePassword.form.response.type.ts";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type UserAccountSecurityChangePasswordFormProps = WithLanguageType & WithAxiosType<ChangePasswordFormResponseType, ChangePasswordFormType> & {
    specificUserId: string
}

function UserAccountSecurityChangePasswordForm({
    specificUserId,
    resolveLanguageKey,
    onFilterChange,
    languageCode:
    languageCode,
    loading,
    innerRef
}: UserAccountSecurityChangePasswordFormProps) {

    const {write} = useAccess("users", !specificUserId ? "self" : "others");
    // Create zod schema for password change validation
    const formSchema = changePasswordFormSchema(languageCode, resolveLanguageKey("form"), !!specificUserId);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
        }
    });

    useImperativeHandle(innerRef, () => ({
        success: () => {
            form.reset();
        }
    }));

    function onSubmit(formData: z.infer<typeof formSchema>) {
        const postBody: ChangePasswordFormType = {
            currentPassword: !!specificUserId ? "----" : (formData.currentPassword as string) || "",
            newPassword: formData.newPassword as string,
            confirmPassword: formData.confirmPassword as string
        };
        onFilterChange(postBody);
    }

    if( !write.password ){
        return <HiddenElement />
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4">
                    {
                        !specificUserId &&
                        <FormField
                            control={form.control}
                            name="currentPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{resolveLanguageKey("form.currentPasswordLabel")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            id="currentPassword"
                                            type="password"
                                            disabled={loading}
                                            value={field.value as string}
                                            placeholder={resolveLanguageKey("form.currentPasswordPlaceholder")}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            name={field.name}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    }

                    <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{resolveLanguageKey("form.newPasswordLabel")}</FormLabel>
                                <FormControl>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        disabled={loading}
                                        placeholder={resolveLanguageKey("form.newPasswordPlaceholder")}
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
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{resolveLanguageKey("form.confirmPasswordLabel")}</FormLabel>
                                <FormControl>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder={resolveLanguageKey("form.confirmPasswordPlaceholder")}
                                        disabled={loading}
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
                </div>
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        disabled={loading}
                    >
                        {resolveLanguageKey("changePasswordButton")}
                    </Button>
                </div>
            </form>
        </Form>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/security/changePassword/changePassword.form.tsx"),
    withAxios(
        {
            method: "PATCH",
            url: `/api/user/data/password`,
            data: {},
            addToHeader: [{
                whatToGet: "specificUserId",
                whereToPut: "specificUser"
            }]
        },
        true
    ),
    withDebug(true, true)
)(UserAccountSecurityChangePasswordForm)