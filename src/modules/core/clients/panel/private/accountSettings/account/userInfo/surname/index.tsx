import {compose} from "redux";
import {useEffect, useState} from "react";
import {Input} from "@coreModule/components/ui/input.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@coreModule/components/ui/form.tsx";
import {updateUserProfileSurnameFormSchema} from "armonia/src/modules/core/api/user/private/data/updateUserProfileSurname.form.validator.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Loader from "@coreModule/components/custom/loader.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import UpdateSurname from "@coreModule/clients/panel/private/accountSettings/account/userInfo/surname/updateSurname.tsx";
import {UserProfileSurnameFormResponse} from "armonia/src/modules/core/api/user/private/data/userProfileSurname.form.response.type.ts";
import withHidden from "@coreModule/helpers/hocs/withHidden.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

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
    const [canEdit, setCanEdit] = useState<boolean>(false);

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
    if( !!read.surname && !write.surname ){
        return (
        <>
            <div className="space-y-2">
                <div className="flex items-center space-x-1">
                    <p className="text-sm leading-none font-medium">
                        {resolveLanguageKey("form.surnameLabel")}
                    </p>
                </div>
                <div className="h-8 w-full min-w-0 rounded-lg border border-input bg-card px-2.5 py-1 text-base transition-colors outline-none text-muted-foreground hover:cursor-not-allowed">
                    {currentSurname}
                </div>
            </div>
        </>
        )
    }

    return(
        <Form {...form}>
            <form onSubmit={form.handleSubmit(() => { setFireUpdate(Date.now()); })} className="space-y-8">
                <FormField
                    control={form.control}
                    name="surname"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{resolveLanguageKey("form.surnameLabel")}</FormLabel>
                            <FormControl>
                                <div className="flex space-x-1.5">
                                    <div className="flex grow space-x-1">
                                        <Input
                                            id="surname"
                                            type="text"
                                            disabled={loading || !canEdit}
                                            placeholder={currentSurname}
                                            {...field}
                                        />
                                        <UpdateSurname
                                            specificUserId={specificUserId}
                                            fieldValue={newSurname}
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
                                                let tempValue = newSurname;
                                                setFireUpdate(0);
                                                form.reset();
                                                setCurrentSurname(tempValue);
                                                onUpdate(tempValue);
                                                onCancel();
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
    )
}

export default compose(
    withHidden(),
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
    withDebug(true, true)
)(AccountProfileSurname)