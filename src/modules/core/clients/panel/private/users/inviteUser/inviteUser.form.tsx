import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {LoaderCircle, Send} from 'lucide-react'
import { Button } from '@coreModule/components/ui/button.tsx'
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@coreModule/components/ui/form.tsx'
import { Input } from '@coreModule/components/ui/input.tsx'
import { Textarea } from '@coreModule/components/ui/textarea.tsx'
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {useImperativeHandle} from "react";
import {ApiSelect} from "@coreModule/components/custom/apiSelect";
import {defaultInviteUserValues} from "@coreModule/helpers/defaultFormValues";
import {newUserCreated} from "@coreModule/helpers/redux/slices/uiSlice.ts";
import {useDispatch} from "react-redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {InviteUserFormResponseType} from "armonia/src/modules/core/api/company/private/users/inviteUser.form.response.type.ts";
import {InviteUserFormType} from "armonia/src/modules/core/api/company/private/users/inviteUser.form.type.ts";
import {inviteCompanyUserFormSchema} from "armonia/src/modules/core/api/company/private/users/inviteUser.form.validator.ts";


type InviteUserFormProps = WithLanguageType & WithAxiosType<InviteUserFormResponseType, InviteUserFormType> & {
    onClose: Function,
    administration: boolean
}

function InviteUserForm({
    resolveLanguageKey,
    languageCode,
    onClose = () => {},
    innerRef,
    onFilterChange,
    loading,
    administration
}: InviteUserFormProps) {

    const dispatch = useDispatch();
    const {create} = useAccess("users");

    const formSchema = inviteCompanyUserFormSchema(languageCode, resolveLanguageKey("form"));
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultInviteUserValues()
    })

    useImperativeHandle(innerRef, () => ({
        success: () => {
            dispatch(newUserCreated());
            form.reset({
                name: "",
                surname: "",
                email: "",
                welcomeMessage: "",
                userRole: ""
            });
            onClose();
        }
    }));

    function onSubmit(formData: z.infer<typeof formSchema>) {
        const postBody = {
            email: formData.email,
            name: formData.name,
            surname: formData.surname,
            userRole: formData.userRole,
            welcomeMessage: formData.welcomeMessage
        };
        onFilterChange(postBody);
    }

    if( !create ){
        return <HiddenElement/>
    }

    return (
        <>
            <Form {...form}>
                <form
                    id='user-invite-form'
                    onSubmit={form.handleSubmit(onSubmit)}
                    className='space-y-4'
                >
                    <FormField
                        control={form.control}
                        name='email'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{resolveLanguageKey("form.emailLabel")}</FormLabel>
                                <FormControl>
                                    <Input
                                        disabled={loading}
                                        type='email'
                                        placeholder={resolveLanguageKey("form.emailPlaceholder")}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <FormField
                                control={form.control}
                                name='name'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{resolveLanguageKey("form.nameLabel")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                disabled={loading}
                                                placeholder={resolveLanguageKey("form.namePlaceholder")}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div>
                            <FormField
                                control={form.control}
                                name='surname'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{resolveLanguageKey("form.surnameLabel")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                disabled={loading}
                                                placeholder={resolveLanguageKey("form.surnamePlaceholder")}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <FormField
                        control={form.control}
                        name="userRole"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{resolveLanguageKey("form.userRoleLabel")}</FormLabel>
                                <FormControl>
                                    <ApiSelect
                                        apiUrl="/api/user/permissions/accessible/roles/select"
                                        method="POST"
                                        postBody={{
                                            administration
                                        }}
                                        value={field.value as string}
                                        onValueChange={(value: string) => {
                                            field.onChange(value);
                                        }}
                                        placeholder={resolveLanguageKey("form.userRoleLabel")}
                                        disabled={loading}
                                        className="w-full"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name='welcomeMessage'
                        render={({ field }) => (
                            <FormItem className=''>
                                <FormLabel>{resolveLanguageKey("form.welcomeMessageLabel")}</FormLabel>
                                <FormControl>
                                    <Textarea
                                        disabled={loading}
                                        className='resize-none min-h-32 max-h-32'
                                        placeholder={resolveLanguageKey("form.welcomeMessagePlaceholder")}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className='flex items-center justify-end space-x-2'>
                        <Button variant='outline' type={"button"} disabled={loading} onClick={() => onClose()}>
                            {resolveLanguageKey("cancel")}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <LoaderCircle className="animate-spin"/> : <Send size={18} />}
                            {resolveLanguageKey("invite")}
                        </Button>
                    </div>
                </form>
            </Form>
        </>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/users/inviteUser/inviteUser.form.tsx"),
    withAxios(
        {
            method: "put",
            url: `/api/company/users/invite`,
            data: {}
        },
        true
    ),
    withDebug(true, true)
)(InviteUserForm)
