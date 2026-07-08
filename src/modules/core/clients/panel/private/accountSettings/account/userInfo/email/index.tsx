import {compose} from "redux";
import {useEffect, useState} from "react";
import {Input} from "@coreModule/components/ui/input.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {EmailPreferencesFormResponse} from "armonia/src/modules/core/api/user/private/data/emailPreferences.form.response.type.ts";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@coreModule/components/ui/form.tsx";
import {updateEmailPreferenceFormSchema} from "armonia/src/modules/core/api/user/private/data/updateEmailPreference.form.validator.ts";
import {BadgeAlert, BadgeCheck} from "lucide-react";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@coreModule/components/ui/tooltip.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import UpdateEmail from "@coreModule/clients/panel/private/accountSettings/account/userInfo/email/updateEmail.tsx";
import Loader from "@coreModule/components/custom/loader.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import withHidden from "@coreModule/helpers/hocs/withHidden.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

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
    // onUpdate = () => {},
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
    const [canEdit, setCanEdit] = useState<boolean>(false);
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
    if( !!read.username && !write.username ){
        return (
            <div className="space-y-2">
                <div className="flex items-center space-x-1">
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                {
                                    (isEmailVerified && !unverifiedEmail) ?
                                    <BadgeCheck size={20} className="text-blue-500 hover:cursor-pointer"/>
                                    :
                                    <BadgeAlert size={20} className="text-red-500 hover:cursor-pointer"/>
                                }
                            </TooltipTrigger>
                            <TooltipContent>
                                {
                                    invited ?
                                    <>
                                        <p>{resolveLanguageKey("invitedUser")}: <span className="font-semibold">{currentEmail}</span></p>
                                    </>
                                    :
                                    <>
                                        {
                                            (isEmailVerified && !unverifiedEmail) ?
                                            <p>{resolveLanguageKey("emailVerified")}: <span className="font-semibold">{currentEmail}</span></p>
                                            :
                                            <div>
                                                <p>{resolveLanguageKey("emailVerified")}: <span className="font-semibold">{currentEmail}</span></p>
                                                <p>{resolveLanguageKey("emailNotVerified")}: <span className="font-semibold">{unverifiedEmail}</span></p>
                                            </div>
                                        }
                                    </>
                                }
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <p className="text-sm leading-none font-medium">
                        {resolveLanguageKey("form.newEmailLabel")}
                    </p>
                </div>
                <div className="h-8 w-full min-w-0 rounded-lg border border-input bg-card px-2.5 py-1 text-base transition-colors outline-none text-muted-foreground hover:cursor-not-allowed">
                    {currentEmail}
                </div>
            </div>
        )
    }

    return(
        <Form {...form}>
            <form onSubmit={form.handleSubmit(() => { setFireUpdate(Date.now()); })} className="space-y-8">
                <FormField
                    control={form.control}
                    name="newEmail"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center space-x-1">
                                <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            {
                                                (isEmailVerified && !unverifiedEmail) ?
                                                <BadgeCheck size={20} className="text-blue-500 hover:cursor-pointer"/>
                                                :
                                                <BadgeAlert size={20} className="text-red-500 hover:cursor-pointer"/>
                                            }
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {
                                                invited ?
                                                <p>{resolveLanguageKey("invitedUser")}: <span className="font-semibold">{currentEmail}</span></p>
                                                :
                                                <>
                                                    {
                                                        (isEmailVerified && !unverifiedEmail) ?
                                                            <p>{resolveLanguageKey("emailVerified")}: <span className="font-semibold">{currentEmail}</span></p>
                                                            :
                                                            <div>
                                                                <p>{resolveLanguageKey("emailVerified")}: <span className="font-semibold">{currentEmail}</span></p>
                                                                <p>{resolveLanguageKey("emailNotVerified")}: <span className="font-semibold">{unverifiedEmail}</span></p>
                                                            </div>
                                                    }
                                                </>
                                            }
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <FormLabel>{resolveLanguageKey("form.newEmailLabel")}</FormLabel>
                            </div>
                            <FormControl>
                                <div className="flex space-x-1.5">
                                    <div className="flex grow space-x-1">
                                        <Input
                                            id="newEmail"
                                            type="text"
                                            disabled={loading || !canEdit}
                                            placeholder={currentEmail}
                                            {...field}
                                        />
                                        <UpdateEmail
                                            specificUserId={specificUserId}
                                            fieldValue={newEmail}
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
                                                try {
                                                    let tempEmail = newEmail;
                                                    form.reset();
                                                    // this is commented out, because email must be verified every time it changes
                                                    // if( specificUserId) {
                                                    //     setIsEmailVerified(true);
                                                    //     setUnverifiedEmail("");
                                                    //     setCurrentEmail(tempEmail);
                                                    //     onUpdate(tempEmail);
                                                    // }
                                                    // else {
                                                        setIsEmailVerified(false);
                                                        setUnverifiedEmail(tempEmail);
                                                        setCurrentEmail(data?.email ?? currentEmail);
                                                    // }
                                                }catch(e) {
                                                    console.log(e)
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </FormControl>
                            <FormDescription>
                                {
                                    (isEmailVerified && !unverifiedEmail) ?
                                    resolveLanguageKey("form.newEmailDescription")
                                    :
                                    `${resolveLanguageKey("emailNotVerifiedSmall")}: ${unverifiedEmail}`
                                }
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
    withDebug(true, true)
)(AccountProfileEmail)