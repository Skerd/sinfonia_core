import {compose} from "redux";
import {useEffect, useState, type ReactNode} from "react";
import {BadgeAlert, BadgeCheck, Pencil} from "lucide-react";
import {Input} from "@coreModule/components/ui/input.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {EmailPreferencesFormResponse} from "armonia/src/modules/core/api/user/private/data/emailPreferences.form.response.type.ts";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Form, FormControl, FormDescription, FormField, FormItem, FormMessage} from "@coreModule/components/ui/form.tsx";
import {updateEmailPreferenceFormSchema} from "armonia/src/modules/core/api/user/private/data/updateEmailPreference.form.validator.ts";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@coreModule/components/ui/tooltip.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import UpdateEmail from "@coreModule/clients/panel/private/accountSettings/account/userInfo/email/updateEmail.tsx";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import SimpleError from "@coreModule/components/custom/errors/errorViewWrapper.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";

type AccountProfileEmailProps = WithLanguageType & WithAxiosType<EmailPreferencesFormResponse, any> & {
    onUpdate?: Function,
    specificUserId?: string,
    defaultValue?: string,
    defaultVerified?: boolean,
    defaultUnverifiedEmail?: string,
    invited?: boolean
}

function AccountProfileEmail({
    resolveLanguageKey,
    data,
    onUpdate = () => {},
    specificUserId,
    languageCode,
    loading,
    error,
    onFilterChange,
    defaultValue = "",
    defaultVerified = false,
    defaultUnverifiedEmail = "",
    invited
}: AccountProfileEmailProps) {

    const {read, write} = useAccess("users", !specificUserId ? "self" : "others");
    const [unverifiedEmail, setUnverifiedEmail] = useState<string>(defaultUnverifiedEmail);
    const [isEmailVerified, setIsEmailVerified] = useState<boolean>(defaultVerified);
    const [currentEmail, setCurrentEmail] = useState<string>(defaultValue);
    const [editing, setEditing] = useState(false);
    const [fireUpdate, setFireUpdate] = useState<number>(0);

    const formSchema = updateEmailPreferenceFormSchema(languageCode, resolveLanguageKey("form"));

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            newEmail: ""
        }
    });
    const newEmail = form.watch("newEmail");

    const [forceReload, setForceReload] = useState<number>(1);
    useEffect(() => {
        if( !!forceReload && !defaultValue && !!read.username ){
            onFilterChange({});
        }
    }, [forceReload, defaultValue, read]);
    useEffect(() => {
        if( !!data ){
            setCurrentEmail(data?.email || "");
            setIsEmailVerified(data?.verified || false);
            setUnverifiedEmail(data?.unverifiedEmail || "");
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

    if( !read.username ){
        return <HiddenElement />
    }

    const stopEditing = () => {
        setFireUpdate(0);
        form.reset({newEmail: ""});
        setEditing(false);
    };

    let verificationTooltip: ReactNode;
    if (invited) {
        verificationTooltip = (
            <p>{resolveLanguageKey("invitedUser")}: <span className="font-semibold">{currentEmail}</span></p>
        );
    } else if (isEmailVerified && !unverifiedEmail) {
        verificationTooltip = (
            <p>{resolveLanguageKey("emailVerified")}: <span className="font-semibold">{currentEmail}</span></p>
        );
    } else {
        verificationTooltip = (
            <div>
                <p>{resolveLanguageKey("emailVerified")}: <span className="font-semibold">{currentEmail}</span></p>
                <p>{resolveLanguageKey("emailNotVerified")}: <span className="font-semibold">{unverifiedEmail}</span></p>
            </div>
        );
    }

    const display = (
        <div className="flex flex-col gap-1">
            {currentEmail
                ? <p className="text-base font-medium text-foreground">{currentEmail}</p>
                : <p className="text-sm text-muted-foreground">{resolveLanguageKey("empty")}</p>}
            {!(isEmailVerified && !unverifiedEmail) && !!unverifiedEmail ? (
                <p className="text-sm text-muted-foreground">
                    {resolveLanguageKey("emailNotVerifiedSmall")}: {unverifiedEmail}
                </p>
            ) : (
                <p className="text-sm text-muted-foreground">{resolveLanguageKey("form.newEmailDescription")}</p>
            )}
        </div>
    );

    return (
        <section className="flex flex-col gap-1 rounded-lg border border-border/50 p-(--density-pad)">
            <div className="flex min-h-7 items-center justify-between gap-2">
                <div className="flex items-center gap-x-1">
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                {(isEmailVerified && !unverifiedEmail)
                                    ? <BadgeCheck size={20} className="text-info hover:cursor-pointer"/>
                                    : <BadgeAlert size={20} className="text-destructive hover:cursor-pointer"/>}
                            </TooltipTrigger>
                            <TooltipContent>{verificationTooltip}</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <h4 className="text-sm font-medium">{resolveLanguageKey("form.newEmailLabel")}</h4>
                </div>
                {!!write.username && !editing && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            form.setValue("newEmail", currentEmail);
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
                            name="newEmail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="flex gap-x-1.5">
                                            <div className="flex grow gap-x-1">
                                                <Input
                                                    id="newEmail"
                                                    type="text"
                                                    disabled={loading}
                                                    {...field}
                                                />
                                                <UpdateEmail
                                                    specificUserId={specificUserId}
                                                    fieldValue={newEmail !== currentEmail ? newEmail : ""}
                                                    fireUpdate={fireUpdate}
                                                    updateCanEdit={(value: boolean) => {
                                                        if (!value) stopEditing();
                                                    }}
                                                    onSuccess={() => {
                                                        try {
                                                            const tempEmail = newEmail;
                                                            // Pending verification: keep current username, track unverified email + surface activation tab
                                                            setIsEmailVerified(false);
                                                            setUnverifiedEmail(tempEmail);
                                                            setCurrentEmail(data?.email ?? currentEmail);
                                                            onUpdate(tempEmail);
                                                            stopEditing();
                                                        }catch(e) {
                                                            console.log(e)
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        {(isEmailVerified && !unverifiedEmail)
                                            ? resolveLanguageKey("form.newEmailDescription")
                                            : `${resolveLanguageKey("emailNotVerifiedSmall")}: ${unverifiedEmail}`}
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
    withLanguage("src/modules/core/clients/panel/private/accountSettings/account/userInfo/email/index.tsx"),
    withAxios(
        {
            method: "get",
            url: `/api/user/data/username`,
            data: {},
            addToHeader: [{
                whatToGet: "specificUserId",
                whereToPut: "specificUser"
            }],
        },
        true
    ),
    withDebug(true, true, "users")
)(AccountProfileEmail)
