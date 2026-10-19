import {compose} from "redux";
import {useEffect, useState} from "react";
import {Pencil} from "lucide-react";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Form, FormControl, FormDescription, FormField, FormItem, FormMessage} from "@coreModule/components/ui/form.tsx";
import {updatePhoneNumberFormSchema} from "armonia/src/modules/core/api/user/private/data/updatePhoneNumber.form.validator.ts";
import {PhoneInput} from "@coreModule/components/ui/phone-input.tsx";
import {PhoneNumberFormResponseType} from "armonia/src/modules/core/api/user/private/data/phoneNumber.form.response.type.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import SimpleError from "@coreModule/components/custom/errors/errorViewWrapper.tsx";
import UpdatePhoneNumber from "@coreModule/clients/panel/private/accountSettings/account/userInfo/phoneNumber/updatePhoneNumber.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";

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
    const [editing, setEditing] = useState(false);

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

    const stopEditing = () => {
        setFireUpdate(0);
        form.reset({});
        setEditing(false);
    };

    const display = (
        <div className="flex flex-col gap-1">
            {currentPhoneNumber
                ? <p className="text-base font-medium text-foreground">{currentPhoneNumber}</p>
                : <p className="text-sm text-muted-foreground">{resolveLanguageKey("empty")}</p>}
            <p className="text-sm text-muted-foreground">{resolveLanguageKey("form.phoneNumberNumberPlaceholder")}</p>
        </div>
    );

    return (
        <section className="flex flex-col gap-1 rounded-lg border border-border/50 p-(--density-pad)">
            <div className="flex min-h-7 items-center justify-between gap-2">
                <h4 className="text-sm font-medium">{resolveLanguageKey("form.phoneNumberNumberLabel")}</h4>
                {!!write.phoneNumber && !editing && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            form.setValue("phoneNumber", currentPhoneNumber);
                            setEditing(true);
                        }}
                    >
                        <Pencil size={14} />
                        {resolveLanguageKey("edit")}
                    </Button>
                )}
            </div>
            {editing ? (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(() => { setFireUpdate(Date.now()); })} className="flex flex-col gap-y-2">
                        <FormField
                            control={form.control}
                            name="phoneNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="flex gap-x-1.5">
                                            <div className="flex grow gap-x-1">
                                                <PhoneInput
                                                    {...field}
                                                    defaultCountry="AL"
                                                    className="w-full"
                                                    disabled={loading}
                                                />
                                                <UpdatePhoneNumber
                                                    specificUserId={specificUserId}
                                                    fieldValue={newPhoneNumber !== currentPhoneNumber ? newPhoneNumber : ""}
                                                    fireUpdate={fireUpdate}
                                                    updateCanEdit={(value: boolean) => {
                                                        if (!value) stopEditing();
                                                    }}
                                                    onSuccess={() => {
                                                        const tempValue = newPhoneNumber;
                                                        form.setValue("phoneNumber", tempValue);
                                                        setCurrentPhoneNumber(tempValue);
                                                        onUpdate(tempValue);
                                                        onCancel();
                                                        stopEditing();
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
            ) : (
                display
            )}
        </section>
    )
}

export default compose(
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
    withDebug(true, true, "users")
)(AccountProfilePhoneNumber)
