import {compose} from "redux";
import {useEffect, useMemo, useState} from "react";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import timezones from "timezones.json";
import {UserProfileTimezoneFormResponseType} from "armonia/src/modules/core/api/user/private/data/userProfileTimezone.form.response.type.ts";
import {useDispatch} from "react-redux";
import {updateTimezone} from "@coreModule/helpers/redux/slices/authSlice.ts";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@coreModule/components/ui/form.tsx";
import {updateUserProfileTimezoneFormSchema} from "armonia/src/modules/core/api/user/private/data/updateUserProfileTimezone.form.validator.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Loader from "@coreModule/components/custom/loader.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import UpdateTimeZone from "@coreModule/clients/panel/private/accountSettings/account/userInfo/timezone/updateTimeZone.tsx";
import withHidden from "@coreModule/helpers/hocs/withHidden.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {SimpleSelect, SimpleSelectOption} from "@coreModule/components/custom/simpleSelect";

type AccountProfileTimeZoneProps = WithLanguageType & WithAxiosType<UserProfileTimezoneFormResponseType> & {
    onTimeZoneUpdate?: Function,
    specificUserId?: string,
    defaultValue?: string
}

function AccountProfileTimeZone({
    resolveLanguageKey,
    data,
    onTimeZoneUpdate = () => {},
    specificUserId,
    languageCode,
    onFilterChange,
    loading,
    error,
    defaultValue = ""
}: AccountProfileTimeZoneProps) {

    const {read, write} = useAccess("users", !specificUserId ? "self" : "others");
    const dispatch = useDispatch();
    const [currentTimeZone, setCurrentTimeZone] = useState<string>(defaultValue);
    const [forceReload, setForceReload] = useState<number>(1);
    const [fireUpdate, setFireUpdate] = useState<number>(0);
    const [canEdit, setCanEdit] = useState<boolean>(false);

    // Create zod schema for timezone validation
    const formSchema = updateUserProfileTimezoneFormSchema(languageCode, resolveLanguageKey("form"))

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            newTimezone: currentTimeZone || data?.timezone || ""
        }
    });
    const newTimezone = form.watch("newTimezone");

    useEffect(() => {
        if( !!forceReload && !defaultValue ){
            onFilterChange({});
        }
    }, [forceReload, defaultValue]);
    useEffect(() => {
        if( !!data?.timezone ){
            form.setValue("newTimezone", data.timezone);
            setCurrentTimeZone(data.timezone);
        }
    }, [data]);

    const timezoneSelectItems = useMemo(() => {
        if (!timezones) return;
        const seen = new Set<string>();
        const returnThis: SimpleSelectOption[] = [];
        timezones.sort((a, b) => a.offset - b.offset).forEach((timezone) => {
            const indexOf = timezone.text.indexOf(") ");
            const offsetText = timezone.text.substring(0, indexOf + 1);

            timezone.utc.forEach((utc) => {
                if (seen.has(utc)) return; // skip duplicates
                seen.add(utc);
                returnThis.push({
                    value: utc,
                    label:  offsetText + " " + utc
                });
            });
        });
        return returnThis;

    }, [])

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

    if( !read.timezone ){
        return <HiddenElement />
    }
    if( !!read.timezone && !write.timezone){
        return (
            <div className="space-y-2">
                <div className="flex items-center space-x-1">
                    <p className="text-sm leading-none font-medium">
                        {resolveLanguageKey("form.newTimeZoneLabel")}
                    </p>
                </div>
                <div className="h-8 w-full min-w-0 rounded-lg border border-input bg-card px-2.5 py-1 text-base transition-colors outline-none text-muted-foreground hover:cursor-not-allowed">
                    {currentTimeZone}
                </div>
            </div>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(() => { setFireUpdate(Date.now()); })} className="space-y-8">
                <FormField
                    control={form.control}
                    name="newTimezone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{resolveLanguageKey("form.newTimeZoneLabel")}</FormLabel>
                            <FormControl>
                                <div className="flex space-x-1.5">
                                    <div className="flex grow space-x-1">

                                        <SimpleSelect
                                            options={timezoneSelectItems}
                                            value={field.value || currentTimeZone}
                                            onValueChange={field.onChange}
                                            placeholder={resolveLanguageKey("form.newTimeZoneLabel")}
                                            disabled={loading || !canEdit}
                                            className="grow w-full"
                                        />

                                        <UpdateTimeZone
                                            specificUserId={specificUserId}
                                            fieldValue={newTimezone !== currentTimeZone ? newTimezone : ""}
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
                                                let tempValue = newTimezone;
                                                if( !specificUserId ) {
                                                    dispatch(updateTimezone(tempValue));
                                                }
                                                setFireUpdate(0);
                                                form.setValue("newTimezone", tempValue);
                                                setCurrentTimeZone(tempValue);
                                                onTimeZoneUpdate(tempValue);
                                            }}
                                        />
                                    </div>
                                </div>
                            </FormControl>
                            <FormDescription>
                                {resolveLanguageKey("form.newTimeZoneDescription") || ""}
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
    withLanguage("src/modules/core/clients/panel/private/accountSettings/account/userInfo/timezone/index.tsx"),
    withAxios(
        {
            method: "get",
            url: `/api/user/data/timezone`,
            data: {},
            addToHeader: [{
                whatToGet: "specificUserId",
                whereToPut: "specificUser"
            }],
        },
        true
    ),
    withDebug(true, true)
)(AccountProfileTimeZone)