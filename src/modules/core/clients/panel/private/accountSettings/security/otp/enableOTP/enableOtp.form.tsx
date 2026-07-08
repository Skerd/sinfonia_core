import {compose} from "redux";
import {useImperativeHandle, useEffect} from "react";
import {Button} from "@coreModule/components/ui/button.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {EnableMfaFormType} from "armonia/src/modules/core/api/user/private/mfa/enableMfa.form.type.ts";
import {GenerateMfaQrCodeFormResponseType} from "armonia/src/modules/core/api/user/private/mfa/generateMfaQrCode.form.response.type.ts";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@coreModule/components/ui/form.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Check, X} from "lucide-react";
import {enableMfaFormSchema} from "armonia/src/modules/core/api/user/private/mfa/enableMfa.form.validator.ts";
import CopyTooltip from "@coreModule/components/custom/copyTooltip.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {EnableMfaFormResponseType} from "armonia/src/modules/core/api/user/private/mfa/enableMfa.form.response.type.ts";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@coreModule/components/ui/tooltip.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type AccountSecurityEnableOtpFormProps = WithLanguageType & WithAxiosType<EnableMfaFormResponseType, EnableMfaFormType> & {
    specificUserId?: string,
    generatedOtpData: GenerateMfaQrCodeFormResponseType,
    onSuccess: Function,
    onCancel: Function,
}

function AccountSecurityEnableOtpForm({
    generatedOtpData,
    onSuccess,
    onCancel,
    resolveLanguageKey,
    innerRef,
    languageCode,
    onFilterChange,
    loading,
    specificUserId
}: AccountSecurityEnableOtpFormProps) {

    const {write} = useAccess("users", !specificUserId ? "self" : "others");
    // Create zod schema for enable MFA validation
    const formSchema = enableMfaFormSchema(languageCode, resolveLanguageKey("form"));

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            secret: generatedOtpData.secret,
            token: ""
        }
    });
    const token = form.watch("token");

    // Update secret when generatedOtpData changes
    useEffect(() => {
        if (generatedOtpData?.secret) {
            form.setValue("secret", generatedOtpData.secret);
        }
    }, [generatedOtpData, form]);

    useImperativeHandle(innerRef, () => ({
        success: () => {
            onSuccess();
        },
        error: () => {
            // onCancel();
        }
    }));

    function onSubmit(formData: z.infer<typeof formSchema>) {
        const postBody = {
            secret: formData.secret as string,
            token: formData.token as string
        };
        onFilterChange(postBody);
    }

    if( !write.mfaStatus ){
        return <HiddenElement />
    }

    return(
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    {
                        Object.values(resolveLanguageKey("steps") || {})?.map((step: string, index: number) => {
                            let showThis = step;
                            if (showThis.indexOf("!!!") > 0) {
                                showThis = showThis.replace("!!!", "Tick")
                            }
                            return (
                                <p key={"step_" + index}
                                   className="text-sm text-muted-foreground">{`${index + 1}. ${showThis}`}</p>
                            )
                        })
                    }
                </div>

                <div className="w-full flex flex-col items-center space-y-2">
                    <img src={generatedOtpData?.data_url} alt="QR Code"/>
                </div>

                <div className="flex items-center justify-center">
                    <CopyTooltip text={generatedOtpData.secret}>{resolveLanguageKey("manualSetup")}</CopyTooltip>
                </div>

                <div className="flex flex-col lg:flex-row gap-2">
                    <div className="w-full grid gap-2">
                        <FormField
                            control={form.control}
                            name="token"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>{resolveLanguageKey("form.tokenLabel")}</FormLabel>
                                    <div className="flex items-center space-x-2">

                                        <FormControl>
                                            <Input
                                                id="token"
                                                type="text"
                                                inputMode="numeric"
                                                disabled={loading}
                                                placeholder={resolveLanguageKey("form.tokenPlaceholder")}
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

                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        type="submit"
                                                        variant="outline"
                                                        size="icon"
                                                        className={cn("h-full px-2", {"text-green-500 hover:border-green-400 hover:dark:border-green-400": (token?.length === 6)})}
                                                        disabled={loading || token?.length !== 6}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>

                                                <TooltipContent side="top" className="text-sm">
                                                    <p>{resolveLanguageKey("confirm")}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
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
                                                </TooltipTrigger>

                                                <TooltipContent side="top" className="text-sm">
                                                    <p>{resolveLanguageKey("cancel")}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        </div>

                    <div className="w-full lg:w-auto flex justify-center items-start gap-2 mt-2 lg:mt-5">

                    </div>
                </div>
            </form>
        </Form>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/security/otp/enableOTP/enableOtp.form.tsx"),
    withAxios(
        {
            method: "put",
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
)(AccountSecurityEnableOtpForm)
