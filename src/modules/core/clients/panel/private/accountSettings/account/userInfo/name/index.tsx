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
import {updateUserProfileNameFormSchema} from "armonia/src/modules/core/api/user/private/data/updateUserProfileName.form.validator.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import SimpleError from "@coreModule/components/custom/errors/errorViewWrapper.tsx";
import UpdateName from "@coreModule/clients/panel/private/accountSettings/account/userInfo/name/updateName.tsx";
import {UserProfileNameFormResponse} from "armonia/src/modules/core/api/user/private/data/userProfileName.form.response.type.ts";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";


type AccountProfileNameProps = WithLanguageType & WithAxiosType<UserProfileNameFormResponse, any> & {
    onUpdate?: Function,
    onCancel?: Function,
    specificUserId?: string,
    defaultValue?: string
}

function AccountProfileName({
    resolveLanguageKey,
    data,
    languageCode,
    onUpdate = () => {},
    onCancel = () => {},
    specificUserId,
    onFilterChange,
    loading,
    error,
    defaultValue = ""
}: AccountProfileNameProps) {

    const {read, write} = useAccess("users", !specificUserId ? "self" : "others");
    const [currentName, setCurrentName] = useState<string>(defaultValue);
    const [fireUpdate, setFireUpdate] = useState<number>(0);
    const [editing, setEditing] = useState(false);

    const formSchema = updateUserProfileNameFormSchema(languageCode, resolveLanguageKey("form"));

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: ""
        }
    });
    const newName = form.watch("name");

    const [forceReload, setForceReload] = useState<number>(1);
    useEffect(() => {
        if( !!forceReload && !defaultValue){
            onFilterChange({});
        }
    }, [forceReload, defaultValue]);
    useEffect(() => {
        if( !!data?.name ){
            setCurrentName(data.name);
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

    if( !read.name ){
        return <HiddenElement />
    }

    const stopEditing = () => {
        setFireUpdate(0);
        form.reset({name: ""});
        setEditing(false);
    };

    const display = (
        <div className="flex flex-col gap-1">
            {currentName
                ? <p className="text-base font-medium text-foreground">{currentName}</p>
                : <p className="text-sm text-muted-foreground">{resolveLanguageKey("empty")}</p>}
            <p className="text-sm text-muted-foreground">{resolveLanguageKey("form.nameDescription")}</p>
        </div>
    );

    return (
        <section className="flex flex-col gap-1 rounded-lg border border-border/50 p-(--density-pad)">
            <div className="flex min-h-7 items-center justify-between gap-2">
                <h4 className="text-sm font-medium">{resolveLanguageKey("form.nameLabel")}</h4>
                {!!write.name && !editing && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            form.setValue("name", currentName);
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
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="flex gap-x-1.5">
                                            <div className="flex grow gap-x-1">
                                                <Input
                                                    id="name"
                                                    type="text"
                                                    disabled={loading}
                                                    {...field}
                                                />
                                                <UpdateName
                                                    specificUserId={specificUserId}
                                                    fieldValue={newName !== currentName ? newName : ""}
                                                    fireUpdate={fireUpdate}
                                                    updateCanEdit={(value: boolean) => {
                                                        if (!value) stopEditing();
                                                    }}
                                                    onSuccess={() => {
                                                        const tempValue = newName;
                                                        setCurrentName(tempValue);
                                                        onUpdate(tempValue);
                                                        onCancel();
                                                        stopEditing();
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        {resolveLanguageKey("form.nameDescription") || ""}
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
    withLanguage("src/modules/core/clients/panel/private/accountSettings/account/userInfo/name/index.tsx"),
    withAxios(
        {
            method: "get",
            url: `/api/user/data/name`,
            data: {},
            addToHeader: [{
                whatToGet: "specificUserId",
                whereToPut: "specificUser"
            }],
        },
        true
    ),
    withDebug(true, true, "users")
)(AccountProfileName)
