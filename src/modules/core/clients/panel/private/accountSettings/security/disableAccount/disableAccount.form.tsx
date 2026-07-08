import {compose} from "redux";
import {useDispatch} from "react-redux";
import {TriangleAlert} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {useImperativeHandle, useState} from 'react';
import {Input} from "@coreModule/components/ui/input.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {signOut} from "@coreModule/helpers/redux/slices/authSlice.ts";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {Alert, AlertDescription, AlertTitle} from "@coreModule/components/ui/alert.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {DisableAccountFormType} from "armonia/src/modules/core/api/user/private/status/disableAccount.form.type.ts";
import {DisableAccountFormResponseType} from "armonia/src/modules/core/api/user/private/status/disableAccount.form.response.type.ts";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@coreModule/components/ui/form.tsx";
import ToggleUserActiveState from "@coreModule/clients/panel/private/accountSettings/security/disableAccount/toggleUserActiveState.tsx";
import {disableAccountFormSchema} from "armonia/src/modules/core/api/user/private/status/disableAccount.form.validator.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import withHidden from "@coreModule/helpers/hocs/withHidden.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type UserAccountSecurityDisableAccountFormProps = WithAxiosType<DisableAccountFormResponseType, DisableAccountFormType> & WithLanguageType & {
    specificUserId?: string,
    userData: any,
    onSuccess: Function
};

function UserAccountSecurityDisableAccountForm({
    resolveLanguageKey,
    languageCode,
    loading,
    onFilterChange,
    innerRef,
    specificUserId,
    userData,
    onSuccess
}: UserAccountSecurityDisableAccountFormProps){

    const {write} = useAccess("users", !specificUserId ? "self" : "others");
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [closeConfirm, setCloseConfirm] = useState<number>(0);
    const [disableUser, setDisableUser] = useState<{_id: string, username: string, active: boolean} | null>(null);

    // Create zod schema for disable account validation
    const formSchema = disableAccountFormSchema(languageCode, resolveLanguageKey("form"))
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: ""
        }
    });

    useImperativeHandle(innerRef, () => ({
        success: () => {
            setCloseConfirm(closeConfirm + 1);
            if( !!specificUserId ){
                onSuccess();
            }
            else{
                form.reset({
                    password: ""
                });
                dispatch(signOut());
                navigate("/authenticate/login");
            }
        }
    }));

    function onSubmit(formData: z.infer<typeof formSchema>) {
        const postBody = {
            password: formData.password as string
        };
        onFilterChange(postBody);
    }

    if( !write?.roles?.keys?.active ){
        return <HiddenElement />
    }

    return (
        <div className="space-y-4">
            <Alert>
                <TriangleAlert className="h-4 w-4"/>
                <AlertTitle>{resolveLanguageKey("title")}</AlertTitle>
                <AlertDescription>{resolveLanguageKey("description")}</AlertDescription>
            </Alert>

            {
                !specificUserId ?
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            {
                                Object.values(resolveLanguageKey("steps") || {})?.map((step: string, index: number) => {
                                    let showThis = step;
                                    if (showThis.indexOf("!!!") > 0) {
                                        showThis = showThis.replace("!!!", resolveLanguageKey("deactivateButton"))
                                    }
                                    return (
                                        <p key={"step_" + index}
                                           className="text-sm text-muted-foreground">{`${index + 1}. ${showThis}`}</p>
                                    )
                                })
                            }
                        </div>
                        <div className="flex flex-col lg:flex-row gap-2">
                            <div className="w-full grid gap-2">
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{resolveLanguageKey("form.passwordLabel")}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    id="password"
                                                    type="password"
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

                            <div className="w-full lg:w-auto flex justify-end items-start gap-2 mt-2 lg:mt-5">
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={loading}
                                >
                                    {resolveLanguageKey("deactivateButton")}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
                :
                <div>
                    <div className="flex justify-end items-end">
                        <Button
                            type="button"
                            variant={"destructive"}
                            onClick={() => {
                                setDisableUser({
                                    username: userData.username,
                                    active: true,
                                    _id: specificUserId
                                });
                            }}
                            disabled={loading}
                        >
                            {resolveLanguageKey("deactivateButton")}
                        </Button>
                    </div>
                    {
                        disableUser &&
                        <ToggleUserActiveState
                            active={disableUser.active}
                            specificUserId={disableUser._id}
                            hideCondition={!write?.roles?.keys?.active}
                            username={disableUser.username}
                            onSuccess={(newState: boolean) => {onSuccess(newState);}}
                            onComplete={() => {
                                setDisableUser(null);
                            }}
                        />
                    }
                </div>
            }
        </div>
    )
}

export default compose(
    withHidden(),
    withLanguage("src/modules/core/clients/panel/private/accountSettings/security/disableAccount/disableAccount.form.tsx"),
    withAxios(
        {
            url: `/api/user/status`,
            method: "DELETE",
            data: {},
            addToHeader: [{
                whatToGet: "specificUserId",
                whereToPut: "specificUser"
            }]
        },
        true
    ),
    withDebug(true, true)
)(UserAccountSecurityDisableAccountForm);
