import {compose} from "redux";
import {useEffect, useState} from "react";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@coreModule/components/ui/form.tsx";
import {updatePhoneNumberFormSchema} from "armonia/src/modules/core/api/user/private/data/updatePhoneNumber.form.validator.ts";
import {PhoneInput} from "@coreModule/components/ui/phone-input.tsx";
import {PhoneNumberFormResponseType} from "armonia/src/modules/core/api/user/private/data/phoneNumber.form.response.type.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Loader from "@coreModule/components/custom/loader.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import UpdatePhoneNumber from "@coreModule/clients/panel/private/accountSettings/account/userInfo/phoneNumber/updatePhoneNumber.tsx";
import withHidden from "@coreModule/helpers/hocs/withHidden.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type AccountProfilePhoneNumberProps = WithLanguageType & WithAxiosType<PhoneNumberFormResponseType> & {
    onUpdate?: Function,
    onCancel?: Function,
    specificUserId?: string,
    defaultValue?: string
}

function AccountProfilePhoneNumber({
    resolveLanguageKey,
    data,
    onUpdate = () => {},
    onCancel = () => {},
    specificUserId,
    languageCode,
    loading,
    error,
    onFilterChange,
    defaultValue = ""
}: AccountProfilePhoneNumberProps) {

    const {read, write} = useAccess("users", !specificUserId ? "self" : "others");
    const [currentPhoneNumber, setCurrentPhoneNumber] = useState<string>(defaultValue);
    const [fireUpdate, setFireUpdate] = useState<number>(0);
    const [canEdit, setCanEdit] = useState<boolean>(false);

    const formSchema = updatePhoneNumberFormSchema(languageCode, resolveLanguageKey("form"));

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {}
    });
    const newPhoneNumber = form.watch("phoneNumber");

    const [forceReload, setForceReload] = useState<number>(1);
    useEffect(() => {
        if( !!forceReload && !defaultValue ){
            onFilterChange({});
        }
    }, [forceReload, defaultValue]);
    useEffect(() => {
        if( !!data?.phoneNumber ){
            // form.setValue("phoneNumber", data.phoneNumber);
            setCurrentPhoneNumber(data.phoneNumber);
        }
    }, [data]);

    if( loading ){
        return <Loader />
    }
    if( (error || !data) && !defaultValue ){
        return (
            <SimpleError
                title={resolveLanguageKey("failTitle")}
                description={resolveLanguageKey("failTitleTooltip")}
                onClick={() => setForceReload(Date.now())}
            />
        )
    }

    if( !read.phoneNumber ){
        return <HiddenElement />
    }
    if( !!read.phoneNumber && !write.phoneNumber ){
        return (
            <div className="space-y-2">
                <div className="flex items-center space-x-1">
                    <p className="text-sm leading-none font-medium">
                        {resolveLanguageKey("form.phoneNumberNumberLabel")}
                    </p>
                </div>
                <div className="h-8 w-full min-w-0 rounded-lg border border-input bg-card px-2.5 py-1 text-base transition-colors outline-none text-muted-foreground hover:cursor-not-allowed">
                    {currentPhoneNumber}
                </div>
            </div>
        )
    }

    return(
        <Form {...form}>
            <form onSubmit={form.handleSubmit(() => { setFireUpdate(Date.now()); })} className="space-y-8">
                <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center space-x-1">
                                <FormLabel>{resolveLanguageKey("form.phoneNumberNumberLabel")}</FormLabel>
                            </div>
                            <FormControl>
                                <div className="flex space-x-1.5">
                                    <div className="flex grow space-x-1">
                                        <PhoneInput
                                            placeholder={currentPhoneNumber}
                                            {...field}
                                            defaultCountry="AL"
                                            className="w-full"
                                            disabled={loading || !canEdit}
                                        />
                                        <UpdatePhoneNumber
                                            specificUserId={specificUserId}
                                            fieldValue={newPhoneNumber !== currentPhoneNumber ? newPhoneNumber : ""}
                                            fireUpdate={fireUpdate}
                                            updateCanEdit={(value: boolean) => {
                                                if( value ) {
                                                    setCanEdit(true);
                                                }
                                                else {
                                                    setFireUpdate(0);
                                                    form.reset();
                                                }
                                            }}
                                            onSuccess={() => {
                                                let tempValue = newPhoneNumber;
                                                setFireUpdate(0);
                                                form.setValue("phoneNumber", tempValue);
                                                setCurrentPhoneNumber(tempValue);
                                                onUpdate(tempValue);
                                                onCancel();
                                            }}
                                        />
                                    </div>
                                </div>
                            </FormControl>
                            <FormDescription>
                                {resolveLanguageKey("form.phoneNumberNumberPlaceholder") || ""}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    )
}

export default compose(
    withHidden(),
    withLanguage("src/modules/core/clients/panel/private/accountSettings/account/userInfo/phoneNumber/index.tsx"),
    withAxios(
        {
            method: "get",
            url: `/api/user/data/phoneNumber`,
            data: {},
            addToHeader: [{
                whatToGet: "specificUserId",
                whereToPut: "specificUser"
            }],
        },
        true
    ),
    withDebug(true, true)
)(AccountProfilePhoneNumber)