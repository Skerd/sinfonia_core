import {compose} from "redux";
import {useEffect, useMemo, useState} from "react";
import {Pencil} from "lucide-react";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import timezones from "timezones.json";
import {UserProfileTimezoneFormResponseType} from "armonia/src/modules/core/api/user/private/data/userProfileTimezone.form.response.type.ts";
import {useDispatch} from "react-redux";
import {updateTimezone} from "@coreModule/helpers/redux/slices/authSlice.ts";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Form, FormControl, FormDescription, FormField, FormItem, FormMessage} from "@coreModule/components/ui/form.tsx";
import {updateUserProfileTimezoneFormSchema} from "armonia/src/modules/core/api/user/private/data/updateUserProfileTimezone.form.validator.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import SimpleError from "@coreModule/components/custom/errors/errorViewWrapper.tsx";
import UpdateTimeZone from "@coreModule/clients/panel/private/accountSettings/account/userInfo/timezone/updateTimeZone.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {SimpleSelect, SimpleSelectOption} from "@coreModule/components/viewEngine/widgets/inputs/simpleSelect.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";

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
    const [editing, setEditing] = useState(false);

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

    const stopEditing = () => {
        setFireUpdate(0);
        form.reset({newTimezone: currentTimeZone});
        setEditing(false);
    };

    const timezoneLabel = timezoneSelectItems?.find((option) => option.value === currentTimeZone)?.label ?? currentTimeZone;
    const display = (
        <div className="flex flex-col gap-1">
            {currentTimeZone
                ? <p className="text-base font-medium text-foreground">{timezoneLabel}</p>
                : <p className="text-sm text-muted-foreground">{resolveLanguageKey("empty")}</p>}
            <p className="text-sm text-muted-foreground">{resolveLanguageKey("form.newTimeZoneDescription")}</p>
        </div>
    );

    return (
        <section className="flex flex-col gap-1 rounded-lg border border-border/50 p-(--density-pad)">
            <div className="flex min-h-7 items-center justify-between gap-2">
                <h4 className="text-sm font-medium">{resolveLanguageKey("form.newTimeZoneLabel")}</h4>
                {!!write.timezone && !editing && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            form.setValue("newTimezone", currentTimeZone);
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
                            name="newTimezone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="flex gap-x-1.5">
                                            <div className="flex min-w-0 grow gap-x-1">
                                                <SimpleSelect
                                                    options={timezoneSelectItems}
                                                    value={field.value || currentTimeZone}
                                                    onValueChange={field.onChange}
                                                    placeholder={resolveLanguageKey("form.newTimeZoneLabel")}
                                                    disabled={loading}
                                                    className="min-w-0 w-full"
                                                />
                                                <UpdateTimeZone
                                                    specificUserId={specificUserId}
                                                    fieldValue={newTimezone !== currentTimeZone ? newTimezone : ""}
                                                    fireUpdate={fireUpdate}
                                                    updateCanEdit={(value: boolean) => {
                                                        if (!value) stopEditing();
                                                    }}
                                                    onSuccess={() => {
                                                        const tempValue = newTimezone;
                                                        if( !specificUserId ) {
                                                            dispatch(updateTimezone(tempValue));
                                                        }
                                                        form.setValue("newTimezone", tempValue);
                                                        setCurrentTimeZone(tempValue);
                                                        onTimeZoneUpdate(tempValue);
                                                        stopEditing();
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
            ) : (
                display
            )}
        </section>
    )
}

export default compose(
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
    withDebug(true, true, "users")
)(AccountProfileTimeZone)
