import {compose} from "redux";
import {useEffect, useState} from "react";
import {Pencil} from "lucide-react";
import {Input} from "@coreModule/components/ui/input.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Form, FormControl, FormDescription, FormField, FormItem, FormMessage} from "@coreModule/components/ui/form.tsx";
import {updateUserProfileSurnameFormSchema} from "armonia/src/modules/core/api/user/private/data/updateUserProfileSurname.form.validator.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import SimpleError from "@coreModule/components/custom/errors/errorViewWrapper.tsx";
import UpdateSurname from "@coreModule/clients/panel/private/accountSettings/account/userInfo/surname/updateSurname.tsx";
import {UserProfileSurnameFormResponse} from "armonia/src/modules/core/api/user/private/data/userProfileSurname.form.response.type.ts";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";

type AccountProfileSurnameProps = WithLanguageType & WithAxiosType<UserProfileSurnameFormResponse> & {
    onUpdate?: Function,
    onCancel?: Function,
    specificUserId?: string,
    defaultValue?: string
}

function AccountProfileSurname({
    resolveLanguageKey,
    data,
    languageCode,
    onUpdate = () => {},
    onCancel = () => {},
    specificUserId,
    onFilterChange,
    loading,
    error,
    defaultValue= ""
}: AccountProfileSurnameProps) {

    const {read, write} = useAccess("users", !specificUserId ? "self" : "others");
    const [currentSurname, setCurrentSurname] = useState<string>(defaultValue);
    const [fireUpdate, setFireUpdate] = useState<number>(0);
    const [editing, setEditing] = useState(false);

    const formSchema = updateUserProfileSurnameFormSchema(languageCode, resolveLanguageKey("form"));

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            surname: ""
        }
    });
    const newSurname = form.watch("surname");

    const [forceReload, setForceReload] = useState<number>(1);
    useEffect(() => {
        if( !!forceReload && !defaultValue ){
            onFilterChange({});
        }
    }, [forceReload, defaultValue]);
    useEffect(() => {
        if( !!data?.surname ){
            setCurrentSurname(data.surname);
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

    if( !read.surname ){
        return <HiddenElement />
    }

    const stopEditing = () => {
        setFireUpdate(0);
        form.reset({surname: ""});
        setEditing(false);
    };

    const display = (
        <div className="flex flex-col gap-1">
            {currentSurname
                ? <p className="text-base font-medium text-foreground">{currentSurname}</p>
                : <p className="text-sm text-muted-foreground">{resolveLanguageKey("empty")}</p>}
            <p className="text-sm text-muted-foreground">{resolveLanguageKey("form.surnameDescription")}</p>
        </div>
    );

    return (
        <section className="flex flex-col gap-1 rounded-lg border border-border/50 p-(--density-pad)">
            <div className="flex min-h-7 items-center justify-between gap-2">
                <h4 className="text-sm font-medium">{resolveLanguageKey("form.surnameLabel")}</h4>
                {!!write.surname && !editing && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            form.setValue("surname", currentSurname);
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
                            name="surname"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="flex gap-x-1.5">
                                            <div className="flex grow gap-x-1">
                                                <Input
                                                    id="surname"
                                                    type="text"
                                                    disabled={loading}
                                                    {...field}
                                                />
                                                <UpdateSurname
                                                    specificUserId={specificUserId}
                                                    fieldValue={newSurname !== currentSurname ? newSurname : ""}
                                                    fireUpdate={fireUpdate}
                                                    updateCanEdit={(value: boolean) => {
                                                        if (!value) stopEditing();
                                                    }}
                                                    onSuccess={() => {
                                                        const tempValue = newSurname;
                                                        setCurrentSurname(tempValue);
                                                        onUpdate(tempValue);
                                                        onCancel();
                                                        stopEditing();
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        {resolveLanguageKey("form.surnameDescription") || ""}
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
    withLanguage("src/modules/core/clients/panel/private/accountSettings/account/userInfo/surname/index.tsx"),
    withAxios(
        {
            method: "get",
            url: `/api/user/data/surname`,
            data: {},
            addToHeader: [{
                whatToGet: "specificUserId",
                whereToPut: "specificUser"
            }],
        },
        true
    ),
    withDebug(true, true, "users")
)(AccountProfileSurname)
