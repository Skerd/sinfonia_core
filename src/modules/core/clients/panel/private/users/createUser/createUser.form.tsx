import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useEffect, useImperativeHandle} from "react";
import {Input} from "@coreModule/components/ui/input.tsx";
import {ApiSelect} from "@coreModule/components/custom/apiSelect";
import PasswordStrength from "@coreModule/components/custom/passwordStrength.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@coreModule/components/ui/form.tsx";
import {defaultCreateUserValues} from "@coreModule/helpers/defaultFormValues";
import {useDispatch} from "react-redux";
import {newUserCreated} from "@coreModule/helpers/redux/slices/uiSlice.ts";
import {LoaderCircle, UserPlus} from "lucide-react";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {CreateUserFormResponseType} from "armonia/src/modules/core/api/company/private/users/createUser.form.response.type.ts";
import {CreateUserFormType} from "armonia/src/modules/core/api/company/private/users/createUser.form.type.ts";
import {createCompanyUserFormSchema} from "armonia/src/modules/core/api/company/private/users/createUser.form.validator.ts";

type CreateUserFormProps = WithAxiosType<CreateUserFormResponseType, CreateUserFormType> & WithLanguageType & {
    onClose: Function,
    administration: boolean
    /** When set, successful create calls this with new id/label instead of only closing (inline ApiSelect flow). */
    inlineOnUserCreated?: (id: string, label: string) => void;
    /** Prefill the "name" field when opened from ApiSelect search (single-line search text). */
    prefillNameQuery?: string;
}

function CreateUserForm({
    resolveLanguageKey,
    languageCode,
    loading,
    onFilterChange,
    innerRef,
    onClose = () => {},
    administration,
    inlineOnUserCreated,
    prefillNameQuery,
}: CreateUserFormProps){

    const dispatch = useDispatch();
    const {create} = useAccess("users");
    const formSchema = createCompanyUserFormSchema(languageCode, resolveLanguageKey("form"));
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultCreateUserValues()
    });
    const password = form.watch("password");

    useEffect(() => {
        const q = prefillNameQuery?.trim();
        if (!q || !inlineOnUserCreated) return;
        const current = String(form.getValues("name") ?? "").trim();
        if (current) return;
        form.setValue("name", q, { shouldValidate: false });
    }, [prefillNameQuery, inlineOnUserCreated, form]);

    useImperativeHandle(innerRef, () => ({
        success: (data?: CreateUserFormResponseType) => {
            dispatch(newUserCreated());
            form.reset({
                name: "",
                surname: "",
                email: "",
                password: "",
                confirmPassword: "",
                userRole: ""
            });
            if (inlineOnUserCreated && data?._id) {
                const label = `${data.name ?? ""} ${data.surname ?? ""}`.trim() || data._id;
                inlineOnUserCreated(data._id, label);
                return;
            }
            onClose();
        }
    }));

    function onSubmit(formData: z.infer<typeof formSchema>) {
        const postBody = {
            email: formData.email as string,
            password: formData.password as string,
            confirmPassword: formData.confirmPassword as string,
            name: formData.name as string,
            surname: formData.surname as string,
            userRole: formData.userRole as string
        };
        onFilterChange(postBody);
    }

    if( !create ){
        return (<HiddenElement/>)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
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
                    </div>
                    <div>
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
                    </div>
                </div>

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
                            {
                                !!password &&
                                <div className="flex justify-end items-center">
                                    <PasswordStrength password={password as string || ""}/>
                                </div>
                            }
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

                <div className='flex items-center justify-end space-x-2'>
                    <Button
                        variant='outline'
                        disabled={loading}
                        type={"button"}
                        onClick={() => onClose()}
                    >
                        {resolveLanguageKey("cancel")}
                    </Button>
                    <Button
                        type="submit"
                        className=""
                        disabled={loading}
                    >
                        {loading ? <LoaderCircle className="animate-spin"/> : <UserPlus size={18} />}
                        {resolveLanguageKey("confirmButton")}
                    </Button>
                </div>

            </form>
        </Form>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/users/createUser/createUser.form.tsx"),
    withAxios(
        {
            method: "put",
            url: `/api/company/users`,
            data: {}
        },
        true
    ),
    withDebug(true, true)
)(CreateUserForm);
