import {toast} from "sonner";
import {compose} from "redux";
import {Link} from "react-router-dom";
import {useImperativeHandle} from 'react';
import {Button} from "@coreModule/components/ui/button.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {DeactivateMfaFormType} from "armonia/src/modules/core/api/user/private/mfa/deactivateMfa.form.type.ts";
import {DeactivateMfaFormResponseType} from "armonia/src/modules/core/api/user/private/mfa/deactivateMfa.form.response.type.ts";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@coreModule/components/ui/form.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Check, X} from "lucide-react";
import {deactivateMfaFormSchema} from "armonia/src/modules/core/api/user/private/mfa/deactivateMfa.form.validator.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type AccountSecurityDeactivateOtpFormProps = WithAxiosType<DeactivateMfaFormResponseType, DeactivateMfaFormType> & WithLanguageType & {
    onSuccess?: Function,
    onCancel?: Function,
    specificUserId?: string
}

const AccountSecurityDeactivateOtpForm = ({
    resolveLanguageKey,
    languageCode,
    loading,
    onFilterChange,
    innerRef,
    onSuccess = () => {},
    onCancel = () => {},
    specificUserId
}:AccountSecurityDeactivateOtpFormProps) => {

    const {write} = useAccess("users", !specificUserId ? "self" : "others");
    const formSchema = deactivateMfaFormSchema(languageCode, resolveLanguageKey("form"));

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            mfaCode: ""
        }
    });

    const mfaCode = form.watch("mfaCode");

    useImperativeHandle(innerRef, () => ({
        success: (data: {sentEmail: boolean, disabledMfa: boolean}) => {
            if( data.sentEmail ){
                toast.success(resolveLanguageKey("checkEmail"));
                onCancel();
            }
            else if( data.disabledMfa ){
                toast.success(resolveLanguageKey("disabled"));
                onSuccess();
            }
            form.reset();
        }
    }));

    // Handle form submit with OTP code
    function onSubmit(formData: z.infer<typeof formSchema>) {
        if (!formData.mfaCode || formData.mfaCode.length !== 6) {
            // This should not happen due to validation, but handle it just in case
            return;
        }
        const postBody = {
            sendEmail: false,
            mfaCode: formData.mfaCode as string
        };
        onFilterChange(postBody);
    }

    // Handle send email request (bypasses form validation)
    const handleSendEmail = () => {
        const postBody: DeactivateMfaFormType = {
            sendEmail: true,
            mfaCode: ""
        };
        onFilterChange(postBody);
    };

    // Handle admin mode deactivation (no code needed)
    const handleAdminDeactivate = () => {
        const postBody: DeactivateMfaFormType = {
            sendEmail: false,
            mfaCode: "000000"
        };
        onFilterChange(postBody);
    };

    if( !write.mfaStatus ){
        return <HiddenElement />
    }

    return (
        <div className="space-y-4">
            {
                (!!specificUserId) ?
                    <div className="flex w-full justify-end">
                        <div className="w-full lg:w-auto flex grow justify-center items-center gap-2">

                            <div className="flex grow w-full items-center">
                                {resolveLanguageKey("deactivateNow")}
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="px-2 hover:bg-green-600 hover:text-white"
                                onClick={handleAdminDeactivate}
                                disabled={loading}
                            >
                                <Check className="h-4 w-4" />
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="px-2 hover:bg-red-400 hover:text-white"
                                onClick={() => {
                                    onCancel();
                                }}
                                disabled={loading}
                            >
                                <X className="h-4 w-4 hover:opacity-50" />
                            </Button>
                        </div>
                    </div>
                    :
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <p className="text-sm text-muted-foreground">1. {resolveLanguageKey("withOTPCodeDescription")}</p>

                            <div className="flex flex-col lg:flex-row gap-2">
                                <div className="w-full grid gap-2">
                                    <FormField
                                        control={form.control}
                                        name="mfaCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{resolveLanguageKey("form.mfaCodeLabel")}</FormLabel>
                                                <div className="flex items-center space-x-1">
                                                    <FormControl>
                                                        <Input
                                                            id="token"
                                                            type="text"
                                                            inputMode="numeric"
                                                            disabled={loading}
                                                            placeholder={resolveLanguageKey("form.mfaCodePlaceholder")}
                                                            className="flex grow"
                                                            value={field.value as string}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                // Only allow numeric input and max 6 characters
                                                                if (/^\d*$/.test(value) && value.length <= 6) {
                                                                    field.onChange(value);
                                                                }
                                                            }}
                                                            onBlur={field.onBlur}
                                                            name={field.name}
                                                            maxLength={6}
                                                        />
                                                    </FormControl>
                                                    <TooltipDisplayer tooltip={resolveLanguageKey("confirm")} contentClassName="text-sm">
                                                        <Button
                                                            type="submit"
                                                            variant="outline"
                                                            size="icon"
                                                            className={cn("h-full px-2", {"text-green-500 hover:border-green-400 hover:dark:border-green-400": (mfaCode?.length === 6)})}
                                                            disabled={loading || mfaCode?.length !== 6}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipDisplayer>
                                                    <TooltipDisplayer tooltip={resolveLanguageKey("cancel")} contentClassName="text-sm">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-full px-2 text-destructive hover:border-destructive hover:dark:border-destructive"
                                                            disabled={loading}
                                                            onClick={() => {
                                                                form.reset();
                                                                onCancel();
                                                            }}
                                                        >
                                                            <X className=" h-4 w-4 hover:opacity-50 " />
                                                        </Button>
                                                    </TooltipDisplayer>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="text-center text-sm">
                                {resolveLanguageKey("twoParts.noOtpCode")[0]}{" "}
                                <Link 
                                    to={loading ? "#" : "#"}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (!loading) {
                                            handleSendEmail();
                                        }
                                    }}
                                    className={`ml-auto inline-block text-sm underline ${loading ? "text-gray-400 cursor-not-allowed" : "cursor-pointer"}`}
                                >
                                    {resolveLanguageKey("twoParts.noOtpCode")[1]}
                                </Link>
                            </div>
                        </form>
                    </Form>
            }
        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/security/otp/deactivateOTP/deactivateOtp.form.tsx"),
    withAxios(
        {
            method: "delete",
            url: `/api/user/mfa`,
            data: {},
            addToHeader: [{
                whatToGet: "specificUserId",
                whereToPut: "specificUser"
            }]
        },
        true
    ),
    withDebug(true, true)
)(AccountSecurityDeactivateOtpForm)
